import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Crown, Building } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "BÁSICO",
    price: "29",
    description: "Para investigadores individuales",
    icon: Zap,
    features: [
      "100 búsquedas/día",
      "Acceso a 3 bases de datos",
      "Soporte por email",
      "API básica",
      "Exportar a CSV",
    ],
    highlighted: false,
  },
  {
    name: "PRO",
    price: "99",
    description: "Para profesionales",
    icon: Crown,
    features: [
      "1000 búsquedas/día",
      "Acceso a todas las bases",
      "Soporte prioritario",
      "API completa",
      "Exportar a múltiples formatos",
      "Monitorización de alertas",
      "Dashboard avanzado",
    ],
    highlighted: true,
  },
  {
    name: "EMPRESA",
    price: "299",
    description: "Para equipos y organizaciones",
    icon: Building,
    features: [
      "Búsquedas ilimitadas",
      "Acceso completo",
      "Soporte 24/7",
      "API Enterprise",
      "Usuarios ilimitados",
      "SLA garantizado",
      "Integración personalizada",
      "Formación incluida",
    ],
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="glow-text">PLANES</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono">
            Elige el plan que mejor se adapte a tus necesidades.
            Pago seguro con PayPal o Criptomonedas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              variant={plan.highlighted ? "cyber" : "glow"}
              className={`relative animate-fade-in ${plan.highlighted ? "scale-105 border-primary" : ""}`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-display rounded-full">
                  MÁS POPULAR
                </div>
              )}
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <plan.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-5xl font-display font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={plan.highlighted ? "cyber" : "glow"} 
                  className="w-full"
                  asChild
                >
                  <Link to={`/auth?mode=signup&plan=${plan.name.toLowerCase()}`}>
                    COMENZAR
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground font-mono">
            💳 Aceptamos PayPal y Criptomonedas (BTC, ETH, USDT)
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
