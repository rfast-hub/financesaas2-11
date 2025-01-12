import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CryptoData {
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
}

const COIN_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const ICON_BASE_URL = 'https://s3.eu-central-1.amazonaws.com/bbxt-static-icons/type-id/png_32';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('COINAPI_API_KEY');
    if (!apiKey) {
      throw new Error('COINAPI_API_KEY is not set');
    }

    console.log('Fetching crypto data from CoinAPI...');

    const cryptoPromises = COIN_SYMBOLS.map(async (symbol) => {
      try {
        // Get current rate
        const rateResponse = await fetch(
          `https://rest.coinapi.io/v1/exchangerate/${symbol}/USD`,
          {
            headers: {
              'X-CoinAPI-Key': apiKey,
            },
          }
        );
        
        if (!rateResponse.ok) {
          throw new Error(`Failed to fetch rate for ${symbol}: ${rateResponse.statusText}`);
        }
        
        const rateData = await rateResponse.json();
        
        // Get 24h historical data
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterdayResponse = await fetch(
          `https://rest.coinapi.io/v1/exchangerate/${symbol}/USD?time=${yesterday.toISOString()}`,
          {
            headers: {
              'X-CoinAPI-Key': apiKey,
            },
          }
        );

        if (!yesterdayResponse.ok) {
          throw new Error(`Failed to fetch historical data for ${symbol}: ${yesterdayResponse.statusText}`);
        }

        const yesterdayData = await yesterdayResponse.json();
        
        // Calculate 24h change
        const priceChange = ((rateData.rate - yesterdayData.rate) / yesterdayData.rate) * 100;

        // Get volume data (last 24h trades)
        const volumeResponse = await fetch(
          `https://rest.coinapi.io/v1/trades/${symbol}/USD/history?time_start=${yesterday.toISOString()}`,
          {
            headers: {
              'X-CoinAPI-Key': apiKey,
            },
          }
        );

        let volume = 0;
        if (volumeResponse.ok) {
          const trades = await volumeResponse.json();
          volume = trades.reduce((acc: number, trade: any) => 
            acc + (trade.price * trade.size), 0);
        } else {
          console.warn(`Could not fetch volume data for ${symbol}, using 0`);
        }

        return {
          name: getCryptoName(symbol),
          symbol: symbol.toLowerCase(),
          current_price: rateData.rate,
          price_change_percentage_24h: priceChange,
          total_volume: volume,
          image: `${ICON_BASE_URL}/${symbol.toLowerCase()}.png`,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        // Return fallback data for this symbol
        return {
          name: getCryptoName(symbol),
          symbol: symbol.toLowerCase(),
          current_price: 0,
          price_change_percentage_24h: 0,
          total_volume: 0,
          image: `${ICON_BASE_URL}/${symbol.toLowerCase()}.png`,
        };
      }
    });

    const cryptoData = await Promise.all(cryptoPromises);
    console.log('Processed crypto data:', cryptoData);

    return new Response(JSON.stringify(cryptoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-crypto-data:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch cryptocurrency data',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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