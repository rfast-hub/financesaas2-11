import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { AlertCard } from "./AlertCard";
import { toast } from "sonner";

export const AlertList = () => {
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ["price-alerts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .eq('user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast.error("Failed to fetch alerts", {
        description: error.message
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-destructive">
        Failed to load alerts. Please try again.
      </p>
    );
  }

  if (!alerts?.length) {
    return (
      <p className="text-center text-muted-foreground">
        No price alerts set
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
};