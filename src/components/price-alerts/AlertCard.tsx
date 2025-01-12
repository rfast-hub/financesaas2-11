import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AlertCardProps {
  alert: {
    id: string;
    cryptocurrency: string;
    condition: string;
    target_price: number | null;
    created_at: string;
    triggered_at: string | null;
    is_active: boolean;
  };
}

export const AlertCard = ({ alert }: AlertCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

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
      setIsDeleting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete price alert. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting price alert:", error);
      setIsDeleting(false);
    },
  });

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return price.toLocaleString();
  };

  const getAlertStatus = () => {
    if (alert.triggered_at) {
      return <Badge variant="secondary">Triggered</Badge>;
    }
    return alert.is_active ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-medium">
            {alert.cryptocurrency} {alert.condition} $
            {formatPrice(alert.target_price)}
          </p>
          {getAlertStatus()}
        </div>
        <p className="text-sm text-muted-foreground">
          Created on {new Date(alert.created_at!).toLocaleDateString()}
          {alert.triggered_at && (
            <> • Triggered on {new Date(alert.triggered_at).toLocaleDateString()}</>
          )}
        </p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => deleteAlert.mutate(alert.id)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Delete"
        )}
      </Button>
    </div>
  );
};