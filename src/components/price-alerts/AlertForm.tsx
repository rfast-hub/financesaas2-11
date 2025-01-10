import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Brain } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AlertData = {
  cryptocurrency: string;
  user_id: string;
  condition: string;
  email_notification: boolean;
  alert_type: string;
  target_price?: number;
  percentage_change?: number;
  volume_threshold?: number;
};

export const AlertForm = () => {
  const [cryptocurrency, setCryptocurrency] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");
  const [alertType, setAlertType] = useState("price");
  const [percentage, setPercentage] = useState("");
  const [volume, setVolume] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAlert = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const alertData: AlertData = {
        cryptocurrency,
        user_id: user.id,
        condition,
        email_notification: true,
        alert_type: alertType,
      };

      // Add specific fields based on alert type
      if (alertType === "price") {
        alertData.target_price = parseFloat(targetPrice);
      } else if (alertType === "percentage") {
        alertData.percentage_change = parseFloat(percentage);
      } else if (alertType === "volume") {
        alertData.volume_threshold = parseFloat(volume);
      }

      const { data, error } = await supabase
        .from("price_alerts")
        .insert([alertData]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast({
        title: "Success",
        description: "Price alert created successfully!",
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create price alert. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating price alert:", error);
    },
  });

  const createAIAlert = useMutation({
    mutationFn: async () => {
      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get the session for the auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase.functions.invoke("create-ai-alert", {
        body: { cryptocurrency },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast({
        title: "AI Alert Created",
        description: data.message || "AI-powered alert created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create AI alert. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating AI alert:", error);
    },
  });

  const resetForm = () => {
    setTargetPrice("");
    setPercentage("");
    setVolume("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (alertType === "price" && (!targetPrice || isNaN(parseFloat(targetPrice)))) {
      toast({
        title: "Error",
        description: "Please enter a valid target price",
        variant: "destructive",
      });
      return;
    }

    if (alertType === "percentage" && (!percentage || isNaN(parseFloat(percentage)))) {
      toast({
        title: "Error",
        description: "Please enter a valid percentage",
        variant: "destructive",
      });
      return;
    }

    if (alertType === "volume" && (!volume || isNaN(parseFloat(volume)))) {
      toast({
        title: "Error",
        description: "Please enter a valid volume threshold",
        variant: "destructive",
      });
      return;
    }

    createAlert.mutate();
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
          <>
            <Select
              value={condition}
              onValueChange={setCondition}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Price goes above</SelectItem>
                <SelectItem value="below">Price goes below</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-[180px]"
            />
          </>
        )}

        {alertType === "percentage" && (
          <Input
            type="number"
            placeholder="Percentage change"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="w-[180px]"
          />
        )}

        {alertType === "volume" && (
          <Input
            type="number"
            placeholder="Volume threshold"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-[180px]"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => createAIAlert.mutate()}
                disabled={createAIAlert.isPending}
              >
                {createAIAlert.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                <span className="ml-2">AI Alert</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Create an AI-powered alert based on market analysis
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  );
};