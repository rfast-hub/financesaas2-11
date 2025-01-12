import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
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
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Get the subscription from our database
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (subscriptionError || !subscriptionData?.subscription_id) {
      return new Response(
        JSON.stringify({ 
          error: 'No active subscription found',
          details: subscriptionError?.message 
        }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(
      subscriptionData.subscription_id,
      { cancel_at_period_end: false }
    )

    // Update our database
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
        subscription: canceledSubscription,
        message: 'Subscription successfully canceled'
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to cancel subscription',
        details: error.stack
      }),
      { 
        status: error.status || 500,
        headers: corsHeaders
      }
    )
  }
})