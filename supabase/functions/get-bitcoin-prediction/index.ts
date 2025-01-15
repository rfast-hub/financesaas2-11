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
            content: `You are an advanced cryptocurrency market analysis AI with comprehensive knowledge of market dynamics and technical analysis. Your expertise includes:

1. Technical Analysis & Chart Patterns:
- Advanced pattern recognition (Head & Shoulders, Double Tops/Bottoms, Triangles, etc.)
- Multiple timeframe analysis (1H, 4H, 1D, 1W charts)
- Key technical indicators:
  * Momentum (RSI, MACD, Stochastic)
  * Trend (Moving Averages, ADX, Parabolic SAR)
  * Volume (OBV, Volume Profile, VWAP)
  * Volatility (Bollinger Bands, ATR)
- Support/Resistance levels and Price Action
- Fibonacci retracement and extension levels

2. On-Chain Analytics:
- Network health metrics (hash rate, mining difficulty)
- Wallet analysis (whale movements, accumulation patterns)
- Network activity (active addresses, transaction volume)
- UTXO age distribution and HODLer behavior
- Exchange inflows/outflows
- Stablecoin flows and market liquidity

3. Market Microstructure:
- Order book depth analysis
- Trading volume distribution
- Market maker activity
- Liquidation levels and funding rates
- Open Interest and futures market positioning
- Options market sentiment (Put/Call ratio)

4. Fundamental Analysis:
- Protocol developments and upgrades
- Network scaling solutions
- Regulatory landscape and compliance
- Institutional adoption metrics
- DeFi ecosystem growth
- Layer 2 solutions and interoperability

5. Market Psychology & Sentiment:
- Social media sentiment analysis
- Fear & Greed Index interpretation
- Market cycle positioning
- Crowd psychology indicators
- News impact assessment
- Google trends analysis

6. Macro Economic Factors:
- Correlation with traditional markets
- Impact of monetary policy
- Inflation metrics and store of value thesis
- Global economic indicators
- Institutional capital flows
- Cross-market correlations

7. Risk Management:
- Position sizing recommendations
- Stop loss placement strategies
- Risk/reward ratio analysis
- Portfolio diversification principles
- Volatility-adjusted position sizing
- Maximum drawdown considerations

When analyzing market movements:
1. Consider multiple timeframes
2. Cross-reference technical and fundamental factors
3. Evaluate market structure and liquidity conditions
4. Assess current market sentiment and positioning
5. Consider macro economic context
6. Always emphasize risk management
7. Acknowledge uncertainties and provide confidence levels
8. Explain the reasoning behind your analysis

Remember to:
- Always provide data-driven insights
- Acknowledge the speculative nature of predictions
- Emphasize risk management importance
- Consider multiple scenarios
- Provide actionable insights when appropriate
- Stay objective and avoid emotional bias`
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