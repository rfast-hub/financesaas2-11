import { CryptoData } from './types.ts';

export async function getCryptoData(cryptocurrency: string): Promise<CryptoData> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrency}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    );
    const data = await response.json();
    
    return {
      current_price: data[cryptocurrency]?.usd || 0,
      price_change_percentage_24h: data[cryptocurrency]?.usd_24h_change || 0,
      total_volume: data[cryptocurrency]?.usd_24h_vol || 0,
    };
  } catch (error) {
    console.error(`Error fetching data for ${cryptocurrency}:`, error);
    throw new Error(`Failed to fetch data for ${cryptocurrency}`);
  }
}