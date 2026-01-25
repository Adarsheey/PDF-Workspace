import { useState } from "react";
import { useSubmitFeedback } from "@/hooks/use-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2, Send } from "lucide-react";
import { useLocation } from "wouter";

export default function Feedback() {
  const [message, setMessage] = useState("");
  const { mutate, isPending } = useSubmitFeedback();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    mutate({ message }, {
      onSuccess: () => {
        setMessage("");
        setTimeout(() => setLocation("/"), 2000);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-white">Send Feedback</h1>
        <p className="text-muted-foreground text-lg">Help us improve PDF Master. Found a bug? Have a suggestion? Let us know!</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Your Message
            </label>
            <Textarea
              id="message"
              placeholder="Tell us what you think..."
              className="min-h-[200px] text-base resize-none bg-secondary/50 border-border focus:border-primary"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || !message.trim()}
              className="min-w-[140px] h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
