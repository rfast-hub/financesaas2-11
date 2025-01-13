import { PriceAlert, CryptoData } from './types.ts';

export function isPriceAlertTriggered(alert: PriceAlert, cryptoData: CryptoData): boolean {
  const currentPrice = Number(cryptoData.current_price);
  const targetPrice = alert.target_price ? Number(alert.target_price) : null;

  if (!targetPrice) {
    console.log('No target price set for price alert');
    return false;
  }

  const isTriggered = alert.condition === 'above' 
    ? currentPrice >= targetPrice
    : currentPrice <= targetPrice;

  console.log(`Price comparison: ${currentPrice} ${alert.condition} ${targetPrice} = ${isTriggered}`);
  return isTriggered;
}