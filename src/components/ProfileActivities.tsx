import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, ShoppingBag, MessageSquare, Image } from "lucide-react";

interface ProfileActivitiesProps {
  userId: string;
  showGallery: boolean;
}

export default function ProfileActivities({ userId, showGallery }: ProfileActivitiesProps) {
  const [activities, setActivities] = useState({
    events: [],
    communities: [],
    marketplace: [],
    posts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Fetch events participated
      const { data: events } = await supabase
        .from("event_participants")
        .select(`
          events (
            id,
            title,
            event_date,
            location,
            image_url
          )
        `)
        .eq("user_id", userId)
        .eq("status", "registered")
        .limit(6);

      // Fetch communities joined
      const { data: communities } = await supabase
        .from("community_memberships")
        .select(`
          communities (
            id,
            name,
            type,
            image_url,
            member_count
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(6);

      // Fetch marketplace items
      const { data: marketplace } = await supabase
        .from("marketplace")
        .select("id, title, price, currency, image_url, status, created_at")
        .eq("seller_id", userId)
        .limit(6);

      // Fetch personal posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, image_url, created_at")
        .eq("user_id", userId)
        .limit(6);

      setActivities({
        events: events?.map(e => e.events).filter(Boolean) || [],
        communities: communities?.map(c => c.communities).filter(Boolean) || [],
        marketplace: marketplace || [],
        posts: posts || [],
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading activities...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Activities & Gallery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Selling
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Posts
            </TabsTrigger>
            {showGallery && (
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Gallery
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="events" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.events.length > 0 ? (
                activities.events.map((event: any) => (
                  <Card key={event.id} className="overflow-hidden">
                    {event.image_url && (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${event.image_url})` }} />
                    )}
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{event.location}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground">
                  No events participated yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="communities" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.communities.length > 0 ? (
                activities.communities.map((community: any) => (
                  <Card key={community.id} className="overflow-hidden">
                    {community.image_url && (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${community.image_url})` }} />
                    )}
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm">{community.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {community.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {community.member_count} members
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground">
                  No communities joined yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.marketplace.length > 0 ? (
                activities.marketplace.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.image_url && (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                    )}
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-sm">
                          {item.currency} {item.price}
                        </span>
                        <Badge variant={item.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground">
                  No items for sale
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="posts" className="mt-4">
            <div className="space-y-4">
              {activities.posts.length > 0 ? (
                activities.posts.map((post: any) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <p className="text-sm">{post.content}</p>
                      {post.image_url && (
                        <div className="mt-3 h-48 bg-cover bg-center rounded-md" style={{ backgroundImage: `url(${post.image_url})` }} />
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground">
                  No posts yet
                </div>
              )}
            </div>
          </TabsContent>

          {showGallery && (
            <TabsContent value="gallery" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Collect all images from activities */}
                {[
                  ...activities.events.filter((e: any) => e.image_url).map((e: any) => e.image_url),
                  ...activities.communities.filter((c: any) => c.image_url).map((c: any) => c.image_url),
                  ...activities.marketplace.filter((m: any) => m.image_url).map((m: any) => m.image_url),
                  ...activities.posts.filter((p: any) => p.image_url).map((p: any) => p.image_url),
                ].slice(0, 12).map((imageUrl, index) => (
                  <div 
                    key={index}
                    className="aspect-square bg-cover bg-center rounded-md border"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                  />
                ))}
                {[
                  ...activities.events.filter((e: any) => e.image_url),
                  ...activities.communities.filter((c: any) => c.image_url),
                  ...activities.marketplace.filter((m: any) => m.image_url),
                  ...activities.posts.filter((p: any) => p.image_url),
                ].length === 0 && (
                  <div className="col-span-full text-center text-muted-foreground">
                    No photos yet
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}