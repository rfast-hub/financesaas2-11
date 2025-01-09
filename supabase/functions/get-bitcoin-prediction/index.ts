import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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
    console.log('Starting Bitcoin prediction request...');
    
    // Test Perplexity API key
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      console.error('Perplexity API key not found in environment variables');
      throw new Error('Perplexity API key not configured');
    }
    console.log('Perplexity API key found');
    
    // Fetch historical data
    console.log('Fetching historical data from CoinGecko...');
    const historicalData = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily"
    );
    
    if (!historicalData.ok) {
      console.error('CoinGecko API error:', historicalData.status, historicalData.statusText);
      throw new Error(`Failed to fetch historical data: ${historicalData.statusText}`);
    }
    
    const data = await historicalData.json();
    console.log('Successfully fetched historical data');
    
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

    const prompt = `You are a JSON API. Return ONLY a pure JSON object without any markdown formatting, code blocks, or additional text. The response must be a valid JSON object matching this exact structure for Bitcoin price predictions:

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
    "trend": "bullish" | "bearish" | "neutral",
    "strengthIndex": number,
    "volatilityScore": number
  }
}

Historical data for analysis: ${JSON.stringify(recentPrices)}`;

    console.log('Calling Perplexity API...');
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
            content: 'You are a pure JSON API. Never include markdown, code blocks, or any text outside of the JSON structure. Return only valid JSON objects.'
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
      console.error('Perplexity API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Perplexity API error details:', errorText);
      throw new Error('Failed to get prediction from Perplexity');
    }

    console.log('Successfully received Perplexity API response');
    const result = await response.json();
    
    // Log the raw response for debugging
    console.log('Raw Perplexity response:', result.choices[0].message.content);
    
    let parsedResponse;
    try {
      // Clean the response of any markdown artifacts
      const cleanContent = result.choices[0].message.content
        .replace(/```json\n?/g, '')  // Remove ```json
        .replace(/```\n?/g, '')      // Remove closing ```
        .trim();                     // Remove any extra whitespace
      
      console.log('Cleaned content:', cleanContent);
      parsedResponse = JSON.parse(cleanContent);
      
      // Validate response structure
      if (!parsedResponse.prediction || !Array.isArray(parsedResponse.prediction) || 
          !parsedResponse.analysis || typeof parsedResponse.analysis !== 'string' ||
          !parsedResponse.keyIndicators || typeof parsedResponse.keyIndicators !== 'object') {
        throw new Error('Invalid response structure from Perplexity API');
      }
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      console.error('Raw content:', result.choices[0].message.content);
      throw new Error('Failed to parse prediction data: ' + parseError.message);
    }
    
    console.log('Successfully parsed response');
    
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
    console.error('Error in get-bitcoin-prediction function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})