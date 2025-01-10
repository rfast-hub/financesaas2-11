import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
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

export const AlertForm = () => {
  const [cryptocurrency, setCryptocurrency] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAlert = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.from("price_alerts").insert([
        {
          cryptocurrency,
          target_price: parseFloat(targetPrice),
          condition,
          email_notification: true,
          user_id: user.id,
        },
      ]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast({
        title: "Success",
        description: "Price alert created successfully!",
      });
      setTargetPrice("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || isNaN(parseFloat(targetPrice))) {
      toast({
        title: "Error",
        description: "Please enter a valid target price",
        variant: "destructive",
      });
      return;
    }
    createAlert.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-4">
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

        <Button type="submit" disabled={createAlert.isPending}>
          {createAlert.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Create Alert"
          )}
        </Button>
      </div>
    </form>
  );
};