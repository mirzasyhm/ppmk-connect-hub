import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { BroadcastCard } from "@/components/FeedItems/BroadcastCard";
import { MarketplaceCard } from "@/components/FeedItems/MarketplaceCard";
import { EventCard } from "@/components/FeedItems/EventCard";
import { CommunityCard } from "@/components/FeedItems/CommunityCard";
import { CommunityPostCard } from "@/components/FeedItems/CommunityPostCard";

interface FeedProps {
  user: User;
  session: Session;
  profile: any;
}

export const Feed = ({ user, session, profile }: FeedProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchFeed();
    }
  }, [user, profile]);

  const fetchFeed = async () => {
    try {
      // Fetch all content types in parallel
      const [postsResult, broadcastsResult, marketplaceResult, eventsResult, communitiesResult, communityPostsResult] = await Promise.all([
        // Regular posts
        supabase
          .from("posts")
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              avatar_url
            ),
            likes (
              user_id
            )
          `)
          .order("created_at", { ascending: false }),
        
        // Broadcasts
        supabase
          .from("broadcasts")
          .select("*")
          .order("created_at", { ascending: false }),
        
        // Marketplace items
        supabase
          .from("marketplace")
          .select("*")
          .order("created_at", { ascending: false }),
        
        // Events
        supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false }),
        
        // Communities
        supabase
          .from("communities")
          .select("*")
          .order("created_at", { ascending: false }),
        
        // Community posts
        supabase
          .from("community_posts")
          .select(`
            *,
            communities (
              name,
              type
            )
          `)
          .order("created_at", { ascending: false })
      ]);

      // Combine and sort all items by creation date
      const allItems = [
        ...(postsResult.data || []).map(item => ({ ...item, type: 'post' })),
        ...(broadcastsResult.data || []).map(item => ({ ...item, type: 'broadcast' })),
        ...(marketplaceResult.data || []).map(item => ({ ...item, type: 'marketplace' })),
        ...(eventsResult.data || []).map(item => ({ ...item, type: 'event' })),
        ...(communitiesResult.data || []).map(item => ({ ...item, type: 'community' })),
        ...(communityPostsResult.data || []).map(item => ({ ...item, type: 'community_post' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedItems(allItems);
      setPosts(postsResult.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching feed:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <CreatePost 
          profile={profile} 
          currentUserId={user.id} 
          onPostCreated={fetchFeed}
        />
        
        <div className="space-y-4">
          {feedItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No content yet. Be the first to share something!
              </p>
            </div>
          ) : (
            feedItems.map((item) => {
              switch (item.type) {
                case 'post':
                  return (
                    <PostCard
                      key={item.id}
                      post={item}
                      currentUserId={user.id}
                      onLikeUpdate={fetchFeed}
                    />
                  );
                case 'broadcast':
                  return <BroadcastCard key={item.id} broadcast={item} />;
                case 'marketplace':
                  return <MarketplaceCard key={item.id} item={item} />;
                case 'event':
                  return <EventCard key={item.id} event={item} />;
                case 'community':
                  return <CommunityCard key={item.id} community={item} />;
                case 'community_post':
                  return <CommunityPostCard key={item.id} post={item} />;
                default:
                  return null;
              }
            })
          )}
        </div>
      </div>
    </div>
  );
};