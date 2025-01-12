import { CryptoData } from './types.ts';

async function fetchFromCoinGecko(cryptocurrency: string): Promise<CryptoData | null> {
  try {
    console.log(`Fetching data for ${cryptocurrency} from CoinGecko...`);
    
    const coinId = cryptocurrency.toLowerCase();
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`Raw CoinGecko response for ${cryptocurrency}:`, data);
    
    if (!data[coinId]) {
      console.error(`No data found for ${cryptocurrency} (ID: ${coinId})`);
      return null;
    }

    return {
      current_price: data[coinId].usd,
      price_change_percentage_24h: data[coinId].usd_24h_change || 0,
      total_volume: data[coinId].usd_24h_vol || 0,
    };
  } catch (error) {
    console.error(`Error fetching data from CoinGecko for ${cryptocurrency}:`, error);
    return null;
  }
}

async function fetchFromLiveCoinWatch(cryptocurrency: string): Promise<CryptoData | null> {
  try {
    console.log(`Fetching data for ${cryptocurrency} from Live Coin Watch...`);
    
    const apiKey = Deno.env.get('LIVECOINWATCH_API_KEY');
    if (!apiKey) {
      console.error('Live Coin Watch API key not found');
      return null;
    }

    const response = await fetch('https://api.livecoinwatch.com/coins/single', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        currency: 'USD',
        code: cryptocurrency.toUpperCase(),
        meta: true,
      }),
    });

    if (!response.ok) {
      console.error(`Live Coin Watch API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`Raw Live Coin Watch response for ${cryptocurrency}:`, data);

    if (!data.rate) {
      console.error(`No price data found for ${cryptocurrency}`);
      return null;
    }

    return {
      current_price: data.rate,
      price_change_percentage_24h: data.delta.day * 100, // Convert to percentage
      total_volume: data.volume,
    };
  } catch (error) {
    console.error(`Error fetching data from Live Coin Watch for ${cryptocurrency}:`, error);
    return null;
  }
}

export async function getCryptoData(cryptocurrency: string): Promise<CryptoData> {
  console.log(`Attempting to fetch data for ${cryptocurrency} from multiple sources...`);

  // Try Live Coin Watch first
  const liveCoinWatchData = await fetchFromLiveCoinWatch(cryptocurrency);
  if (liveCoinWatchData) {
    console.log(`Successfully fetched data from Live Coin Watch for ${cryptocurrency}`);
    return liveCoinWatchData;
  }

  // Fallback to CoinGecko
  const coinGeckoData = await fetchFromCoinGecko(cryptocurrency);
  if (coinGeckoData) {
    console.log(`Successfully fetched data from CoinGecko for ${cryptocurrency}`);
    return coinGeckoData;
  }

  // If both APIs fail, throw an error
  throw new Error(`Failed to fetch crypto data for ${cryptocurrency} from all available sources`);
}