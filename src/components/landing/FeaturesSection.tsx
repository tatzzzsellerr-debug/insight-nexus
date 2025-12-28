import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Database, 
  Shield, 
  Zap, 
  Globe, 
  Lock,
  Eye,
  Server
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Búsqueda Avanzada",
    description: "Elasticsearch optimizado para búsquedas complejas con filtros múltiples y operadores booleanos.",
  },
  {
    icon: Database,
    title: "Múltiples Fuentes",
    description: "Acceso a bases de datos de emails, teléfonos, redes sociales, dominios y más.",
  },
  {
    icon: Shield,
    title: "Protección DDoS",
    description: "Sistema de mitigación avanzado con rate limiting y detección de patrones maliciosos.",
  },
  {
    icon: Zap,
    title: "Resultados Instantáneos",
    description: "Tiempos de respuesta menores a 500ms incluso en búsquedas complejas.",
  },
  {
    icon: Globe,
    title: "Cobertura Global",
    description: "Datos de más de 195 países con actualización continua.",
  },
  {
    icon: Lock,
    title: "API Segura",
    description: "Autenticación por API Key con encriptación end-to-end.",
  },
  {
    icon: Eye,
    title: "Monitorización",
    description: "Alertas en tiempo real cuando aparecen nuevos datos relacionados.",
  },
  {
    icon: Server,
    title: "Infraestructura",
    description: "Servidores distribuidos globalmente para máxima disponibilidad.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 cyber-grid opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="glow-text">CARACTERÍSTICAS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-mono">
            Herramientas profesionales de OSINT diseñadas para investigadores,
            periodistas y profesionales de seguridad.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              variant="glow"
              className="group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors group-hover:shadow-[0_0_20px_hsl(25_100%_50%/0.3)]">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
