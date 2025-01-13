import { PriceAlert, CryptoData } from './types.ts';

export function isPriceAlertTriggered(alert: PriceAlert, cryptoData: CryptoData): boolean {
  const currentPrice = Number(cryptoData.current_price);
  const targetPrice = alert.target_price ? Number(alert.target_price) : null;

  if (!targetPrice) {
    console.log('No target price set for price alert');
    return false;
  }

  console.log('Price Alert Check:', {
    cryptocurrency: alert.cryptocurrency,
    currentPrice,
    targetPrice,
    condition: alert.condition,
    creationPrice: alert.creation_price
  });

  let isTriggered = false;

  if (alert.condition === 'above') {
    // For 'above' condition, trigger when current price exceeds target price
    isTriggered = currentPrice >= targetPrice;
    console.log(`Checking if ${currentPrice} >= ${targetPrice}: ${isTriggered}`);
  } else if (alert.condition === 'below') {
    // For 'below' condition, trigger when current price falls below target price
    isTriggered = currentPrice <= targetPrice;
    console.log(`Checking if ${currentPrice} <= ${targetPrice}: ${isTriggered}`);
  }

  if (isTriggered) {
    console.log(`Alert triggered! Current price: ${currentPrice}, Target: ${targetPrice}, Condition: ${alert.condition}`);
  } else {
    console.log(`Alert not triggered. Current price: ${currentPrice}, Target: ${targetPrice}, Condition: ${alert.condition}`);
  }

  return isTriggered;
}