import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, X } from "lucide-react";

interface PrivacySettings {
  showAge: boolean;
  showUniversity: boolean;
  showStudyYear: boolean;
  showLocation: boolean;
  showActivities: boolean;
  showGallery: boolean;
}

interface ProfilePrivacySettingsProps {
  settings: PrivacySettings;
  onSettingsChange: (settings: PrivacySettings) => void;
  onClose: () => void;
}

export default function ProfilePrivacySettings({ 
  settings, 
  onSettingsChange, 
  onClose 
}: ProfilePrivacySettingsProps) {
  
  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control who can see your profile information
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Basic Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-age" className="flex flex-col space-y-1">
                <span>Show Age</span>
                <span className="text-sm text-muted-foreground">Display your age based on birth date</span>
              </Label>
              <Switch
                id="show-age"
                checked={settings.showAge}
                onCheckedChange={(checked) => updateSetting('showAge', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-university" className="flex flex-col space-y-1">
                <span>Show University</span>
                <span className="text-sm text-muted-foreground">Display your current university</span>
              </Label>
              <Switch
                id="show-university"
                checked={settings.showUniversity}
                onCheckedChange={(checked) => updateSetting('showUniversity', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-study-year" className="flex flex-col space-y-1">
                <span>Show Study Year</span>
                <span className="text-sm text-muted-foreground">Display your current study year</span>
              </Label>
              <Switch
                id="show-study-year"
                checked={settings.showStudyYear}
                onCheckedChange={(checked) => updateSetting('showStudyYear', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-location" className="flex flex-col space-y-1">
                <span>Show Location</span>
                <span className="text-sm text-muted-foreground">Display your current location</span>
              </Label>
              <Switch
                id="show-location"
                checked={settings.showLocation}
                onCheckedChange={(checked) => updateSetting('showLocation', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-medium">Activities & Content</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-activities" className="flex flex-col space-y-1">
                <span>Show Activities</span>
                <span className="text-sm text-muted-foreground">Display events, communities, and posts</span>
              </Label>
              <Switch
                id="show-activities"
                checked={settings.showActivities}
                onCheckedChange={(checked) => updateSetting('showActivities', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-gallery" className="flex flex-col space-y-1">
                <span>Show Photo Gallery</span>
                <span className="text-sm text-muted-foreground">Display photos from activities</span>
              </Label>
              <Switch
                id="show-gallery"
                checked={settings.showGallery}
                onCheckedChange={(checked) => updateSetting('showGallery', checked)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            These settings only affect your public profile view. Detailed personal information is always private.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}