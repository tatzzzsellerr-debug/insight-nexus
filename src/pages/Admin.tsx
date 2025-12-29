import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, Users, Key, CreditCard, Database, 
  Save, Trash2, Shield, RefreshCw, Check, X 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface ApiKeyData {
  id: string;
  user_id: string;
  key_value: string;
  plan: string;
  status: string;
  requests_used: number;
  requests_limit: number;
  expires_at: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
}

interface PaymentData {
  id: string;
  user_id: string;
  amount: number;
  plan: string;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  profiles?: { email: string };
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Settings state
  const [cryptoWallet, setCryptoWallet] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [elasticsearchUrl, setElasticsearchUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Data state
  const [users, setUsers] = useState<UserData[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast.error("Acceso denegado");
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
      fetchData();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value");

    if (data) {
      data.forEach((setting) => {
        if (setting.key === "crypto_wallet") setCryptoWallet(setting.value || "");
        if (setting.key === "paypal_client_id") setPaypalClientId(setting.value || "");
        if (setting.key === "elasticsearch_url") setElasticsearchUrl(setting.value || "");
      });
    }
  };

  const fetchData = async () => {
    setIsLoadingData(true);

    // Fetch users (profiles)
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesData) setUsers(profilesData);

    // Fetch API keys with user info
    const { data: keysData } = await supabase
      .from("api_keys")
      .select("*, profiles:user_id(email, full_name)")
      .order("created_at", { ascending: false });

    if (keysData) setApiKeys(keysData as any);

    // Fetch payments with user info
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*, profiles:user_id(email)")
      .order("created_at", { ascending: false });

    if (paymentsData) setPayments(paymentsData as any);

    setIsLoadingData(false);
  };

  const saveSetting = async (key: string, value: string) => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.success("Configuración guardada");
    }
    
    setIsSaving(false);
  };

  const updateApiKeyStatus = async (keyId: string, status: "active" | "inactive" | "expired" | "pending") => {
    const { error } = await supabase
      .from("api_keys")
      .update({ status })
      .eq("id", keyId);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Estado actualizado");
      fetchData();
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta API key?")) return;

    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", keyId);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("API key eliminada");
      fetchData();
    }
  };

  const generateManualKey = async (userId: string, plan: string = "básico") => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let keyValue = "osint_";
    for (let i = 0; i < 32; i++) {
      keyValue += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const limits: Record<string, number> = { básico: 100, pro: 1000, empresa: 999999 };

    const { error } = await supabase.from("api_keys").insert({
      user_id: userId,
      key_value: keyValue,
      plan,
      status: "active",
      requests_limit: limits[plan] || 100,
      requests_used: 0,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("API key generada");
      fetchData();
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-display">VERIFICANDO ACCESO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Shield className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl font-display font-bold glow-text">PANEL DE ADMINISTRACIÓN</h1>
              <p className="text-muted-foreground font-mono">Gestiona tu plataforma OSINTHUB</p>
            </div>
          </div>

          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card">
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" /> Config
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" /> Usuarios
              </TabsTrigger>
              <TabsTrigger value="keys" className="gap-2">
                <Key className="h-4 w-4" /> API Keys
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4" /> Pagos
              </TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card variant="cyber">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Configuración de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-mono text-muted-foreground">PayPal Client ID (Sandbox o Live)</label>
                    <div className="flex gap-2">
                      <Input
                        value={paypalClientId}
                        onChange={(e) => setPaypalClientId(e.target.value)}
                        placeholder="AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxB"
                      />
                      <Button 
                        variant="glow" 
                        onClick={() => saveSetting("paypal_client_id", paypalClientId)}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Obtén tu Client ID en: developer.paypal.com → Apps & Credentials
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-mono text-muted-foreground">Wallet Crypto (USDT - TRC20/ERC20/BEP20)</label>
                    <div className="flex gap-2">
                      <Input
                        value={cryptoWallet}
                        onChange={(e) => setCryptoWallet(e.target.value)}
                        placeholder="Tu dirección de wallet USDT"
                      />
                      <Button 
                        variant="glow" 
                        onClick={() => saveSetting("crypto_wallet", cryptoWallet)}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="cyber">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" /> Configuración de Elasticsearch
                  </CardTitle>
                  <CardDescription>
                    La URL de ngrok y API key se configuran en los secretos del backend.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <p className="text-sm font-mono mb-2">Secretos configurados:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>✅ ELASTICSEARCH_NGROK_URL</li>
                      <li>✅ ELASTICSEARCH_API_KEY</li>
                      <li>✅ PAYPAL_CLIENT_ID</li>
                      <li>✅ PAYPAL_CLIENT_SECRET</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card variant="cyber">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Usuarios Registrados ({users.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-mono">Email</th>
                          <th className="text-left p-2 font-mono">Nombre</th>
                          <th className="text-left p-2 font-mono">Registro</th>
                          <th className="text-left p-2 font-mono">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-2">{u.email}</td>
                            <td className="p-2">{u.full_name || "-"}</td>
                            <td className="p-2 text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateManualKey(u.id)}
                              >
                                <Key className="h-3 w-3 mr-1" /> Generar Key
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="keys">
              <Card variant="cyber">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>API Keys ({apiKeys.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-mono">Usuario</th>
                          <th className="text-left p-2 font-mono">Plan</th>
                          <th className="text-left p-2 font-mono">Estado</th>
                          <th className="text-left p-2 font-mono">Uso</th>
                          <th className="text-left p-2 font-mono">Expira</th>
                          <th className="text-left p-2 font-mono">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys.map((key) => (
                          <tr key={key.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-2">{key.profiles?.email || key.user_id}</td>
                            <td className="p-2 uppercase">{key.plan}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                key.status === "active" ? "bg-green-500/20 text-green-500" :
                                key.status === "expired" ? "bg-red-500/20 text-red-500" :
                                "bg-yellow-500/20 text-yellow-500"
                              }`}>
                                {key.status}
                              </span>
                            </td>
                            <td className="p-2">{key.requests_used}/{key.requests_limit}</td>
                            <td className="p-2 text-muted-foreground">
                              {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : "Nunca"}
                            </td>
                            <td className="p-2 flex gap-1">
                              {key.status !== "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateApiKeyStatus(key.id, "active")}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              {key.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateApiKeyStatus(key.id, "inactive")}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteApiKey(key.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card variant="cyber">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Historial de Pagos ({payments.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-mono">Usuario</th>
                          <th className="text-left p-2 font-mono">Plan</th>
                          <th className="text-left p-2 font-mono">Monto</th>
                          <th className="text-left p-2 font-mono">Método</th>
                          <th className="text-left p-2 font-mono">Estado</th>
                          <th className="text-left p-2 font-mono">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-2">{payment.profiles?.email || payment.user_id}</td>
                            <td className="p-2 uppercase">{payment.plan}</td>
                            <td className="p-2">${payment.amount}</td>
                            <td className="p-2 capitalize">{payment.payment_method}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                payment.status === "completed" ? "bg-green-500/20 text-green-500" :
                                payment.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                                "bg-red-500/20 text-red-500"
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {new Date(payment.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
