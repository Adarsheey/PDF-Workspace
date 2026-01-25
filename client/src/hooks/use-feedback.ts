import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { InsertFeedback } from "@shared/schema";

export function useSubmitFeedback() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertFeedback) => {
      const validated = api.feedback.create.input.parse(data);
      const res = await fetch(api.feedback.create.path, {
        method: api.feedback.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      return api.feedback.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Feedback Received",
        description: "Thank you for helping us improve PDF Master!",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
