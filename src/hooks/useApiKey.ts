import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ApiKeyData {
  id: string;
  key_value: string;
  plan: string;
  status: "active" | "inactive" | "expired" | "pending";
  requests_used: number;
  requests_limit: number;
  expires_at: string | null;
  created_at: string;
}

export function useApiKey() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<ApiKeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveKey, setHasActiveKey] = useState(false);

  const fetchApiKey = async () => {
    if (!user) {
      setApiKey(null);
      setHasActiveKey(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error) {
      console.error("Error fetching API key:", error);
    }

    const typedData = data as ApiKeyData | null;
    setApiKey(typedData);
    
    // Check if key is active and not expired
    const isActive = typedData?.status === "active" && 
      (!typedData.expires_at || new Date(typedData.expires_at) > new Date());
    setHasActiveKey(isActive);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchApiKey();
  }, [user]);

  return {
    apiKey,
    hasActiveKey,
    isLoading,
    refetch: fetchApiKey,
  };
}
