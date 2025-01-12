import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCryptoData } from "../_shared/crypto-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to get crypto data');
    
    const { limit } = await req.json();
    const cryptoSymbols = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'].slice(0, limit || 5);
    
    console.log(`Fetching data for ${cryptoSymbols.length} cryptocurrencies:`, cryptoSymbols);
    
    const cryptoDataPromises = cryptoSymbols.map(async (symbol) => {
      try {
        const data = await getCryptoData(symbol);
        return {
          name: getCryptoName(symbol),
          symbol: symbol,
          current_price: data.current_price,
          price_change_percentage_24h: data.price_change_percentage_24h,
          total_volume: data.total_volume,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
      }
    });

    const results = await Promise.all(cryptoDataPromises);
    console.log('Successfully fetched all crypto data:', results);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-crypto-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch cryptocurrency data',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getCryptoName(symbol: string): string {
  const names: { [key: string]: string } = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'binancecoin': 'Binance Coin',
    'solana': 'Solana',
    'ripple': 'XRP',
  };
  return names[symbol] || symbol;
}