import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriceAlertFields } from "./alert-types/PriceAlertFields";
import { PercentageAlertField } from "./alert-types/PercentageAlertField";
import { VolumeAlertField } from "./alert-types/VolumeAlertField";
import { AIAlertButton } from "./AIAlertButton";
import { useCreateAlert } from "./hooks/useCreateAlert";

export const AlertForm = () => {
  const [cryptocurrency, setCryptocurrency] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");
  const [alertType, setAlertType] = useState("price");
  const [percentage, setPercentage] = useState("");
  const [volume, setVolume] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setTargetPrice("");
    setPercentage("");
    setVolume("");
  };

  const createAlert = useCreateAlert(resetForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let isValid = true;
    let errorMessage = "";

    switch (alertType) {
      case "price":
        if (!targetPrice || isNaN(parseFloat(targetPrice)) || parseFloat(targetPrice) <= 0) {
          isValid = false;
          errorMessage = "Please enter a valid target price greater than 0";
        }
        break;
      case "percentage":
        if (!percentage || isNaN(parseFloat(percentage))) {
          isValid = false;
          errorMessage = "Please enter a valid percentage";
        }
        break;
      case "volume":
        if (!volume || isNaN(parseFloat(volume)) || parseFloat(volume) <= 0) {
          isValid = false;
          errorMessage = "Please enter a valid volume threshold greater than 0";
        }
        break;
    }

    if (!isValid) {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    const alertData = {
      cryptocurrency,
      condition,
      email_notification: true,
      alert_type: alertType,
      ...(alertType === "price" && { target_price: parseFloat(targetPrice) }),
      ...(alertType === "percentage" && { percentage_change: parseFloat(percentage) }),
      ...(alertType === "volume" && { volume_threshold: parseFloat(volume) }),
    };

    createAlert.mutate(alertData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <Select
          value={cryptocurrency}
          onValueChange={setCryptocurrency}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select crypto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
            <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
            <SelectItem value="USDT">Tether (USDT)</SelectItem>
            <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={alertType}
          onValueChange={(value) => {
            setAlertType(value);
            resetForm();
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alert type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price Alert</SelectItem>
            <SelectItem value="percentage">Percentage Change</SelectItem>
            <SelectItem value="volume">Volume Alert</SelectItem>
          </SelectContent>
        </Select>

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

        <div className="flex gap-2">
          <Button type="submit" disabled={createAlert.isPending}>
            {createAlert.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Alert"
            )}
          </Button>

          <AIAlertButton cryptocurrency={cryptocurrency} />
        </div>
      </div>
    </form>
  );
};