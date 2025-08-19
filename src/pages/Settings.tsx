import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Bell, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  user: User | null;
}

interface NotificationSettings {
  broadcast_urgent: boolean;
  broadcast_normal: boolean;
  communities_general: boolean;
  marketplace_items: boolean;
  marketplace_currency: boolean;
  events_new: boolean;
  events_reminders: boolean;
  events_reminder_timings: string[];
  messages_general: boolean;
}

export const Settings = ({ user }: SettingsProps) => {
  const { toast } = useToast();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    broadcast_urgent: true,
    broadcast_normal: true,
    communities_general: true,
    marketplace_items: true,
    marketplace_currency: true,
    events_new: true,
    events_reminders: true,
    events_reminder_timings: ["1_week"],
    messages_general: true,
  });
  const [feedback, setFeedback] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data && !error) {
        setNotificationSettings(data);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateNotificationSetting = async (key: keyof NotificationSettings, value: boolean | string | string[]) => {
    try {
      const updatedSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(updatedSettings);

      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user?.id,
          ...updatedSettings,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
    };

  const handleReminderTimingChange = (timing: string, checked: boolean) => {
    const currentTimings = notificationSettings.events_reminder_timings;
    let newTimings: string[];
    
    if (checked) {
      // Add timing if not already present
      newTimings = currentTimings.includes(timing) 
        ? currentTimings 
        : [...currentTimings, timing];
    } else {
      // Remove timing
      newTimings = currentTimings.filter(t => t !== timing);
    }
    
    updateNotificationSetting('events_reminder_timings', newTimings);
  };

  const submitFeedback = async () => {
    if (!feedback.trim() && !suggestion.trim()) {
      toast({
        title: "Error",
        description: "Please provide either feedback or a suggestion.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id,
          feedback: feedback.trim() || null,
          suggestion: suggestion.trim() || null,
        });

      if (error) {
        throw error;
      }

      setFeedback("");
      setSuggestion("");
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your notification preferences and share feedback.</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Broadcast Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Broadcast Announcements</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="broadcast-urgent">Urgent announcements</Label>
                <Switch
                  id="broadcast-urgent"
                  checked={notificationSettings.broadcast_urgent}
                  onCheckedChange={(checked) => updateNotificationSetting('broadcast_urgent', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="broadcast-normal">Normal announcements</Label>
                <Switch
                  id="broadcast-normal"
                  checked={notificationSettings.broadcast_normal}
                  onCheckedChange={(checked) => updateNotificationSetting('broadcast_normal', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Communities Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Communities</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="communities-general">General community notifications</Label>
                  <p className="text-sm text-muted-foreground">Per-community settings can be managed in each community page</p>
                </div>
                <Switch
                  id="communities-general"
                  checked={notificationSettings.communities_general}
                  onCheckedChange={(checked) => updateNotificationSetting('communities_general', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Marketplace Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Marketplace</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="marketplace-items">New items posted</Label>
                <Switch
                  id="marketplace-items"
                  checked={notificationSettings.marketplace_items}
                  onCheckedChange={(checked) => updateNotificationSetting('marketplace_items', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketplace-currency">Currency exchange announcements</Label>
                <Switch
                  id="marketplace-currency"
                  checked={notificationSettings.marketplace_currency}
                  onCheckedChange={(checked) => updateNotificationSetting('marketplace_currency', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Events Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Events</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="events-new">New events added</Label>
                <Switch
                  id="events-new"
                  checked={notificationSettings.events_new}
                  onCheckedChange={(checked) => updateNotificationSetting('events_new', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="events-reminders">Event reminders</Label>
                <Switch 
                  id="messages-general" checked={notificationSettings.messages_general}
                  onCheckedChange={checked => updateNotificationSetting('messages_general', checked)}
                  className="bg-gray-400 hover:bg-gray-500"
                />
              </div>
              {notificationSettings.events_reminders && (
                <div className="pl-4 space-y-3">
                  <Label>Reminder timing for joined events (select multiple)</Label>
                  <div className="space-y-2">
                    {[
                      { value: "4_weeks", label: "4 weeks before" },
                      { value: "3_weeks", label: "3 weeks before" },
                      { value: "2_weeks", label: "2 weeks before" },
                      { value: "1_week", label: "1 week before" },
                      { value: "3_days", label: "3 days before" },
                      { value: "1_day", label: "1 day before" },
                      { value: "same_day", label: "Same day" }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`timing-${option.value}`}
                          checked={notificationSettings.events_reminder_timings.includes(option.value)}
                          onCheckedChange={(checked) => 
                            handleReminderTimingChange(option.value, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`timing-${option.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Messages Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Messages</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="messages-general">Message notifications</Label>
                <Switch
                  id="messages-general"
                  checked={notificationSettings.messages_general}
                  onCheckedChange={(checked) => updateNotificationSetting('messages_general', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Feedback & Suggestions
          </CardTitle>
          <CardDescription>
            Help us improve the platform by sharing your thoughts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience, report issues, or let us know what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="suggestion">Suggestions</Label>
            <Textarea
              id="suggestion"
              placeholder="Have ideas for new features or improvements? Let us know!"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <Button 
            onClick={submitFeedback} 
            disabled={submittingFeedback || (!feedback.trim() && !suggestion.trim())}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {submittingFeedback ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};