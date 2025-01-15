import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    const { message, model = 'llama-3.1-sonar-large-128k-online' } = await req.json();
    
    console.log('Processing chat message:', message, 'with model:', model);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a highly knowledgeable cryptocurrency expert assistant with access to extensive market data and analysis tools. Your expertise includes:

1. Technical Analysis:
- Understanding of key technical indicators (RSI, MACD, Moving Averages)
- Chart pattern recognition
- Volume analysis and trading signals

2. Fundamental Analysis:
- Blockchain technology and protocols
- Network metrics (hash rate, active addresses, transaction volume)
- Market sentiment indicators
- Regulatory developments and their impact

3. Market Context:
- Historical price movements and patterns
- Market cycles and trends
- Correlation with traditional markets
- Impact of global economic events

4. Risk Management:
- Portfolio diversification principles
- Risk/reward ratios
- Position sizing recommendations
- Market volatility considerations

Provide accurate, data-driven insights while acknowledging market uncertainties. Always include relevant context and explain your reasoning. If asked about price predictions, emphasize the speculative nature of cryptocurrencies and the importance of proper risk management.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      throw new Error('Failed to get response from Perplexity');
    }

    const result = await response.json();
    const answer = result.choices[0].message.content;
    
    return new Response(
      JSON.stringify({ answer }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in crypto-chat function:', error);
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