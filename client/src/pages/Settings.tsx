import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ClinicSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/dateUtils";
import { updateClinicSettings, syncToGoogleDrive } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { ChevronRight, LogOut, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Fetch clinic settings
  const { data: settings, isLoading } = useQuery<ClinicSettings>({
    queryKey: ['/api/settings']
  });
  
  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: updateClinicSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  });
  
  const handleSyncNow = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncToGoogleDrive();
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Sync Successful",
        description: result.message,
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
  
  const handleToggleChange = (key: 'autoSync' | 'appointmentReminders' | 'followUpAlerts' | 'syncNotifications', value: boolean) => {
    if (!settings) return;
    
    if (key === 'autoSync') {
      updateSettings.mutate({ ...settings, autoSync: value });
    } else {
      const notificationSettings = {
        ...settings.notificationSettings,
        [key]: value
      };
      updateSettings.mutate({ ...settings, notificationSettings });
    }
  };
  
  const handleInputChange = (key: 'clinicName' | 'address' | 'phone' | 'googleAccount', value: string) => {
    if (!settings) return;
    
    updateSettings.mutate({ ...settings, [key]: value });
  };
  
  const handleChangeGoogleAccount = () => {
    toast({
      title: "Google Account",
      description: "Changing Google Account is not available in this demo",
    });
  };
  
  const handleAbout = () => {
    toast({
      title: "About MediTrack",
      description: "MediTrack is a patient management system for healthcare providers",
    });
  };
  
  const handleHelp = () => {
    toast({
      title: "Help & Support",
      description: "Contact support@meditrack.com for assistance",
    });
  };
  
  const handlePrivacy = () => {
    toast({
      title: "Privacy Policy",
      description: "MediTrack respects your privacy and protects your data",
    });
  };
  
  const handleLogout = () => {
    toast({
      title: "Logout",
      description: "You have been logged out",
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-8">Settings not found</div>;
  }

  return (
    <section className="py-4">
      <h2 className="text-lg font-medium text-neutral-800 mb-4">Settings</h2>
      
      {/* Clinic Information */}
      <div className="bg-white rounded-lg p-4 shadow mb-4">
        <h3 className="font-medium mb-3">Clinic Information</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-neutral-700 block mb-1">Clinic Name</Label>
            <Input 
              value={settings.clinicName}
              onChange={(e) => handleInputChange("clinicName", e.target.value)}
              className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <Label className="text-sm text-neutral-700 block mb-1">Address</Label>
            <Input 
              value={settings.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <Label className="text-sm text-neutral-700 block mb-1">Phone</Label>
            <Input 
              value={settings.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="w-full border border-neutral-200 rounded-lg p-2 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Google Drive Sync */}
      <div className="bg-white rounded-lg p-4 shadow mb-4">
        <h3 className="font-medium mb-3">Google Drive Sync</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto Sync</div>
              <div className="text-sm text-neutral-700">Automatically sync data daily</div>
            </div>
            <Switch 
              checked={settings.autoSync}
              onCheckedChange={(checked) => handleToggleChange("autoSync", checked)}
            />
          </div>
          <div>
            <Label className="text-sm text-neutral-700 block mb-1">Google Account</Label>
            <div className="flex items-center">
              <Input 
                value={settings.googleAccount || ""}
                className="flex-1 border border-neutral-200 rounded-lg p-2 text-sm"
                disabled
              />
              <Button
                onClick={handleChangeGoogleAccount}
                className="ml-2"
                size="sm"
              >
                Change
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm text-neutral-700 block mb-1">Last Sync</Label>
            <div className="text-sm">
              {settings.lastSync ? formatDate(settings.lastSync) : "Never"}
            </div>
          </div>
          <Button 
            onClick={handleSyncNow} 
            className="w-full flex items-center justify-center gap-2"
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>
      </div>
      
      {/* Notifications */}
      <div className="bg-white rounded-lg p-4 shadow mb-4">
        <h3 className="font-medium mb-3">Notifications</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Appointment Reminders</div>
              <div className="text-sm text-neutral-700">Notify 24 hours before appointment</div>
            </div>
            <Switch 
              checked={settings.notificationSettings.appointmentReminders}
              onCheckedChange={(checked) => handleToggleChange("appointmentReminders", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Follow-up Alerts</div>
              <div className="text-sm text-neutral-700">Notify when patient needs follow-up</div>
            </div>
            <Switch 
              checked={settings.notificationSettings.followUpAlerts}
              onCheckedChange={(checked) => handleToggleChange("followUpAlerts", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Sync Notifications</div>
              <div className="text-sm text-neutral-700">Notify when data is synced</div>
            </div>
            <Switch 
              checked={settings.notificationSettings.syncNotifications}
              onCheckedChange={(checked) => handleToggleChange("syncNotifications", checked)}
            />
          </div>
        </div>
      </div>
      
      {/* About & Help */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="font-medium mb-3">About & Help</h3>
        <div className="space-y-2">
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-neutral-50"
            onClick={handleAbout}
          >
            <div className="font-medium">About MediTrack</div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
          <Separator />
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-neutral-50"
            onClick={handleHelp}
          >
            <div className="font-medium">Help & Support</div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
          <Separator />
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-neutral-50"
            onClick={handlePrivacy}
          >
            <div className="font-medium">Privacy Policy</div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </div>
          <Separator />
          <div 
            className="flex items-center justify-between py-2 cursor-pointer hover:bg-neutral-50 text-red-500"
            onClick={handleLogout}
          >
            <div className="font-medium">Log Out</div>
            <LogOut className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
