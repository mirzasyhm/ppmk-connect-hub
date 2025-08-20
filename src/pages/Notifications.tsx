import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageCircle, Heart, Users, Calendar, Megaphone, ShoppingCart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  icon: any;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simulate notifications from different sources
      // In a real app, you'd fetch actual notifications from a notifications table
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "message",
          title: "New Message",
          message: "You have a new message from John Doe",
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          read: false,
          icon: MessageCircle
        },
        {
          id: "2",
          type: "like",
          title: "Post Liked",
          message: "Sarah liked your post",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: false,
          icon: Heart
        },
        {
          id: "3",
          type: "community",
          title: "New Community Post",
          message: "New post in Malaysian Students community",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          read: true,
          icon: Users
        },
        {
          id: "4",
          type: "event",
          title: "Event Reminder",
          message: "Korean Culture Festival starts tomorrow",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          read: true,
          icon: Calendar
        },
        {
          id: "5",
          type: "broadcast",
          title: "Important Announcement",
          message: "New safety guidelines have been posted",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
          read: true,
          icon: Megaphone
        },
        {
          id: "6",
          type: "marketplace",
          title: "Item Sold",
          message: "Your textbook has been purchased",
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          read: true,
          icon: ShoppingCart
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-500';
      case 'like': return 'bg-red-500';
      case 'community': return 'bg-green-500';
      case 'event': return 'bg-purple-500';
      case 'broadcast': return 'bg-orange-500';
      case 'marketplace': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {unreadCount} new
          </Badge>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-2 border-foreground shadow-brutal">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground text-center">
              You're all caught up! Check back later for new updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const IconComponent = notification.icon;
            return (
              <Card 
                key={notification.id} 
                className={`border-2 border-foreground shadow-brutal transition-all hover:shadow-brutal-hover cursor-pointer ${
                  !notification.read ? 'bg-muted/30' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}