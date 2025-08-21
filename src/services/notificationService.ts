import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type Notification = Tables<"notifications">;
export type NotificationType = "message" | "like" | "community" | "event" | "broadcast" | "marketplace" | "comment" | "follow" | "event_reminder";

export interface NotificationWithProfile extends Notification {
  sender_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export class NotificationService {
  static async fetchUserNotifications(userId: string): Promise<NotificationWithProfile[]> {
    try {
      // First try to fetch without the relationship to see if table exists
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }

      // If successful, try to get sender profiles
      if (data && data.length > 0) {
        const notificationsWithProfiles = await Promise.all(
          data.map(async (notification) => {
            if (notification.sender_id) {
              try {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("display_name, avatar_url")
                  .eq("user_id", notification.sender_id)
                  .single();
                
                return {
                  ...notification,
                  sender_profile: profile
                };
              } catch (profileError) {
                return {
                  ...notification,
                  sender_profile: null
                };
              }
            }
            return {
              ...notification,
              sender_profile: null
            };
          })
        );
        return notificationsWithProfiles;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  static async deleteAllNotifications(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting all notifications:", error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }

    return count || 0;
  }

  static async createNotification(notification: {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    action_url?: string;
    related_id?: string;
    related_type?: string;
    sender_id?: string;
  }): Promise<Notification | null> {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

    return data;
  }

  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const channel = supabase.channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  static getNotificationIcon(type: NotificationType) {
    switch (type) {
      case 'message': return 'MessageCircle';
      case 'like': return 'Heart';
      case 'community': return 'Users';
      case 'event': return 'Calendar';
      case 'broadcast': return 'Megaphone';
      case 'marketplace': return 'ShoppingCart';
      case 'comment': return 'MessageSquare';
      case 'follow': return 'UserPlus';
      case 'event_reminder': return 'Clock';
      default: return 'Bell';
    }
  }

  static getNotificationColor(type: NotificationType) {
    switch (type) {
      case 'message': return 'bg-blue-500';
      case 'like': return 'bg-red-500';
      case 'community': return 'bg-green-500';
      case 'event': return 'bg-purple-500';
      case 'broadcast': return 'bg-orange-500';
      case 'marketplace': return 'bg-yellow-500';
      case 'comment': return 'bg-blue-400';
      case 'follow': return 'bg-indigo-500';
      case 'event_reminder': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  }

  static generateActionUrl(relatedType: string | null, relatedId: string | null): string {
    if (!relatedType || !relatedId) return '/feed';

    switch (relatedType) {
      case 'post':
        return '/feed';
      case 'community_post':
        return `/communities`;
      case 'event':
        return `/events`;
      case 'broadcast':
        return `/broadcast`;
      case 'marketplace':
        return `/marketplace`;
      case 'message':
        return `/messages`;
      default:
        return '/feed';
    }
  }
}