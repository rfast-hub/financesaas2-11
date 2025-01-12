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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { validateAlertInput, AlertType } from "./utils/validation";
import { PriceAlertFields } from "./alert-types/PriceAlertFields";
import { PercentageAlertField } from "./alert-types/PercentageAlertField";
import { VolumeAlertField } from "./alert-types/VolumeAlertField";

export const AlertForm = () => {
  const [cryptocurrency, setCryptocurrency] = useState("bitcoin");
  const [alertType, setAlertType] = useState<AlertType>("price");
  const [targetPrice, setTargetPrice] = useState("");
  const [percentage, setPercentage] = useState("");
  const [volume, setVolume] = useState("");
  const [condition, setCondition] = useState("above");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAlertInput(alertType, { targetPrice, percentage, volume });
    
    if (!validation.isValid) {
      toast({
        title: "Error",
        description: validation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("price_alerts").insert([
        {
          user_id: user.id,
          cryptocurrency,
          condition,
          alert_type: alertType,
          target_price: alertType === "price" ? parseFloat(targetPrice) : null,
          percentage_change: alertType === "percentage" ? parseFloat(percentage) : null,
          volume_threshold: alertType === "volume" ? parseFloat(volume) : null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Price alert created successfully",
      });

      // Reset form
      setTargetPrice("");
      setPercentage("");
      setVolume("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create price alert",
        variant: "destructive",
      });
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
              <SelectItem value="bitcoin">Bitcoin</SelectItem>
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="cardano">Cardano</SelectItem>
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

      <Button type="submit" className="w-full">
        Create Alert
      </Button>
    </form>
  );
};