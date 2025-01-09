import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Fetch historical data
    const historicalData = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily"
    );
    const data = await historicalData.json();
    
    // Format historical data with technical indicators
    const recentPrices = data.prices.map(([timestamp, price]: [number, number], index: number, array: any[]) => {
      const ma7 = index >= 6 
        ? array.slice(index - 6, index + 1).reduce((sum: number, [, p]: [number, number]) => sum + p, 0) / 7 
        : null;
      
      const ma30 = index >= 29 
        ? array.slice(index - 29, index + 1).reduce((sum: number, [, p]: [number, number]) => sum + p, 0) / 30 
        : null;

      return {
        date: new Date(timestamp).toISOString().split('T')[0],
        price: Math.round(price),
        ma7: ma7 ? Math.round(ma7) : null,
        ma30: ma30 ? Math.round(ma30) : null
      };
    });

    const prompt = `As a crypto market analysis AI, analyze this Bitcoin price data for the last 90 days, including 7-day and 30-day moving averages: ${JSON.stringify(recentPrices)}. 

    Please provide:
    1. A detailed technical analysis considering:
       - Moving average convergence/divergence
       - Support and resistance levels
       - Volume trends
       - Market sentiment
       - Historical patterns
       - Recent market events
    
    2. Price predictions for the next 7 days with:
       - Daily price targets
       - Support and resistance levels
       - Confidence levels based on technical indicators
       - Potential pivot points
    
    Format your response as JSON with this structure:
    {
      "prediction": [{
        "price": number,
        "timestamp": "YYYY-MM-DD",
        "confidence": number,
        "support": number,
        "resistance": number
      }],
      "analysis": "string",
      "keyIndicators": {
        "trend": "bullish|bearish|neutral",
        "strengthIndex": number,
        "volatilityScore": number
      }
    }`;

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not found');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert crypto market analyst AI. Provide detailed technical analysis and precise price predictions based on multiple indicators.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get prediction from Perplexity');
    }

    const result = await response.json();
    const parsedResponse = JSON.parse(result.choices[0].message.content);
    
    return new Response(
      JSON.stringify({
        predictions: parsedResponse.prediction,
        analysis: parsedResponse.analysis,
        keyIndicators: parsedResponse.keyIndicators
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})