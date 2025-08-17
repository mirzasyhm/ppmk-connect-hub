import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { BroadcastCard } from "@/components/FeedItems/BroadcastCard";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";

const Broadcast = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setBroadcasts([]);
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
      fetchBroadcasts();
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBroadcasts(data || []);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4 uppercase tracking-wider">
            Access Denied
          </h1>
          <p className="text-xl text-muted-foreground">
            Please sign in to view broadcasts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} session={session} profile={profile} />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-2 border-foreground bg-card p-6 shadow-brutal">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Megaphone className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground uppercase tracking-wider">
                    PPMK Broadcasts
                  </h1>
                  <p className="text-lg text-muted-foreground uppercase font-bold">
                    Official announcements from the High Council
                  </p>
                </div>
              </div>
              
              {/* Only show create button for admins - you can add role check here */}
              <Button variant="brutal" size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                New Broadcast
              </Button>
            </div>
          </div>

          {/* Priority Broadcasts */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground uppercase border-b-2 border-foreground pb-2">
              Urgent & High Priority
            </h2>
            {broadcasts
              .filter(broadcast => broadcast.priority === 'urgent' || broadcast.priority === 'high')
              .map((broadcast) => (
                <BroadcastCard key={broadcast.id} broadcast={broadcast} />
              ))}
            
            {broadcasts.filter(b => b.priority === 'urgent' || b.priority === 'high').length === 0 && (
              <div className="text-center py-8 border-2 border-foreground bg-muted">
                <p className="text-muted-foreground font-bold uppercase">
                  No urgent or high priority broadcasts at this time
                </p>
              </div>
            )}
          </div>

          {/* All Broadcasts */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground uppercase border-b-2 border-foreground pb-2">
              All Broadcasts
            </h2>
            {broadcasts.length === 0 ? (
              <div className="text-center py-12 border-2 border-foreground bg-muted">
                <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-bold uppercase">
                  No broadcasts available
                </p>
                <p className="text-muted-foreground mt-2">
                  Check back later for announcements from the PPMK High Council
                </p>
              </div>
            ) : (
              broadcasts.map((broadcast) => (
                <BroadcastCard key={broadcast.id} broadcast={broadcast} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Broadcast;