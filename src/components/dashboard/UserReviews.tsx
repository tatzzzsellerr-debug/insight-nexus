import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
}

interface UserReviewsProps {
  userId: string;
  refreshTrigger: number;
}

const UserReviews = ({ userId, refreshTrigger }: UserReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserReviews();
  }, [userId, refreshTrigger]);

  const handleDelete = async (reviewId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta reseña?")) return;

    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      toast.success("Reseña eliminada");
      fetchUserReviews();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground animate-pulse">
            Cargando tus reseñas...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" /> TUS RESEÑAS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 border border-border rounded-lg bg-card/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "{review.content}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(review.id)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserReviews;
