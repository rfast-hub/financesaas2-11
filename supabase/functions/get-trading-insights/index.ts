import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0';

interface TradingInsight {
  recommendation: string;
  confidence: number;
  reasoning: string;
  risks: string[];
  opportunities: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validateResponse = (data: any): data is TradingInsight => {
  return (
    data &&
    typeof data.recommendation === 'string' &&
    typeof data.confidence === 'number' &&
    typeof data.reasoning === 'string' &&
    Array.isArray(data.risks) &&
    Array.isArray(data.opportunities) &&
    data.risks.every((risk: any) => typeof risk === 'string') &&
    data.opportunities.every((opp: any) => typeof opp === 'string')
  );
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch current Bitcoin price
    const priceResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );
    
    if (!priceResponse.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }

    const priceData = await priceResponse.json();
    const currentPrice = priceData.bitcoin.usd;
    console.log('Current BTC price:', currentPrice);

    const configuration = new Configuration({
      apiKey: openAIApiKey,
    });

    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: 'system',
          content: `You are a cryptocurrency trading expert. Analyze Bitcoin's current market conditions (price: $${currentPrice}) and provide insights.
Your response must be a valid JSON object with exactly this structure:
{
  "recommendation": "Buy" or "Sell" or "Hold",
  "confidence": <number between 0 and 100>,
  "reasoning": "<brief explanation>",
  "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"]
}
Do not include any text outside of this JSON structure.`
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

    const content = completion.data.choices[0].message.content.trim();
    console.log('Raw OpenAI response:', content);

    try {
      const insights: TradingInsight = JSON.parse(content);
      
      if (!validateResponse(insights)) {
        console.error('Invalid response structure:', insights);
        throw new Error('Response validation failed');
      }

      return new Response(
        JSON.stringify(insights),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});