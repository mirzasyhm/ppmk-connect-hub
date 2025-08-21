import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "@/services/notificationService";

export const createTestNotifications = async (userId: string) => {
  const testNotifications = [
    {
      user_id: userId,
      type: "message" as const,
      title: "New Message",
      message: "You have a new message from John Doe",
      action_url: "/messages",
      related_type: "message",
      sender_id: userId
    },
    {
      user_id: userId,
      type: "like" as const,
      title: "Post Liked",
      message: "Sarah liked your post",
      action_url: "/feed",
      related_type: "post",
      sender_id: userId
    },
    {
      user_id: userId,
      type: "community" as const,
      title: "New Community Post",
      message: "New post in Malaysian Students community",
      action_url: "/communities",
      related_type: "community_post",
      sender_id: userId
    },
    {
      user_id: userId,
      type: "event" as const,
      title: "Event Reminder",
      message: "Korean Culture Festival starts tomorrow",
      action_url: "/events",
      related_type: "event",
      sender_id: userId
    },
    {
      user_id: userId,
      type: "broadcast" as const,
      title: "Important Announcement",
      message: "New safety guidelines have been posted",
      action_url: "/broadcast",
      related_type: "broadcast",
      sender_id: userId
    },
    {
      user_id: userId,
      type: "marketplace" as const,
      title: "Item Sold",
      message: "Your textbook has been purchased",
      action_url: "/marketplace",
      related_type: "marketplace",
      sender_id: userId
    }
  ];

  try {
    for (const notification of testNotifications) {
      await NotificationService.createNotification(notification);
    }
    console.log('Test notifications created successfully');
  } catch (error) {
    console.error('Error creating test notifications:', error);
  }
};

// Function to clear all notifications for testing
export const clearTestNotifications = async (userId: string) => {
  try {
    await NotificationService.deleteAllNotifications(userId);
    console.log('All test notifications cleared');
  } catch (error) {
    console.error('Error clearing test notifications:', error);
  }
};