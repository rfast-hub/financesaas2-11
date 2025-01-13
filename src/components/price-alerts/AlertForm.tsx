import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { validateAlertInput, AlertType } from "./utils/validation";
import { PriceAlertFields } from "./alert-types/PriceAlertFields";
import { PercentageAlertField } from "./alert-types/PercentageAlertField";
import { VolumeAlertField } from "./alert-types/VolumeAlertField";
import { SUPPORTED_CRYPTOCURRENCIES } from "./utils/constants";
import { Loader2 } from "lucide-react";

export const AlertForm = () => {
  const [cryptocurrency, setCryptocurrency] = useState("bitcoin");
  const [alertType, setAlertType] = useState<AlertType>("price");
  const [targetPrice, setTargetPrice] = useState("");
  const [percentage, setPercentage] = useState("");
  const [volume, setVolume] = useState("");
  const [condition, setCondition] = useState("above");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getCurrentPrice = async (crypto: string): Promise<number | null> => {
    try {
      console.log(`Fetching current price for ${crypto}...`);
      // First try the Pro API endpoint
      const proApiResponse = await fetch(
        `https://pro-api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Cg-Pro-Api-Key': process.env.COINGECKO_API_KEY || '',
          }
        }
      );
      
      // If Pro API fails, fallback to free API
      if (!proApiResponse.ok) {
        console.log('Pro API failed, falling back to free API');
        const freeApiResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usd`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        if (!freeApiResponse.ok) {
          console.error(`Both API endpoints failed for ${crypto}`);
          throw new Error('Failed to fetch price from both API endpoints');
        }
        
        const data = await freeApiResponse.json();
        if (!data[crypto]?.usd) {
          throw new Error('No price data available');
        }
        return data[crypto].usd;
      }
      
      const data = await proApiResponse.json();
      console.log('Price data:', data);
      
      if (!data[crypto]?.usd) {
        console.error('No price data found for', crypto);
        throw new Error('No price data available');
      }
      
      return data[crypto].usd;
    } catch (error) {
      console.error("Error fetching current price:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    console.log('Starting alert creation process...');
    
    try {
      // Validate input
      const validation = validateAlertInput(alertType, { targetPrice, percentage, volume });
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        toast({
          description: validation.errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);
      
      if (!user) {
        toast({
          description: "Please sign in to create alerts",
          variant: "destructive",
        });
        return;
      }

      // Get current price
      const currentPrice = await getCurrentPrice(cryptocurrency);
      console.log('Current price for alert:', currentPrice);
      
      if (!currentPrice) {
        toast({
          description: "Failed to fetch current price. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create alert
      console.log('Creating alert with data:', {
        cryptocurrency,
        alertType,
        targetPrice,
        percentage,
        volume,
        condition,
        currentPrice
      });

      const { error } = await supabase.from("price_alerts").insert([
        {
          user_id: user.id,
          cryptocurrency,
          condition,
          alert_type: alertType,
          target_price: alertType === "price" ? parseFloat(targetPrice) : null,
          percentage_change: alertType === "percentage" ? parseFloat(percentage) : null,
          volume_threshold: alertType === "volume" ? parseFloat(volume) : null,
          is_active: true,
          creation_price: currentPrice,
          email_notification: true,
        },
      ]);

      if (error) throw error;

      console.log('Alert created successfully');
      toast({
        description: "Price alert created successfully",
      });

      // Reset form
      setTargetPrice("");
      setPercentage("");
      setVolume("");
    } catch (error) {
      console.error("Error creating price alert:", error);
      toast({
        description: "Failed to create price alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Select
            value={cryptocurrency}
            onValueChange={setCryptocurrency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cryptocurrency" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CRYPTOCURRENCIES.map((crypto) => (
                <SelectItem key={crypto.id} value={crypto.id}>
                  {crypto.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Select
            value={alertType}
            onValueChange={(value: AlertType) => setAlertType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select alert type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price Alert</SelectItem>
              <SelectItem value="percentage">Percentage Change</SelectItem>
              <SelectItem value="volume">Volume Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {alertType === "price" && (
          <PriceAlertFields
            targetPrice={targetPrice}
            condition={condition}
            onTargetPriceChange={setTargetPrice}
            onConditionChange={setCondition}
          />
        )}

        {alertType === "percentage" && (
          <PercentageAlertField
            percentage={percentage}
            onPercentageChange={setPercentage}
          />
        )}

        {alertType === "volume" && (
          <VolumeAlertField
            volume={volume}
            onVolumeChange={setVolume}
          />
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Alert...
          </>
        ) : (
          'Create Alert'
        )}
      </Button>
    </form>
  );
};