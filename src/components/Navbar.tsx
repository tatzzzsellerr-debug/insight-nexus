import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const navLinks = [{
    href: "/",
    label: "Inicio"
  }, {
    href: "/#features",
    label: "Características"
  }, {
    href: "/#pricing",
    label: "Planes"
  }, {
    href: "/#reviews",
    label: "Reseñas"
  }];
  const isActive = (href: string) => location.pathname === href;
  return <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <Shield className="h-8 w-8 text-primary animate-pulse-glow" />
            <span className="text-xl font-display font-bold glow-text">
              C1<span className="text-muted-foreground">HUB</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => <Link key={link.href} to={link.href} className={`text-sm font-mono transition-all duration-300 hover:text-primary ${isActive(link.href) ? "text-primary glow-text" : "text-muted-foreground"}`}>
                {link.label}
              </Link>)}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? <>
                {isAdmin && <Button variant="terminal" size="sm" asChild>
                    <Link to="/admin">Admin Panel</Link>
                  </Button>}
                <Button variant="glow" size="sm" asChild>
                  <Link to="/dashboard">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </> : <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Iniciar Sesión</Link>
                </Button>
                <Button variant="cyber" size="sm" asChild>
                  <Link to="/auth?mode=signup">Registrarse</Link>
                </Button>
              </>}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {navLinks.map(link => <Link key={link.href} to={link.href} className="block text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                {link.label}
              </Link>)}
            <div className="pt-4 space-y-2">
              {user ? <>
                  {isAdmin && <Button variant="terminal" className="w-full" asChild>
                      <Link to="/admin">Admin Panel</Link>
                    </Button>}
                  <Button variant="glow" className="w-full" asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={signOut}>
                    Cerrar Sesión
                  </Button>
                </> : <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/auth">Iniciar Sesión</Link>
                  </Button>
                  <Button variant="cyber" className="w-full" asChild>
                    <Link to="/auth?mode=signup">Registrarse</Link>
                  </Button>
                </>}
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;