import { useToast } from "@/hooks/use-toast";
import useGoogleDriveSync from "@/hooks/useGoogleDriveSync";
import { apiRequest } from "@/lib/queryClient";
import { Cloud, RefreshCw, BellRing } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export default function PageHeader() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const { syncData } = useGoogleDriveSync();

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      await syncData();
      toast({
        title: "Sync Successful",
        description: "Your data has been synced to Google Drive",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync with Google Drive",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "You have no new notifications",
    });
  };

  return (
    <header className="bg-primary text-white p-4 fixed top-0 left-0 right-0 z-10 shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-medium">MediTrack</h1>
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSync}
            className="text-white hover:bg-primary/80"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Cloud className="h-5 w-5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleNotifications}
            className="text-white hover:bg-primary/80"
          >
            <BellRing className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
