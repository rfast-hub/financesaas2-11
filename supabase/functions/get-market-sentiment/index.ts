import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
}

interface AlphaVantageResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: NewsItem[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    if (!API_KEY) {
      throw new Error('Alpha Vantage API key not configured')
    }

    console.log('Fetching sentiment data from Alpha Vantage...')
    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=CRYPTO:BTC&apikey=${API_KEY}&limit=50`
    )
    
    if (!response.ok) {
      console.error('Alpha Vantage API error:', response.status, response.statusText)
      throw new Error('Failed to fetch data from Alpha Vantage')
    }

    const data: AlphaVantageResponse = await response.json()
    
    if (!data.feed || !Array.isArray(data.feed)) {
      throw new Error('Invalid response format from Alpha Vantage')
    }

    // Calculate sentiment metrics
    const sentimentScores = data.feed.map(item => item.overall_sentiment_score)
    const validScores = sentimentScores.filter(score => !isNaN(score))
    
    if (validScores.length === 0) {
      throw new Error('No valid sentiment scores found in the response')
    }

    const averageSentiment = validScores.reduce((a, b) => a + b, 0) / validScores.length
    
    // Calculate trend strength based on sentiment consistency
    const standardDeviation = Math.sqrt(
      validScores.reduce((sq, n) => sq + Math.pow(n - averageSentiment, 2), 0) / validScores.length
    )
    const trendStrength = Math.min(100, Math.max(0, (1 - standardDeviation) * 100))

    // Determine overall sentiment
    let overallSentiment: 'bullish' | 'bearish' | 'neutral'
    if (averageSentiment > 0.15) {
      overallSentiment = 'bullish'
    } else if (averageSentiment < -0.15) {
      overallSentiment = 'bearish'
    } else {
      overallSentiment = 'neutral'
    }

    // Convert sentiment score to 0-100 scale
    const sentimentScore = Math.min(100, Math.max(0, ((averageSentiment + 1) / 2) * 100))

    const result = {
      overallSentiment,
      sentimentScore: Math.round(sentimentScore),
      trendStrength: Math.round(trendStrength),
      lastUpdated: new Date().toISOString()
    }

    console.log('Processed sentiment data:', result)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-market-sentiment:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})