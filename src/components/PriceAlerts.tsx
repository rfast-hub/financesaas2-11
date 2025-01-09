import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PriceAlerts = () => {
  const [cryptocurrency, setCryptocurrency] = useState("BTC");
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState("above");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["price-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createAlert = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("price_alerts").insert([
        {
          cryptocurrency,
          target_price: parseFloat(targetPrice),
          condition,
          email_notification: true,
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

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast({
        title: "Success",
        description: "Price alert deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete price alert. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting price alert:", error);
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
        <CardDescription>
          Get notified when cryptocurrencies hit your target price
        </CardDescription>
      </CardHeader>
      <CardContent>
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

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : alerts?.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No price alerts set
            </p>
          ) : (
            <div className="space-y-4">
              {alerts?.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {alert.cryptocurrency} {alert.condition} $
                      {alert.target_price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created on{" "}
                      {new Date(alert.created_at!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAlert.mutate(alert.id)}
                    disabled={deleteAlert.isPending}
                  >
                    {deleteAlert.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceAlerts;