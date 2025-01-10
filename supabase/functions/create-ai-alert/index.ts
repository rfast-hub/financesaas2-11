import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the JWT token from the request header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT and get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const { cryptocurrency } = await req.json()

    // Call Perplexity API for market analysis
    console.log('Calling Perplexity API for market analysis...')
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

    if (!perplexityResponse.ok) {
      console.error('Perplexity API error:', await perplexityResponse.text())
      throw new Error('Failed to get market analysis')
    }

    const aiResponse = await perplexityResponse.json()
    console.log('AI Response:', aiResponse)
    
    const analysis = JSON.parse(aiResponse.choices[0].message.content)
    console.log('Parsed analysis:', analysis)

    // Create the AI-generated alert
    const { data: alert, error } = await supabaseClient
      .from('price_alerts')
      .insert([
        {
          cryptocurrency,
          user_id: user.id,
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

    if (error) {
      console.error('Database error:', error)
      throw error
    }

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
    console.error('Error in create-ai-alert function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})