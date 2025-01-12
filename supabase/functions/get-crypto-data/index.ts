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
    const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'].slice(0, limit || 5);
    
    console.log(`Fetching data for ${cryptoSymbols.length} cryptocurrencies`);
    
    const cryptoDataPromises = cryptoSymbols.map(async (symbol) => {
      try {
        const data = await getCryptoData(symbol.toLowerCase());
        return {
          name: getCryptoName(symbol),
          symbol: symbol.toLowerCase(),
          current_price: data.current_price,
          price_change_percentage_24h: data.price_change_percentage_24h,
          total_volume: data.total_volume,
          image: `https://assets.coingecko.com/coins/images/1/thumb/${symbol.toLowerCase()}.png`,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
      }
    });

    const results = await Promise.all(cryptoDataPromises);
    console.log('Successfully fetched all crypto data');

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-crypto-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getCryptoName(symbol: string): string {
  const names: { [key: string]: string } = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'Binance Coin',
    'SOL': 'Solana',
    'XRP': 'XRP',
  };
  return names[symbol] || symbol;
}