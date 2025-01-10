import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cryptocurrency } = await req.json()

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the user from the auth header
    const authHeader = req.headers.get('Authorization')!
    const user = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user.data.user) {
      throw new Error('No user found')
    }

    // Call Perplexity API for market analysis
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analyst. Analyze the current market conditions and suggest a price alert for the given cryptocurrency. Provide a target price and reasoning. Be specific and concise. Format your response as JSON with fields: target_price (number), condition (string: "above" or "below"), reasoning (string).'
          },
          {
            role: 'user',
            content: `Analyze ${cryptocurrency} and suggest a price alert based on current market conditions.`
          }
        ],
        temperature: 0.2,
      }),
    })

    const aiResponse = await perplexityResponse.json()
    const analysis = JSON.parse(aiResponse.choices[0].message.content)

    // Create the AI-generated alert
    const { data: alert, error } = await supabaseClient
      .from('price_alerts')
      .insert([
        {
          cryptocurrency,
          user_id: user.data.user.id,
          target_price: analysis.target_price,
          condition: analysis.condition,
          alert_type: 'price',
          ai_generated: true,
          ai_reasoning: analysis.reasoning,
          email_notification: true,
        }
      ])
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        message: `AI Alert created with target price $${analysis.target_price} when price goes ${analysis.condition} based on market analysis`,
        alert
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})