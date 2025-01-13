import { CryptoData } from './types.ts';

async function fetchCoinGeckoData(cryptocurrency: string): Promise<CryptoData | null> {
  try {
    const coinId = cryptocurrency.toLowerCase();
    const apiKey = Deno.env.get('COINGECKO_API_KEY');
    console.log(`Fetching CoinGecko data for ${coinId} with API key`);
    
    const response = await fetch(
      `https://pro-api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Cg-Pro-Api-Key': apiKey || '',
        }
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data[coinId]) {
      console.error(`No data found for ${cryptocurrency} in CoinGecko response`);
      return null;
    }

    const cryptoData: CryptoData = {
      current_price: Number(data[coinId].usd),
      price_change_percentage_24h: Number(data[coinId].usd_24h_change || 0),
      total_volume: Number(data[coinId].usd_24h_vol || 0),
    };

    console.log(`Processed data for ${cryptocurrency}:`, cryptoData);
    return cryptoData;
  } catch (error) {
    console.error(`Error fetching data from CoinGecko for ${cryptocurrency}:`, error);
    return null;
  }
}

async function fetchLiveCoinWatchData(cryptocurrency: string): Promise<CryptoData | null> {
  try {
    const apiKey = Deno.env.get('LIVECOINWATCH_API_KEY');
    if (!apiKey) {
      console.error('LIVECOINWATCH_API_KEY not found in environment variables');
      return null;
    }

    console.log(`Fetching Live Coin Watch data for ${cryptocurrency}`);

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

    const cryptoData: CryptoData = {
      current_price: Number(data.rate),
      price_change_percentage_24h: Number(data.delta.day * 100), // Convert to percentage
      total_volume: Number(data.volume),
    };

    console.log(`Processed data for ${cryptocurrency}:`, cryptoData);
    return cryptoData;
  } catch (error) {
    console.error(`Error fetching data from Live Coin Watch for ${cryptocurrency}:`, error);
    return null;
  }
}

export async function getCryptoData(cryptocurrency: string): Promise<CryptoData> {
  console.log(`Fetching crypto data for ${cryptocurrency}...`);

  // Try CoinGecko first
  const coinGeckoData = await fetchCoinGeckoData(cryptocurrency);
  if (coinGeckoData) {
    console.log('Successfully fetched data from CoinGecko');
    return coinGeckoData;
  }

  // Fallback to Live Coin Watch
  console.log('Falling back to Live Coin Watch...');
  const liveCoinWatchData = await fetchLiveCoinWatchData(cryptocurrency);
  if (liveCoinWatchData) {
    console.log('Successfully fetched data from Live Coin Watch');
    return liveCoinWatchData;
  }

  throw new Error(`Failed to fetch crypto data for ${cryptocurrency} from all available sources`);
}