import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Sidebar } from "@/components/Sidebar";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { BroadcastCard } from "@/components/FeedItems/BroadcastCard";
import { MarketplaceCard } from "@/components/FeedItems/MarketplaceCard";
import { EventCard } from "@/components/FeedItems/EventCard";
import { CommunityCard } from "@/components/FeedItems/CommunityCard";
import { CommunityPostCard } from "@/components/FeedItems/CommunityPostCard";
import heroImage from "@/assets/hero-brutalist.jpg";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid blocking auth state change
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPosts([]);
          setFeedItems([]);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
        return;
      }
      
      setProfile(data);
      fetchFeed();
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

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
    } catch (error) {
      console.error("Error fetching feed:", error);
    }
  };

  const handleAuthSuccess = () => {
    // Auth state change will handle the rest
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="PPMKFriends Hero" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-md px-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4 uppercase tracking-wider">
              PPMKFriends
            </h1>
            <p className="text-xl text-foreground font-bold uppercase">
              Connect with friends and share your moments
            </p>
          </div>
          <AuthCard onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} session={session} profile={profile} />
      
      <main className="flex-1 p-6 max-w-2xl mx-auto">
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
      </main>
    </div>
  );
};

export default Index;
