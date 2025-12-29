import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Bitcoin, Copy, Check, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MatrixRain from "@/components/MatrixRain";

const plans: Record<string, { price: number; requests: number; name: string }> = {
  básico: { price: 29, requests: 100, name: "BÁSICO" },
  basico: { price: 29, requests: 100, name: "BÁSICO" },
  pro: { price: 99, requests: 1000, name: "PRO" },
  empresa: { price: 299, requests: 999999, name: "EMPRESA" },
};

declare global {
  interface Window {
    paypal?: any;
  }
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan") || "básico";
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  
  const plan = plans[planParam.toLowerCase()] || plans.básico;
  
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto">("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cryptoWallet, setCryptoWallet] = useState<string>("");
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?mode=signup&plan=${planParam}`);
    }
  }, [user, authLoading, navigate, planParam]);

  useEffect(() => {
    if (success === "true") {
      toast.success("¡Pago completado! Redirigiendo...");
      setTimeout(() => navigate("/dashboard"), 2000);
    }
    if (canceled === "true") {
      toast.error("Pago cancelado");
    }
  }, [success, canceled, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: walletData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "crypto_wallet")
        .maybeSingle();
      
      if (walletData?.value) {
        setCryptoWallet(walletData.value);
      }

      const { data: paypalData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "paypal_client_id")
        .maybeSingle();
      
      if (paypalData?.value) {
        setPaypalClientId(paypalData.value);
      }
    };
    fetchSettings();
  }, []);

  // Load PayPal SDK
  useEffect(() => {
    if (paymentMethod !== "paypal" || !paypalClientId || paypalLoaded) return;

    const existingScript = document.getElementById("paypal-sdk");
    if (existingScript) {
      setPaypalLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => toast.error("Error al cargar PayPal");
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid reloading
    };
  }, [paymentMethod, paypalClientId, paypalLoaded]);

  // Render PayPal buttons
  useEffect(() => {
    if (!paypalLoaded || !window.paypal || paymentMethod !== "paypal") return;

    const container = document.getElementById("paypal-button-container");
    if (!container) return;

    container.innerHTML = "";

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
      },
      createOrder: async () => {
        setIsProcessing(true);
        try {
          const { data, error } = await supabase.functions.invoke("paypal-create-order", {
            body: { plan: plan.name, price: plan.price },
          });

          if (error || !data.success) {
            throw new Error(data?.error || error?.message || "Error al crear orden");
          }

          return data.orderId;
        } catch (err: any) {
          toast.error(err.message);
          setIsProcessing(false);
          throw err;
        }
      },
      onApprove: async (data: { orderID: string }) => {
        try {
          const { data: captureData, error } = await supabase.functions.invoke("paypal-capture-order", {
            body: { orderId: data.orderID },
          });

          if (error || !captureData.success) {
            throw new Error(captureData?.error || error?.message || "Error al procesar pago");
          }

          toast.success("¡Pago completado! Tu API key ha sido generada.");
          navigate("/dashboard");
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
      onCancel: () => {
        toast.info("Pago cancelado");
        setIsProcessing(false);
      },
      onError: (err: any) => {
        console.error("PayPal error:", err);
        toast.error("Error en PayPal");
        setIsProcessing(false);
      },
    }).render("#paypal-button-container");
  }, [paypalLoaded, paymentMethod, plan, navigate]);

  const copyWallet = () => {
    navigator.clipboard.writeText(cryptoWallet);
    setCopied(true);
    toast.success("Wallet copiada al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCryptoPayment = async () => {
    toast.info("Envía el pago a la wallet indicada. Tu API key será activada manualmente por un administrador una vez confirmado el pago.");
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

            {/* PayPal Button Container */}
            {paymentMethod === "paypal" && (
              <div className="space-y-3">
                {!paypalClientId ? (
                  <div className="p-4 border border-destructive rounded-lg text-center">
                    <p className="text-sm text-destructive">
                      PayPal no está configurado. Contacta al administrador.
                    </p>
                  </div>
                ) : !paypalLoaded ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm">Cargando PayPal...</span>
                  </div>
                ) : (
                  <div id="paypal-button-container" className="min-h-[150px]" />
                )}
              </div>
            )}

            {/* Crypto Wallet Display */}
            {paymentMethod === "crypto" && (
              <div className="space-y-3 p-4 border border-border rounded-lg bg-card/50">
                <p className="text-sm text-muted-foreground font-mono">
                  Envía <span className="text-primary font-bold">${plan.price} USDT</span> a:
                </p>
                {cryptoWallet ? (
                  <>
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
                    <p className="text-xs text-muted-foreground">
                      Redes aceptadas: TRC20, ERC20, BEP20
                    </p>
                    <Button
                      variant="cyber"
                      className="w-full"
                      onClick={handleCryptoPayment}
                    >
                      YA ENVIÉ EL PAGO
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-destructive">
                    Wallet no configurada. Contacta al administrador.
                  </p>
                )}
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

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Procesando pago...</span>
              </div>
            )}

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
