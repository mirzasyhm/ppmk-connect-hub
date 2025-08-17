import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/FeedItems/EventCard";
import { Plus, Search, Calendar, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  end_date?: string;
  location: string;
  category: string;
  max_participants?: number;
  current_participants: number;
  status: string;
  created_at: string;
  image_url?: string;
  organizer_id: string;
}

export const Events = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    fetchEvents();

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(events.map(event => event.category))];
  const statuses = [...new Set(events.map(event => event.status))];

  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.event_date) > new Date() && event.status === 'upcoming'
  );
  
  const pastEvents = filteredEvents.filter(event => 
    new Date(event.event_date) <= new Date() || event.status === 'completed'
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} session={session} profile={profile} />
      
      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground uppercase">Events</h1>
              <p className="text-muted-foreground mt-2">Join study groups, sports, and social events</p>
            </div>
            <Button className="font-bold uppercase">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-foreground"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 border-2 border-foreground">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-2 border-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-foreground shadow-brutal">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{upcomingEvents.length}</p>
                    <p className="text-sm text-muted-foreground uppercase font-bold">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground shadow-brutal">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {events.reduce((sum, event) => sum + event.current_participants, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground uppercase font-bold">Total Participants</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground shadow-brutal">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{categories.length}</p>
                    <p className="text-sm text-muted-foreground uppercase font-bold">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-foreground shadow-brutal">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pastEvents.length}</p>
                    <p className="text-sm text-muted-foreground uppercase font-bold">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-foreground">
                {upcomingEvents.length} Upcoming
              </Badge>
              <Badge variant="outline" className="border-foreground">
                {pastEvents.length} Past
              </Badge>
            </div>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground uppercase">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground uppercase">Past Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* No Events Found */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-muted border-2 border-foreground animate-pulse"></div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="border-2 border-foreground shadow-brutal">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">No events found matching your criteria</p>
                <Button className="mt-4 font-bold uppercase">
                  <Plus className="w-4 h-4 mr-2" />
                  Create the first event
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
};