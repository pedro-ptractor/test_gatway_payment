import { useMutation } from '@tanstack/react-query';
import { createCheckoutSession } from '@/lib/api';

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (planId: string) => createCheckoutSession(planId),
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });
}
