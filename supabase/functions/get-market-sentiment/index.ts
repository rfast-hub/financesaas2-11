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
    return new Response(null, { headers: corsHeaders })
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
      const errorText = await response.text()
      console.error('Error response:', errorText)
      throw new Error(`Failed to fetch data from Alpha Vantage: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Raw Alpha Vantage response:', JSON.stringify(data))
    
    // Check if the response contains the expected structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: empty or non-object response')
    }

    // Handle API limit message
    if (data.Note) {
      console.error('API limit reached:', data.Note)
      throw new Error('API rate limit reached')
    }

    // Handle API error message
    if (data.Error) {
      console.error('API error:', data.Error)
      throw new Error(data.Error)
    }

    // Validate feed data
    if (!Array.isArray(data.feed)) {
      console.error('Invalid feed format:', data.feed)
      throw new Error('Invalid feed format in response')
    }

    // Filter out invalid entries and map sentiment scores
    const sentimentScores = data.feed
      .filter(item => 
        item && 
        typeof item === 'object' && 
        'overall_sentiment_score' in item &&
        'overall_sentiment_label' in item
      )
      .map(item => {
        const labelScore = 
          item.overall_sentiment_label === 'Bullish' ? 1 :
          item.overall_sentiment_label === 'Somewhat-Bullish' ? 0.5 :
          item.overall_sentiment_label === 'Neutral' ? 0 :
          item.overall_sentiment_label === 'Somewhat-Bearish' ? -0.5 :
          item.overall_sentiment_label === 'Bearish' ? -1 : 0;
        
        return (Number(item.overall_sentiment_score) + labelScore) / 2;
      })
      .filter(score => !isNaN(score));

    if (sentimentScores.length === 0) {
      console.warn('No valid sentiment scores found, using fallback values')
      // Return fallback values instead of throwing an error
      return new Response(JSON.stringify({
        overallSentiment: 'neutral',
        sentimentScore: 50,
        trendStrength: 50,
        lastUpdated: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const averageSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    
    // Calculate variance and standard deviation for trend strength
    const variance = sentimentScores.reduce((sq, n) => 
      sq + Math.pow(n - averageSentiment, 2), 0) / sentimentScores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normalize trend strength (higher when sentiments are more consistent)
    const trendStrength = Math.min(100, Math.max(0, (1 - standardDeviation) * 100));

    // Determine overall sentiment with adjusted thresholds
    let overallSentiment: 'bullish' | 'bearish' | 'neutral';
    if (averageSentiment > 0.2) {
      overallSentiment = 'bullish'
    } else if (averageSentiment < -0.2) {
      overallSentiment = 'bearish'
    } else {
      overallSentiment = 'neutral'
    }

    // Convert sentiment score to 0-100 scale
    const sentimentScore = Math.min(100, Math.max(0, ((averageSentiment + 1) / 2) * 100));

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