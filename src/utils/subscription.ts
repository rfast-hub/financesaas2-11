import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Subscription {
  id: string;
  status: string;
  current_period_end: string | null;
  is_active: boolean;
}

export const fetchSubscription = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }

  return data;
};

export const cancelSubscription = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await supabase.functions.invoke('cancel-subscription', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (response.error) {
    console.error('Error from Edge Function:', response.error);
    const errorData = JSON.parse(response.error.message);
    throw new Error(errorData.error || 'Failed to cancel subscription');
  }

  return response.data;
};