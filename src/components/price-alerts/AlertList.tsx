import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AlertCard } from "./AlertCard";
import { useAlerts } from "./hooks/useAlerts";
import { toast } from "sonner";

export const AlertList = () => {
  const { data: alerts, isLoading, error, refetch } = useAlerts();

  // Refresh alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    toast.error("Failed to fetch alerts");
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