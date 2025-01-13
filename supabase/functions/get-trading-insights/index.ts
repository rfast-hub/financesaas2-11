import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0';

// Define interfaces for type safety
interface TradingInsight {
  recommendation: 'Buy' | 'Sell' | 'Hold';
  confidence: number;
  reasoning: string;
  risks: string[];
  opportunities: string[];
}

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Fetch current Bitcoin price
    const priceResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );
    
    if (!priceResponse.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }

    const priceData: CoinGeckoResponse = await priceResponse.json();
    const currentPrice = priceData.bitcoin.usd;
    console.log('Current BTC price:', currentPrice);

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Generate insights using OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: 'system',
          content: `You are a cryptocurrency trading expert. Analyze Bitcoin's current market conditions (price: $${currentPrice}) and provide insights.
IMPORTANT: Return ONLY a JSON object with this EXACT structure:
{
  "recommendation": "Buy" | "Sell" | "Hold",
  "confidence": <number between 0-100>,
  "reasoning": "<concise explanation>",
  "risks": ["<specific risk 1>", "<specific risk 2>", "<specific risk 3>"],
  "opportunities": ["<specific opportunity 1>", "<specific opportunity 2>", "<specific opportunity 3>"]
}
Do not include ANY additional text or explanation outside the JSON structure.`
        },
        {
          role: 'user',
          content: 'Generate current Bitcoin trading insights.'
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    if (!completion.data.choices[0].message?.content) {
      throw new Error('No response from OpenAI');
    }

    const content = completion.data.choices[0].message.content;
    console.log('Raw OpenAI response:', content);

    try {
      // Clean the response and parse JSON
      const cleanContent = content.trim();
      const insights: TradingInsight = JSON.parse(cleanContent);
      
      // Validate response structure
      const validateInsights = (data: any): data is TradingInsight => {
        return (
          typeof data === 'object' &&
          ['Buy', 'Sell', 'Hold'].includes(data.recommendation) &&
          typeof data.confidence === 'number' &&
          data.confidence >= 0 &&
          data.confidence <= 100 &&
          typeof data.reasoning === 'string' &&
          Array.isArray(data.risks) &&
          Array.isArray(data.opportunities) &&
          data.risks.every((risk: any) => typeof risk === 'string') &&
          data.opportunities.every((opp: any) => typeof opp === 'string')
        );
      };

      if (!validateInsights(insights)) {
        console.error('Invalid insights format:', insights);
        throw new Error('Response format validation failed');
      }

      return new Response(
        JSON.stringify(insights),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Content:', content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate trading insights',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});