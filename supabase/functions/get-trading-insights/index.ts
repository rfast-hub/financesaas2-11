import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching trading insights from OpenAI...');
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch current Bitcoin price from CoinGecko
    const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const priceData = await priceResponse.json();
    const currentPrice = priceData.bitcoin?.usd || 'unknown';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a cryptocurrency trading expert. Your task is to analyze Bitcoin's current market conditions (price: $${currentPrice}) and return ONLY a JSON object in this exact format:
{
  "recommendation": "Buy" | "Sell" | "Hold",
  "confidence": <number 0-100>,
  "reasoning": "<1-2 sentence explanation>",
  "risks": ["<risk1>", "<risk2>", "<risk3>"],
  "opportunities": ["<opportunity1>", "<opportunity2>", "<opportunity3>"]
}
Do not include any other text, only return the JSON object.`
          },
          {
            role: 'user',
            content: 'Generate Bitcoin trading insights in the specified JSON format.'
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const cleanContent = data.choices[0].message.content.trim();
    console.log('Cleaned content:', cleanContent);

    try {
      const insights = JSON.parse(cleanContent);
      console.log('Parsed insights:', insights);

      // Validate the response structure
      if (!insights.recommendation || 
          !insights.confidence || 
          !insights.reasoning || 
          !Array.isArray(insights.risks) || 
          !Array.isArray(insights.opportunities)) {
        throw new Error('Response missing required fields');
      }

      // Ensure recommendation is valid
      if (!['Buy', 'Sell', 'Hold'].includes(insights.recommendation)) {
        throw new Error('Invalid recommendation value');
      }

      // Ensure confidence is a number between 0-100
      if (typeof insights.confidence !== 'number' || 
          insights.confidence < 0 || 
          insights.confidence > 100) {
        throw new Error('Invalid confidence value');
      }

      return new Response(
        JSON.stringify(insights),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Content:', cleanContent);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in get-trading-insights:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate trading insights',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});