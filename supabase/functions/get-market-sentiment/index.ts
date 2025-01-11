import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    
    // Fetch news sentiment for Bitcoin from Alpha Vantage
    const response = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:BTC&apikey=${API_KEY}`)
    const data = await response.json()

    // Calculate sentiment metrics
    let totalSentiment = 0
    let mentionsCount = 0
    let bullishCount = 0
    let bearishCount = 0

    data.feed?.forEach((item: any) => {
      mentionsCount++
      const sentiment = parseFloat(item.overall_sentiment_score)
      totalSentiment += sentiment
      
      if (sentiment > 0.2) bullishCount++
      if (sentiment < -0.2) bearishCount++
    })

    const averageSentiment = totalSentiment / mentionsCount
    const sentimentScore = ((averageSentiment + 1) / 2) * 100 // Convert to 0-100 scale
    const trendStrength = Math.abs((bullishCount - bearishCount) / mentionsCount) * 100

    const result = {
      overallSentiment: bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral',
      sentimentScore: Math.round(sentimentScore),
      socialMediaMentions: mentionsCount,
      trendStrength: Math.round(trendStrength)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})