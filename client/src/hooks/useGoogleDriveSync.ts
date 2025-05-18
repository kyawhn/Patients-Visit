import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SyncResult {
  message: string;
  syncTime: string;
  syncDetails: {
    success: boolean;
    fileId?: string;
    error?: string;
  };
}

export default function useGoogleDriveSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const syncData = async (): Promise<SyncResult> => {
    setIsSyncing(true);
    
    try {
      const response = await apiRequest("POST", "/api/sync");
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error syncing data:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncData
  };
}
