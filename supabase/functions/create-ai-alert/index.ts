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

    // First get current market data
    console.log('Fetching current market data...')
    const marketDataResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrency}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`)
    const marketData = await marketDataResponse.json()
    
    if (!marketData[cryptocurrency]) {
      throw new Error('Failed to fetch market data')
    }

    const currentPrice = marketData[cryptocurrency].usd
    const priceChange24h = marketData[cryptocurrency].usd_24h_change

    // Call OpenAI API for comprehensive market analysis
    console.log('Calling OpenAI API for market analysis...')
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analyst. Analyze the current market conditions and suggest price alerts. Format your response as JSON with fields: target_price (number), condition ("above" or "below"), reasoning (string), confidence_score (number between 0-1), timeframe_hours (number), risk_level ("low", "medium", "high").'
          },
          {
            role: 'user',
            content: `Analyze ${cryptocurrency} and suggest a price alert based on these current market conditions:
            Current Price: $${currentPrice}
            24h Price Change: ${priceChange24h.toFixed(2)}%
            
            Consider recent market trends and provide a detailed analysis with target price, direction, reasoning, confidence score, suggested timeframe, and risk level.`
          }
        ],
        temperature: 0.2,
      }),
    })

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text())
      throw new Error('Failed to get market analysis')
    }

    const aiResponse = await openAIResponse.json()
    console.log('AI Response:', aiResponse)
    
    const analysis = JSON.parse(aiResponse.choices[0].message.content)
    console.log('Parsed analysis:', analysis)

    // Create multiple AI-generated alerts based on the analysis
    const alerts = []

    // Main price alert
    const { data: priceAlert, error: priceAlertError } = await supabaseClient
      .from('price_alerts')
      .insert([
        {
          cryptocurrency,
          user_id: user.id,
          target_price: analysis.target_price,
          condition: analysis.condition,
          alert_type: 'price',
          ai_generated: true,
          ai_reasoning: `${analysis.reasoning}\n\nConfidence Score: ${(analysis.confidence_score * 100).toFixed(1)}%\nTimeframe: ${analysis.timeframe_hours} hours\nRisk Level: ${analysis.risk_level}`,
          email_notification: true,
        }
      ])
      .select()
      .single()

    if (priceAlertError) {
      console.error('Database error:', priceAlertError)
      throw priceAlertError
    }

    alerts.push(priceAlert)

    // Add a percentage-based alert if confidence is high
    if (analysis.confidence_score > 0.7) {
      const expectedChange = ((analysis.target_price - currentPrice) / currentPrice) * 100
      const percentageThreshold = Math.abs(expectedChange) / 2 // Set an intermediate alert at halfway point

      const { data: percentageAlert, error: percentageAlertError } = await supabaseClient
        .from('price_alerts')
        .insert([
          {
            cryptocurrency,
            user_id: user.id,
            percentage_change: percentageThreshold,
            condition: analysis.condition,
            alert_type: 'percentage',
            ai_generated: true,
            ai_reasoning: `Intermediate alert at ${percentageThreshold.toFixed(1)}% ${analysis.condition} current price.\n\nBased on primary analysis: ${analysis.reasoning}`,
            email_notification: true,
          }
        ])
        .select()
        .single()

      if (percentageAlertError) {
        console.error('Database error:', percentageAlertError)
      } else {
        alerts.push(percentageAlert)
      }
    }

    return new Response(
      JSON.stringify({
        message: `AI Alerts created with ${alerts.length} conditions:\n` +
                `1. Price alert at $${analysis.target_price} (${analysis.condition})\n` +
                `2. Analysis: ${analysis.reasoning}\n` +
                `Confidence: ${(analysis.confidence_score * 100).toFixed(1)}%\n` +
                `Timeframe: ${analysis.timeframe_hours} hours\n` +
                `Risk Level: ${analysis.risk_level}`,
        alerts
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