import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { toast } from "sonner";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    location: string;
    event_date: string;
    category: string;
    max_participants?: number;
    current_participants: number;
    status: string;
    created_at: string;
    image_url?: string;
    organizer_id: string;
  };
  onEventUpdate?: () => void;
}

export const EventCard = ({ event, onEventUpdate }: EventCardProps) => {
  const [user, setUser] = useState<any>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        checkParticipation(user.id);
      }
    };

    getCurrentUser();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkParticipation(session.user.id);
        } else {
          setIsParticipant(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [event.id]);

  const checkParticipation = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("event_participants")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", userId)
        .eq("status", "registered")
        .single();

      setIsParticipant(!!data);
    } catch (error) {
      setIsParticipant(false);
    }
  };

  const joinEvent = async () => {
    if (!user) {
      toast.error("Please log in to join events");
      return;
    }

    if (event.max_participants && event.current_participants >= event.max_participants) {
      toast.error("Event is full");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("event_participants")
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: "registered"
        });

      if (error) throw error;

      setIsParticipant(true);
      toast.success("Successfully joined the event!");
      onEventUpdate?.();
    } catch (error: any) {
      console.error("Error joining event:", error);
      if (error.code === "23505") {
        toast.error("You're already registered for this event");
      } else {
        toast.error("Failed to join event");
      }
    } finally {
      setLoading(false);
    }
  };

  const leaveEvent = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setIsParticipant(false);
      toast.success("Left the event successfully");
      onEventUpdate?.();
    } catch (error) {
      console.error("Error leaving event:", error);
      toast.error("Failed to leave event");
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-primary text-primary-foreground';
      case 'ongoing': return 'bg-secondary text-secondary-foreground';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const eventDateTime = formatEventDate(event.event_date);

  return (
    <Card className="border-2 border-foreground shadow-brutal">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-muted-foreground uppercase">EVENT</span>
          </div>
          <Badge className={`${getStatusColor(event.status)} border border-foreground font-bold uppercase`}>
            {event.status}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-foreground uppercase">{event.title}</h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {event.image_url && (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-48 object-cover border-2 border-foreground"
          />
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">{eventDateTime.date}</p>
              <p className="text-sm text-muted-foreground">{eventDateTime.time}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">{event.location}</p>
          </div>
        </div>
        
        <Badge className="bg-muted text-muted-foreground border border-foreground font-bold uppercase">
          {event.category}
        </Badge>
        
        <p className="text-foreground leading-relaxed">{event.description}</p>
        
        {event.max_participants && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {event.current_participants}/{event.max_participants} participants
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Posted {new Date(event.created_at).toLocaleDateString()}
          </div>
          
          {event.status === 'upcoming' && user && (
            isParticipant ? (
              <Button 
                variant="outline" 
                onClick={leaveEvent}
                disabled={loading}
                className="font-bold uppercase border-2 border-foreground"
              >
                {loading ? "Leaving..." : "Leave Event"}
              </Button>
            ) : (
              <Button 
                onClick={joinEvent}
                disabled={loading || (event.max_participants && event.current_participants >= event.max_participants)}
                className="font-bold uppercase"
              >
                {loading ? "Joining..." : 
                 (event.max_participants && event.current_participants >= event.max_participants) ? "Event Full" : "Join Event"}
              </Button>
            )
          )}
          
          {event.status === 'upcoming' && !user && (
            <Button 
              onClick={() => toast.error("Please log in to join events")}
              className="font-bold uppercase"
            >
              Join Event
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};