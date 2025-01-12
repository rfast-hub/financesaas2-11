import { PriceAlert, CryptoData, EmailRequest } from './types.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

export async function sendEmailAlert(email: string, alert: PriceAlert, cryptoData: CryptoData) {
  try {
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }

    let alertMessage = '';
    switch (alert.alert_type) {
      case 'price':
        alertMessage = `Current price: $${cryptoData.current_price}<br>Target price: $${alert.target_price}`;
        break;
      case 'percentage':
        alertMessage = `24h Price Change: ${cryptoData.price_change_percentage_24h.toFixed(2)}%<br>Target Change: ${alert.percentage_change}%`;
        break;
      case 'volume':
        alertMessage = `24h Volume: $${cryptoData.total_volume.toLocaleString()}<br>Volume Threshold: $${alert.volume_threshold?.toLocaleString()}`;
        break;
    }

    const emailRequest: EmailRequest = {
      from: 'CryptoTrack <alerts@cryptotrack.com>',
      to: [email],
      subject: `${alert.cryptocurrency.toUpperCase()} Alert Triggered`,
      html: `
        <h2>Crypto Alert Triggered</h2>
        <p>Your ${alert.alert_type} alert for ${alert.cryptocurrency.toUpperCase()} has been triggered.</p>
        <p>${alertMessage}</p>
      `,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailRequest),
    });

    if (!response.ok) {
      throw new Error('Failed to send email alert');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email alert:', error);
    throw error;
  }
}