import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRYPTO_SYMBOL_MAP: { [key: string]: string } = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'binancecoin': 'binancecoin',
  'solana': 'solana',
  'ripple': 'ripple', // Changed from 'xrp' to 'ripple' as that's CoinGecko's ID
  'xrp': 'ripple',    // Add this mapping to handle both cases
  'cardano': 'cardano',
  'dogecoin': 'dogecoin',
  'polkadot': 'polkadot',
  'matic-network': 'matic-network',
};

serve(async (req) => {
  console.log('Received request to get crypto data');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    const { limit } = await req.json();
    const cryptoSymbols = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'].slice(0, limit || 5);
    
    console.log(`Fetching data for ${cryptoSymbols.length} cryptocurrencies:`, cryptoSymbols);
    
    const cryptoDataPromises = cryptoSymbols.map(async (symbol) => {
      try {
        // Map the symbol to its CoinGecko equivalent
        const mappedSymbol = CRYPTO_SYMBOL_MAP[symbol.toLowerCase()] || symbol.toLowerCase();
        console.log(`Mapped ${symbol} to ${mappedSymbol} for API request`);
        
        // Construct CoinGecko API URL with all required parameters
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${mappedSymbol}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
        console.log(`Fetching from CoinGecko: ${url}`);

        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`CoinGecko API error for ${mappedSymbol}:`, response.status, response.statusText);
          throw new Error(`CoinGecko API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(`Raw CoinGecko response for ${mappedSymbol}:`, data);

        if (!data[mappedSymbol]) {
          console.error(`No data found for ${mappedSymbol} in CoinGecko response`);
          throw new Error(`No data found for ${mappedSymbol}`);
        }

        return {
          name: getCryptoName(symbol),
          symbol: symbol,
          current_price: data[mappedSymbol].usd,
          price_change_percentage_24h: data[mappedSymbol].usd_24h_change || 0,
          total_volume: data[mappedSymbol].usd_24h_vol || 0,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        // Instead of throwing, return null and filter out failed requests
        return null;
      }
    });

    const results = (await Promise.all(cryptoDataPromises)).filter(result => result !== null);
    console.log('Successfully fetched crypto data:', results);

    if (results.length === 0) {
      throw new Error('Failed to fetch data for all cryptocurrencies');
    }

    return new Response(
      JSON.stringify(results),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
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
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
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
    'cardano': 'Cardano',
    'dogecoin': 'Dogecoin',
    'polkadot': 'Polkadot',
    'matic-network': 'Polygon',
  };
  return names[symbol.toLowerCase()] || symbol;
}