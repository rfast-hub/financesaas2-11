import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

export const useAlerts = () => {
  return useQuery({
    queryKey: ["price-alerts"],
    queryFn: async (): Promise<Tables<"price_alerts">[]> => {
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
    meta: {
      errorMessage: "Failed to fetch alerts",
    },
  });
};