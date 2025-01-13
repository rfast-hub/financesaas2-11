import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Subscription = Tables<"subscriptions">;

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
  });

  const cancelSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const { error } = await supabase.functions.invoke('cancel-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error("Failed to cancel subscription");
    }

    // Invalidate subscription query to refetch updated data
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  };

  return {
    subscription,
    isLoading,
    cancelSubscription,
  };
}