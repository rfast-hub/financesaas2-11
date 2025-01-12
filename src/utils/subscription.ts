import { supabase } from "@/integrations/supabase/client";

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

  try {
    const response = await supabase.functions.invoke('cancel-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      // Parse the error message from the Edge Function
      let errorMessage = 'Failed to cancel subscription';
      try {
        const errorData = JSON.parse(response.error.message);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.error.message || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.data;
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    throw error;
  }
};