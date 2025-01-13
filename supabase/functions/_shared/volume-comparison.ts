import { PriceAlert, CryptoData } from './types.ts';

export function isVolumeAlertTriggered(alert: PriceAlert, cryptoData: CryptoData): boolean {
  if (!alert.volume_threshold) {
    console.log('No volume threshold set for volume alert');
    return false;
  }

  const currentVolume = Number(cryptoData.total_volume);
  const targetVolume = Number(alert.volume_threshold);
  const isTriggered = currentVolume >= targetVolume;

  console.log(`Volume comparison: ${currentVolume} >= ${targetVolume} = ${isTriggered}`);
  return isTriggered;
}