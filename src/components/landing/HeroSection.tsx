import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Shield, Zap, Database } from "lucide-react";
const HeroSection = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-float" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 bg-primary/10 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-mono text-primary">PLATAFORMA ACTIVA</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight animate-fade-in delay-100">
            <span className="glow-text">INTELIGENCIA</span>
            <br />
            <span className="text-muted-foreground">DE FUENTES ABIERTAS</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-mono animate-fade-in delay-200">
            Accede a billones de registros con búsquedas avanzadas.
            Elasticsearch potenciado para investigaciones profesionales.
          </p>

          {/* Search preview */}
          <div className="max-w-2xl mx-auto animate-fade-in delay-300">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative flex items-center bg-card border border-border rounded-lg p-2">
                <Search className="h-5 w-5 text-muted-foreground ml-3" />
                <input type="text" placeholder="Buscar emails, nombres, teléfonos, dominios..." className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-foreground font-mono placeholder:text-muted-foreground" disabled />
                <Button variant="cyber" className="mr-1">
                  BUSCAR
                </Button>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in delay-400">
            <Button variant="cyber" size="xl" asChild>
              <Link to="/auth?mode=signup">
                <Zap className="h-5 w-5" />
                COMENZAR AHORA
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/#pricing">
                VER PLANES
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 animate-fade-in delay-500">
            <div className="text-center">
              <Database className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-display font-bold text-foreground">300B+</div>
              <div className="text-sm text-muted-foreground font-mono">Registros</div>
            </div>
            <div className="text-center">
              <Search className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-display font-bold text-foreground">0.5s</div>
              <div className="text-sm text-muted-foreground font-mono">Tiempo medio</div>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-display font-bold text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground font-mono">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanning line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scan opacity-50" />
      </div>
    </section>;
};
export default HeroSection;