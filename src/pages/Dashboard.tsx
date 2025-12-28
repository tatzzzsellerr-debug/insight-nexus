import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Key, Activity, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    toast.info("Buscando en Elasticsearch...");
    
    // Simulated search - will connect to real Elasticsearch via admin settings
    setTimeout(() => {
      setResults([
        { id: 1, type: "email", value: `${searchQuery}@example.com`, source: "Leak DB 2024" },
        { id: 2, type: "domain", value: `${searchQuery}.com`, source: "DNS Records" },
      ]);
      setIsSearching(false);
      toast.success("Búsqueda completada");
    }, 1500);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary animate-pulse font-display">CARGANDO...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold glow-text mb-2">DASHBOARD</h1>
            <p className="text-muted-foreground font-mono">Bienvenido, {user?.email}</p>
          </div>

          {/* Search Box */}
          <Card variant="cyber">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> BÚSQUEDA OSINT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
                <Input
                  placeholder="Email, teléfono, nombre, dominio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="cyber" type="submit" disabled={isSearching}>
                  {isSearching ? "BUSCANDO..." : "BUSCAR"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <Card variant="glow">
              <CardHeader>
                <CardTitle>RESULTADOS ({results.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-primary font-mono uppercase">{result.type}</span>
                          <p className="text-foreground font-mono">{result.value}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card variant="glass">
              <CardContent className="pt-6 text-center">
                <Key className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">ACTIVA</p>
                <p className="text-sm text-muted-foreground">Estado API Key</p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="pt-6 text-center">
                <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">0/100</p>
                <p className="text-sm text-muted-foreground">Búsquedas hoy</p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="pt-6 text-center">
                <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">BÁSICO</p>
                <p className="text-sm text-muted-foreground">Plan actual</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
