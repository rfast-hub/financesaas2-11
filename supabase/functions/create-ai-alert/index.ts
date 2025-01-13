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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const { cryptocurrency } = await req.json()
    console.log('Processing alert for cryptocurrency:', cryptocurrency)

    // Fetch current market data
    const marketDataResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrency}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
    )
    
    if (!marketDataResponse.ok) {
      throw new Error('Failed to fetch market data from CoinGecko')
    }

    const marketData = await marketDataResponse.json()
    console.log('Market data received:', marketData)
    
    if (!marketData[cryptocurrency]) {
      throw new Error('Invalid cryptocurrency or no market data available')
    }

    const currentPrice = marketData[cryptocurrency].usd
    const priceChange24h = marketData[cryptocurrency].usd_24h_change

    // Call OpenAI API for analysis
    console.log('Requesting AI analysis...')
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
            content: 'You are a cryptocurrency market analyst. Return ONLY a JSON object with no additional text or markdown, following this structure: { "target_price": number, "condition": "above" | "below", "reasoning": string, "confidence_score": number between 0-1, "timeframe_hours": number, "risk_level": "low" | "medium" | "high" }'
          },
          {
            role: 'user',
            content: `Analyze ${cryptocurrency} and suggest a price alert based on these market conditions:
            Current Price: $${currentPrice}
            24h Price Change: ${priceChange24h.toFixed(2)}%
            
            Consider market trends and provide a detailed analysis with target price, direction, reasoning, confidence score, timeframe, and risk level.`
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
    console.log('AI Response received:', aiResponse)

    if (!aiResponse.choices?.[0]?.message?.content) {
      throw new Error('Invalid AI response format')
    }

    // Clean and parse the AI response
    const cleanContent = aiResponse.choices[0].message.content.trim()
    console.log('Cleaned AI content:', cleanContent)

    let analysis
    try {
      analysis = JSON.parse(cleanContent)
      console.log('Parsed analysis:', analysis)

      // Validate analysis structure
      if (!analysis.target_price || !analysis.condition || !analysis.reasoning) {
        throw new Error('Invalid analysis format')
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      throw new Error('Failed to parse AI analysis')
    }

    // Create alerts based on the analysis
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
          is_active: true,
        }
      ])
      .select()
      .single()

    if (priceAlertError) {
      console.error('Database error:', priceAlertError)
      throw priceAlertError
    }

    alerts.push(priceAlert)

    // Add percentage-based alert if confidence is high
    if (analysis.confidence_score > 0.7) {
      const expectedChange = ((analysis.target_price - currentPrice) / currentPrice) * 100
      const percentageThreshold = Math.abs(expectedChange) / 2

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
            is_active: true,
          }
        ])
        .select()
        .single()

      if (!percentageAlertError && percentageAlert) {
        alerts.push(percentageAlert)
      }
    }

    return new Response(
      JSON.stringify({
        message: `AI Alerts created successfully:\n` +
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
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})