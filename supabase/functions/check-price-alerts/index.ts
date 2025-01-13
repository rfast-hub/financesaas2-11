import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getCryptoData } from '../_shared/crypto-service.ts';
import { sendEmailAlert } from '../_shared/email-service.ts';
import { 
  fetchActiveAlerts, 
  isAlertTriggered, 
  markAlertAsTriggered,
  getUserEmail 
} from '../_shared/alert-service.ts';
import { PriceAlert } from '../_shared/types.ts';

async function processAlert(alert: PriceAlert): Promise<boolean> {
  try {
    console.log(`Processing alert for ${alert.cryptocurrency}:`, {
      id: alert.id,
      cryptocurrency: alert.cryptocurrency,
      target_price: alert.target_price,
      condition: alert.condition,
      creation_price: alert.creation_price,
      alert_type: alert.alert_type
    });
    
    const cryptoData = await getCryptoData(alert.cryptocurrency);
    if (!cryptoData) {
      console.error(`Failed to fetch crypto data for ${alert.cryptocurrency}`);
      return false;
    }

    console.log(`Current crypto data for ${alert.cryptocurrency}:`, cryptoData);
    
    if (isAlertTriggered(alert, cryptoData)) {
      console.log(`Alert ${alert.id} triggered!`, {
        current_price: cryptoData.current_price,
        target_price: alert.target_price,
        condition: alert.condition
      });
      
      if (alert.email_notification) {
        const userEmail = await getUserEmail(alert.user_id);
        if (userEmail) {
          console.log(`Sending email notification to ${userEmail}`);
          await sendEmailAlert(userEmail, alert, cryptoData);
          console.log(`Email sent successfully to ${userEmail} for alert ${alert.id}`);
        } else {
          console.error(`No email found for user ${alert.user_id}`);
        }
      }

      await markAlertAsTriggered(alert.id);
      console.log(`Alert ${alert.id} marked as triggered`);
      return true;
    } else {
      console.log(`Alert ${alert.id} not triggered. Current price: ${cryptoData.current_price}, Target: ${alert.target_price}`);
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing alert ${alert.id}:`, error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting price alerts check...");
    
    const alerts = await fetchActiveAlerts();
    console.log(`Found ${alerts?.length || 0} active alerts to check`);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'No active alerts to check'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const processedAlerts = [];
    const errors = [];
    
    for (const alert of alerts) {
      try {
        const success = await processAlert(alert);
        if (success) {
          processedAlerts.push(alert.id);
        }
      } catch (error) {
        console.error(`Failed to process alert ${alert.id}:`, error);
        errors.push({ alertId: alert.id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Alerts checked successfully',
        processed: processedAlerts,
        errors: errors,
        total_alerts_checked: alerts.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing price alerts:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        status: 'error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);