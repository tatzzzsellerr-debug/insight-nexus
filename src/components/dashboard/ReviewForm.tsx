import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewFormProps {
  userId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ userId, onReviewSubmitted }: ReviewFormProps) => {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Por favor, escribe tu reseña");
      return;
    }

    if (content.trim().length < 10) {
      toast.error("La reseña debe tener al menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: userId,
        content: content.trim(),
        rating,
      });

      if (error) {
        if (error.code === "42501") {
          toast.error("Solo clientes con API key activa pueden dejar reseñas");
        } else {
          throw error;
        }
        return;
      }

      toast.success("¡Gracias por tu reseña!");
      setContent("");
      setRating(5);
      onReviewSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Error al enviar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="cyber">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> DEJAR RESEÑA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground font-mono mb-2 block">
              Calificación
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground font-mono mb-2 block">
              Tu opinión
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comparte tu experiencia con OSINTHUB..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/500
            </p>
          </div>

          <Button
            type="submit"
            variant="cyber"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "ENVIANDO..." : "PUBLICAR RESEÑA"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
