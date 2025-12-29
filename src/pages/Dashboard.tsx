import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Key, Activity, AlertTriangle, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApiKey } from "@/hooks/useApiKey";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  index: string;
  score: number;
  data: Record<string, any>;
}

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { apiKey, hasActiveKey, isLoading: keyLoading } = useApiKey();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [remainingSearches, setRemainingSearches] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (apiKey) {
      setRemainingSearches(apiKey.requests_limit - apiKey.requests_used);
    }
  }, [apiKey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!hasActiveKey) {
      toast.error("Necesitas una API key activa para buscar");
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("elasticsearch-search", {
        body: { query: searchQuery },
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      setResults(data.results || []);
      setRemainingSearches(data.remaining);
      toast.success(`${data.total} resultados encontrados`);
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error.message || "Error al buscar");
    } finally {
      setIsSearching(false);
    }
  };

  const isLoading = authLoading || keyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-display">CARGANDO...</div>
      </div>
    );
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

          {/* No Active Key Warning */}
          {!hasActiveKey && (
            <Card variant="cyber" className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <AlertTriangle className="h-12 w-12 text-destructive shrink-0" />
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-display font-bold text-destructive">
                      NO TIENES UNA API KEY ACTIVA
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Para realizar búsquedas OSINT, necesitas adquirir un plan.
                    </p>
                  </div>
                  <Button variant="cyber" asChild>
                    <Link to="/checkout?plan=básico">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      COMPRAR PLAN
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                  disabled={!hasActiveKey}
                />
                <Button
                  variant="cyber"
                  type="submit"
                  disabled={isSearching || !hasActiveKey}
                >
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
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-primary font-mono uppercase">
                          {result.index}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Score: {result.score?.toFixed(2)}
                        </span>
                      </div>
                      <pre className="text-sm text-foreground font-mono whitespace-pre-wrap break-all bg-background/50 p-2 rounded">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
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
                <p className={`text-2xl font-display font-bold ${hasActiveKey ? "text-green-500" : "text-destructive"}`}>
                  {hasActiveKey ? "ACTIVA" : "INACTIVA"}
                </p>
                <p className="text-sm text-muted-foreground">Estado API Key</p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="pt-6 text-center">
                <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold">
                  {apiKey ? `${apiKey.requests_used}/${apiKey.requests_limit}` : "0/0"}
                </p>
                <p className="text-sm text-muted-foreground">Búsquedas usadas</p>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="pt-6 text-center">
                <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-display font-bold uppercase">
                  {apiKey?.plan || "SIN PLAN"}
                </p>
                <p className="text-sm text-muted-foreground">Plan actual</p>
              </CardContent>
            </Card>
          </div>

          {/* API Key Display */}
          {hasActiveKey && apiKey && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" /> TU API KEY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="block w-full p-3 bg-background rounded border border-border font-mono text-sm break-all">
                  {apiKey.key_value}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Expira: {apiKey.expires_at ? new Date(apiKey.expires_at).toLocaleDateString() : "Nunca"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
