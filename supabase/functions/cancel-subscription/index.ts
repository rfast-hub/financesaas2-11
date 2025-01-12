import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('Authentication error:', userError)
      throw new Error('Not authenticated')
    }

    console.log('Fetching subscription for user:', user.id)

    // Get the subscription from our database
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (subscriptionError) {
      console.error('Subscription fetch error:', subscriptionError)
      throw new Error('Failed to fetch subscription details')
    }

    if (!subscriptionData?.subscription_id) {
      console.error('No active subscription found for user:', user.id)
      throw new Error('No active subscription found')
    }

    console.log('Found subscription:', subscriptionData.subscription_id)

    // First, retrieve the Stripe subscription to check its status
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionData.subscription_id)
    
    if (stripeSubscription.status === 'canceled') {
      console.log('Subscription already canceled in Stripe')
      // Update our database to reflect this
      await supabaseClient
        .from('subscriptions')
        .update({
          status: 'canceled',
          is_active: false,
          canceled_at: new Date().toISOString(),
        })
        .eq('subscription_id', subscriptionData.subscription_id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Subscription was already canceled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cancel the subscription in Stripe immediately
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionData.subscription_id, {
      cancel_at_period_end: false,
      prorate: true,
    })

    console.log('Stripe subscription canceled:', canceledSubscription.id)

    // Update our database
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'canceled',
        is_active: false,
        canceled_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionData.subscription_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update subscription status')
    }

    console.log('Database updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: canceledSubscription,
        message: 'Subscription successfully canceled and billing stopped immediately'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to cancel subscription',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})