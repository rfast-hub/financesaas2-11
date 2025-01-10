import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

export const useCreateAlert = (onSuccess: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (alertData: Omit<AlertData, "user_id">) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error("Failed to get session");
      }

      if (!sessionData.session) {
        // If no session, redirect to login
        navigate("/login");
        throw new Error("Please login to create alerts");
      }

      const { data, error } = await supabase
        .from("price_alerts")
        .insert([{ ...alertData, user_id: sessionData.session.user.id }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast({
        title: "Success",
        description: "Price alert created successfully!",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create price alert. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating price alert:", error);
    },
  });
};