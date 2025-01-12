import { PriceAlert, CryptoData, EmailRequest } from './types.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function generateEmailTemplate(alert: PriceAlert, cryptoData: CryptoData): string {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);

  const formatPercentage = (value: number) => 
    `${value.toFixed(2)}%`;

  const formatVolume = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);

  let alertDetails = '';
  switch (alert.alert_type) {
    case 'price':
      alertDetails = `
        <p>Current Price: ${formatCurrency(cryptoData.current_price)}</p>
        <p>Target Price: ${formatCurrency(alert.target_price || 0)}</p>
        <p>Condition: Price ${alert.condition} target</p>
      `;
      break;
    case 'percentage':
      alertDetails = `
        <p>24h Price Change: ${formatPercentage(cryptoData.price_change_percentage_24h)}</p>
        <p>Target Change: ${formatPercentage(alert.percentage_change || 0)}</p>
        <p>Condition: Change ${alert.condition} target</p>
      `;
      break;
    case 'volume':
      alertDetails = `
        <p>24h Trading Volume: ${formatVolume(cryptoData.total_volume)}</p>
        <p>Volume Threshold: ${formatVolume(alert.volume_threshold || 0)}</p>
        <p>Status: Volume threshold reached</p>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .alert-details {
            background-color: #fff;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #6c757d;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Crypto Alert Triggered</h2>
          <p>Your ${alert.alert_type} alert for ${alert.cryptocurrency.toUpperCase()} has been triggered.</p>
        </div>
        <div class="alert-details">
          ${alertDetails}
        </div>
        <div class="footer">
          <p>This is an automated message from CryptoTrack. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmailWithRetry(emailRequest: EmailRequest, retryCount = 0): Promise<Response> {
  try {
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key not configured');
    }

    console.log(`Attempting to send email (attempt ${retryCount + 1}/${MAX_RETRIES})`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log('Email sent successfully');
    return response;

  } catch (error) {
    console.error(`Error sending email (attempt ${retryCount + 1}):`, error);

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return sendEmailWithRetry(emailRequest, retryCount + 1);
    }

    throw error;
  }
}

export async function sendEmailAlert(email: string, alert: PriceAlert, cryptoData: CryptoData) {
  try {
    const emailRequest: EmailRequest = {
      from: 'CryptoTrack <alerts@cryptotrack.com>',
      to: [email],
      subject: `${alert.cryptocurrency.toUpperCase()} Alert Triggered`,
      html: generateEmailTemplate(alert, cryptoData),
    };

    const response = await sendEmailWithRetry(emailRequest);
    const data = await response.json();
    
    console.log('Email alert sent successfully:', {
      alertId: alert.id,
      cryptocurrency: alert.cryptocurrency,
      alertType: alert.alert_type,
      recipient: email,
      responseData: data,
    });

    return data;
  } catch (error) {
    console.error('Failed to send email alert:', {
      alertId: alert.id,
      cryptocurrency: alert.cryptocurrency,
      alertType: alert.alert_type,
      recipient: email,
      error: error.message,
    });
    throw error;
  }
}