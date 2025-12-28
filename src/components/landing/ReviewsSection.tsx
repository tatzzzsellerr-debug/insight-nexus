import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        content,
        rating,
        created_at,
        profiles!reviews_user_id_fkey (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && data) {
      setReviews(data as any);
    }
    setIsLoading(false);
  };

  const placeholderReviews = [
    {
      id: "1",
      content: "Increíble plataforma. He encontrado información que no sabía que existía. El equipo de soporte es excepcional.",
      rating: 5,
      name: "Carlos M.",
    },
    {
      id: "2",
      content: "La velocidad de búsqueda es impresionante. Resultados en menos de un segundo incluso con millones de registros.",
      rating: 5,
      name: "Ana R.",
    },
    {
      id: "3",
      content: "Uso diario para investigaciones periodísticas. La herramienta más completa que he probado.",
      rating: 5,
      name: "Miguel S.",
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : placeholderReviews;

  return (
    <section id="reviews" className="py-24 relative">
      <div className="absolute inset-0 cyber-grid opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="glow-text">RESEÑAS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono">
            Lo que dicen nuestros clientes sobre la plataforma.
            Solo usuarios con suscripción activa pueden dejar reseñas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayReviews.map((review, index) => (
            <Card 
              key={review.id} 
              variant="glass"
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/50 mb-4" />
                <p className="text-muted-foreground mb-4 italic">
                  "{review.content}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-foreground">
                      {'profiles' in review 
                        ? review.profiles?.full_name || review.profiles?.email.split('@')[0]
                        : (review as any).name
                      }
                    </p>
                    <div className="flex gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    CLIENTE VERIFICADO ✓
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reviews.length === 0 && !isLoading && (
          <p className="text-center text-muted-foreground mt-8 font-mono text-sm">
            Las reseñas mostradas son ejemplos. Los clientes activos pueden dejar sus opiniones desde el dashboard.
          </p>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
