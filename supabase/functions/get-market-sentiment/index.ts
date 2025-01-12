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
    if (!API_KEY) {
      throw new Error('API key not configured')
    }

    const response = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:BTC&apikey=${API_KEY}`)
    if (!response.ok) {
      throw new Error('Failed to fetch data from Alpha Vantage')
    }

    const data = await response.json()
    if (!data.feed || !Array.isArray(data.feed)) {
      return new Response(
        JSON.stringify({
          overallSentiment: 'neutral',
          sentimentScore: 50,
          socialMediaMentions: 0,
          trendStrength: 50
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let totalSentiment = 0
    let mentionsCount = data.feed.length
    let bullishCount = 0
    let bearishCount = 0

    data.feed.forEach((item: any) => {
      const sentiment = parseFloat(item.overall_sentiment_score)
      if (!isNaN(sentiment)) {
        totalSentiment += sentiment
        if (sentiment > 0.2) bullishCount++
        if (sentiment < -0.2) bearishCount++
      }
    })

    const averageSentiment = mentionsCount > 0 ? totalSentiment / mentionsCount : 0
    const sentimentScore = Math.round(((averageSentiment + 1) / 2) * 100)
    const trendStrength = mentionsCount > 0 
      ? Math.round(Math.abs((bullishCount - bearishCount) / mentionsCount) * 100)
      : 50

    const result = {
      overallSentiment: bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral',
      sentimentScore: Math.min(Math.max(sentimentScore, 0), 100), // Ensure between 0-100
      socialMediaMentions: mentionsCount,
      trendStrength: Math.min(Math.max(trendStrength, 0), 100) // Ensure between 0-100
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-market-sentiment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})