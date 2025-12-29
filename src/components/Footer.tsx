import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
const Footer = () => {
  return <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-display font-bold">
                OSINT<span className="text-muted-foreground">HUB</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Plataforma líder en inteligencia de fuentes abiertas.
              Potencia tus investigaciones con tecnología avanzada.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Producto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/#features" className="hover:text-primary transition-colors">Características</Link></li>
              <li><Link to="/#pricing" className="hover:text-primary transition-colors">Planes</Link></li>
              <li><Link to="/#reviews" className="hover:text-primary transition-colors">Reseñas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Soporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Documentación</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Términos</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 C1HUB. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-mono">
              [ SISTEMA ACTIVO ] <span className="text-green-500">●</span>
            </span>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;