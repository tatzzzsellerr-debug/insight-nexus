import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Bitcoin, Copy, Check, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MatrixRain from "@/components/MatrixRain";

const plans = {
  básico: { price: 29, requests: 100, name: "BÁSICO" },
  pro: { price: 99, requests: 1000, name: "PRO" },
  empresa: { price: 299, requests: 999999, name: "EMPRESA" },
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") || "básico";
  const plan = plans[planParam as keyof typeof plans] || plans.básico;
  
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto">("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cryptoWallet, setCryptoWallet] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?mode=signup&plan=${planParam}`);
    }
  }, [user, authLoading, navigate, planParam]);

  useEffect(() => {
    // Fetch crypto wallet from app settings
    const fetchWallet = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "crypto_wallet")
        .maybeSingle();
      
      if (data?.value) {
        setCryptoWallet(data.value);
      }
    };
    fetchWallet();
  }, []);

  const copyWallet = () => {
    navigator.clipboard.writeText(cryptoWallet);
    setCopied(true);
    toast.success("Wallet copiada al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "osint_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const handlePayment = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: plan.price,
          plan: plan.name,
          payment_method: paymentMethod,
          status: "pending",
          currency: paymentMethod === "crypto" ? "USDT" : "USD",
        });

      if (paymentError) throw paymentError;

      // For demo purposes, we'll create the API key immediately
      // In production, this should happen after payment confirmation
      const apiKeyValue = generateApiKey();
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error: keyError } = await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          key_value: apiKeyValue,
          plan: plan.name.toLowerCase(),
          status: "active",
          requests_limit: plan.requests,
          requests_used: 0,
          expires_at: expiresAt.toISOString(),
        });

      if (keyError) throw keyError;

      toast.success("¡Pago procesado! Tu API key ha sido activada.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Error al procesar el pago");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-display">CARGANDO...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <MatrixRain />
      
      <div className="w-full max-w-lg relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>

        <Card variant="cyber" className="animate-scale-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">
              CHECKOUT - {plan.name}
            </CardTitle>
            <CardDescription>
              <span className="text-4xl font-display font-bold text-primary">${plan.price}</span>
              <span className="text-muted-foreground">/mes</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-mono">Método de pago:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod("paypal")}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === "paypal"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm font-mono">PayPal</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("crypto")}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === "crypto"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Bitcoin className="h-6 w-6" />
                  <span className="text-sm font-mono">Crypto</span>
                </button>
              </div>
            </div>

            {/* Crypto Wallet Display */}
            {paymentMethod === "crypto" && (
              <div className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
                <p className="text-sm text-muted-foreground font-mono">
                  Envía <span className="text-primary font-bold">${plan.price} USDT</span> a:
                </p>
                {cryptoWallet ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background p-2 rounded border border-border break-all">
                      {cryptoWallet}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyWallet}
                      className="shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">
                    Wallet no configurada. Contacta al administrador.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Redes: TRC20, ERC20, BEP20
                </p>
              </div>
            )}

            {/* Plan Features */}
            <div className="p-4 border border-border rounded-lg bg-card/50">
              <p className="text-sm font-mono text-muted-foreground mb-2">Incluye:</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{plan.requests === 999999 ? "Ilimitadas" : plan.requests} búsquedas/día</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>API Key personal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>30 días de acceso</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              variant="cyber"
              className="w-full"
              onClick={handlePayment}
              disabled={isProcessing || (paymentMethod === "crypto" && !cryptoWallet)}
            >
              {isProcessing ? "PROCESANDO..." : "CONFIRMAR PAGO"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Al confirmar, aceptas nuestros términos de servicio.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
