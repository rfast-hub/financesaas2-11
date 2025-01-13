import { PriceAlert, CryptoData } from './types.ts';

export function isPercentageAlertTriggered(alert: PriceAlert, cryptoData: CryptoData): boolean {
  if (!alert.percentage_change) {
    console.log('No percentage change set for percentage alert');
    return false;
  }

  const currentPercentage = Number(cryptoData.price_change_percentage_24h);
  const targetPercentage = Number(alert.percentage_change);

  const isTriggered = alert.condition === 'above'
    ? currentPercentage >= targetPercentage
    : currentPercentage <= targetPercentage;

  console.log(`Percentage comparison: ${currentPercentage}% ${alert.condition} ${targetPercentage}% = ${isTriggered}`);
  return isTriggered;
}