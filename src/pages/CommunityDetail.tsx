import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  MessageSquare, 
  Calendar, 
  Info, 
  Send, 
  Crown,
  Shield,
  User as UserIcon,
  Lock,
  Unlock,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    end_date: "",
    max_participants: ""
  });
  const [editingCommunity, setEditingCommunity] = useState<any>(null);
  const [isEditCommunityOpen, setIsEditCommunityOpen] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    if (id && user) {
      fetchCommunityData();
    }
  }, [id, user]);

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
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchCommunityData = async () => {
    if (!id || !user) return;

    try {
      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Fetch user membership
      const { data: membershipData, error: membershipError } = await supabase
        .from("community_memberships")
        .select("*")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error("Error fetching membership:", membershipError);
      } else {
        setUserMembership(membershipData);
      }

      // Only fetch detailed data if user is a member
      if (membershipData) {
        await Promise.all([
          fetchMembers(),
          fetchMessages(),
          fetchEvents()
        ]);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
      toast({
        title: "Error",
        description: "Failed to load community data.",
        variant: "destructive",
      });
    }
  };

  const fetchMembers = async () => {
    if (!id) return;

    try {
      const { data: memberships, error: membershipsError } = await supabase
        .from("community_memberships")
        .select("*")
        .eq("community_id", id)
        .eq("status", "active")
        .order("joined_at", { ascending: false });

      if (membershipsError) throw membershipsError;

      if (memberships && memberships.length > 0) {
        const userIds = memberships.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Combine memberships with profiles
        const membersWithProfiles = memberships.map(membership => ({
          ...membership,
          profiles: profiles?.find(profile => profile.user_id === membership.user_id)
        }));

        setMembers(membersWithProfiles || []);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;

    try {
      const { data: messages, error: messagesError } = await supabase
        .from("community_messages")
        .select("*")
        .eq("community_id", id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (messagesError) throw messagesError;

      if (messages && messages.length > 0) {
        const userIds = [...new Set(messages.map(m => m.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        if (profilesError) throw profilesError;

        // Combine messages with profiles
        const messagesWithProfiles = messages.map(message => ({
          ...message,
          profiles: profiles?.find(profile => profile.user_id === message.user_id)
        }));

        setMessages(messagesWithProfiles || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchEvents = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("community_events")
        .select("*")
        .eq("community_id", id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;

    try {
      const { error } = await supabase
        .from("community_messages")
        .insert({
          community_id: id,
          user_id: user.id,
          content: newMessage.trim(),
          message_type: "text"
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(); // Refresh messages
      
      toast({
        title: "Message sent",
        description: "Your message has been posted to the community.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <UserIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-yellow-500 text-white';
      case 'moderator': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatType = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.location.trim() || !newEvent.event_date || !user || !id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("community_events")
        .insert({
          community_id: id,
          organizer_id: user.id,
          title: newEvent.title.trim(),
          description: newEvent.description.trim(),
          location: newEvent.location.trim(),
          event_date: newEvent.event_date,
          end_date: newEvent.end_date || null,
          max_participants: newEvent.max_participants ? parseInt(newEvent.max_participants) : null
        });

      if (error) throw error;

      setNewEvent({
        title: "",
        description: "",
        location: "",
        event_date: "",
        end_date: "",
        max_participants: ""
      });
      setIsCreateEventOpen(false);
      fetchEvents();
      
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCommunity = () => {
    if (community) {
      setEditingCommunity({ ...community });
      setIsEditCommunityOpen(true);
    }
  };

  const handleSaveCommunityEdit = async () => {
    if (!editingCommunity || !id) return;

    try {
      const { error } = await supabase
        .from("communities")
        .update({
          name: editingCommunity.name,
          description: editingCommunity.description,
          type: editingCommunity.type,
          image_url: editingCommunity.image_url,
          is_private: editingCommunity.is_private
        })
        .eq("id", id);

      if (error) throw error;

      setCommunity(editingCommunity);
      setIsEditCommunityOpen(false);
      
      toast({
        title: "Community updated",
        description: "Community settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating community",
        description: error.message,
        variant: "destructive",
      });
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
            Please sign in to view this community
          </p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4 uppercase tracking-wider">
            Community Not Found
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            The community you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild variant="outline">
            <Link to="/communities">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Communities
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!userMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4 uppercase tracking-wider">
            {community.name}
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            You need to be a member to access this community.
          </p>
          <Button asChild variant="outline">
            <Link to="/communities">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Communities
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} session={session} profile={profile} />
      
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="border-2 border-foreground bg-card p-6 shadow-brutal">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/communities">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2">
                    {community.is_private ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Unlock className="w-5 h-5 text-primary" />
                    )}
                    <Badge className="border border-foreground font-bold">
                      {formatType(community.type)}
                    </Badge>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground uppercase tracking-wider">
                  {community.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {community.description}
                </p>
              </div>
              
              {community.image_url && (
                <img 
                  src={community.image_url} 
                  alt={community.name}
                  className="w-24 h-24 object-cover border-2 border-foreground"
                />
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {community.member_count} members
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getRoleIcon(userMembership.role)}
                <Badge className={getRoleBadgeColor(userMembership.role)}>
                  {userMembership.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="chat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                About
              </TabsTrigger>
              {userMembership.role === 'admin' && (
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              )}
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat">
              <Card className="border-2 border-foreground shadow-brutal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Community Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 mb-4 border border-foreground rounded-md p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.profiles?.avatar_url} />
                            <AvatarFallback>
                              {message.profiles?.display_name?.[0] || message.profiles?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {message.profiles?.display_name || message.profiles?.full_name || 'Unknown User'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events">
              <Card className="border-2 border-foreground shadow-brutal">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Community Events
                    </CardTitle>
                    {(userMembership.role === 'admin' || userMembership.role === 'moderator') && (
                      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                        <DialogTrigger asChild>
                          <Button>Create Event</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Create New Event</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="event-title">Title</Label>
                              <Input
                                id="event-title"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                placeholder="Event title"
                              />
                            </div>
                            <div>
                              <Label htmlFor="event-description">Description</Label>
                              <Textarea
                                id="event-description"
                                value={newEvent.description}
                                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                placeholder="Event description"
                              />
                            </div>
                            <div>
                              <Label htmlFor="event-location">Location</Label>
                              <Input
                                id="event-location"
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                placeholder="Event location"
                              />
                            </div>
                            <div>
                              <Label htmlFor="event-date">Start Date & Time</Label>
                              <Input
                                id="event-date"
                                type="datetime-local"
                                value={newEvent.event_date}
                                onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="event-end-date">End Date & Time (Optional)</Label>
                              <Input
                                id="event-end-date"
                                type="datetime-local"
                                value={newEvent.end_date}
                                onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="max-participants">Max Participants (Optional)</Label>
                              <Input
                                id="max-participants"
                                type="number"
                                value={newEvent.max_participants}
                                onChange={(e) => setNewEvent({...newEvent, max_participants: e.target.value})}
                                placeholder="Leave empty for unlimited"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleCreateEvent} className="flex-1">Create Event</Button>
                              <Button variant="outline" onClick={() => setIsCreateEventOpen(false)} className="flex-1">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No events scheduled yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event) => (
                        <div key={event.id} className="border border-foreground rounded p-4">
                          <h3 className="font-bold text-lg">{event.title}</h3>
                          <p className="text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                            <span>📍 {event.location}</span>
                            <span>👥 {event.current_participants}/{event.max_participants || '∞'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card className="border-2 border-foreground shadow-brutal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Community Members ({members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="border border-foreground rounded p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.profiles?.avatar_url} />
                            <AvatarFallback>
                              {member.profiles?.display_name?.[0] || member.profiles?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {member.profiles?.display_name || member.profiles?.full_name || 'Unknown User'}
                              </span>
                              {getRoleIcon(member.role)}
                            </div>
                            <Badge className={`${getRoleBadgeColor(member.role)} text-xs`}>
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about">
              <Card className="border-2 border-foreground shadow-brutal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    About This Community
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">Description</h3>
                    <p className="text-muted-foreground">{community.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold mb-2">Type</h3>
                      <Badge className="border border-foreground">
                        {formatType(community.type)}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="font-bold mb-2">Privacy</h3>
                      <div className="flex items-center gap-2">
                        {community.is_private ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Unlock className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-sm">
                          {community.is_private ? 'Private' : 'Public'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold mb-2">Created</h3>
                      <span className="text-sm text-muted-foreground">
                        {new Date(community.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-bold mb-2">Members</h3>
                      <span className="text-sm text-muted-foreground">
                        {community.member_count} total
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab (Admin Only) */}
            {userMembership.role === 'admin' && (
              <TabsContent value="settings">
                <Card className="border-2 border-foreground shadow-brutal">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Community Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Edit Community Details */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Community Details</h3>
                      <Dialog open={isEditCommunityOpen} onOpenChange={setIsEditCommunityOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={handleEditCommunity}>Edit Community Details</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Community</DialogTitle>
                          </DialogHeader>
                          {editingCommunity && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">Community Name</Label>
                                <Input
                                  id="edit-name"
                                  value={editingCommunity.name}
                                  onChange={(e) => setEditingCommunity({...editingCommunity, name: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editingCommunity.description}
                                  onChange={(e) => setEditingCommunity({...editingCommunity, description: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-type">Type</Label>
                                <Select
                                  value={editingCommunity.type}
                                  onValueChange={(value) => setEditingCommunity({...editingCommunity, type: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="study_group">Study Group</SelectItem>
                                    <SelectItem value="hobby">Hobby</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="support">Support</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="edit-image">Image URL</Label>
                                <Input
                                  id="edit-image"
                                  value={editingCommunity.image_url || ""}
                                  onChange={(e) => setEditingCommunity({...editingCommunity, image_url: e.target.value})}
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="edit-private"
                                  checked={editingCommunity.is_private}
                                  onChange={(e) => setEditingCommunity({...editingCommunity, is_private: e.target.checked})}
                                  className="rounded"
                                />
                                <Label htmlFor="edit-private">Private Community</Label>
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={handleSaveCommunityEdit} className="flex-1">Save Changes</Button>
                                <Button variant="outline" onClick={() => setIsEditCommunityOpen(false)} className="flex-1">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Member Management */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Member Management</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="border border-foreground rounded p-4">
                          <h4 className="font-medium mb-2">Current Members: {members.length}</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Manage member roles and permissions
                          </p>
                          <div className="space-y-2">
                            {members.slice(0, 5).map((member) => (
                              <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.profiles?.avatar_url} />
                                    <AvatarFallback className="text-xs">
                                      {member.profiles?.display_name?.[0] || member.profiles?.full_name?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    {member.profiles?.display_name || member.profiles?.full_name || 'Unknown User'}
                                  </span>
                                </div>
                                <Badge className={`${getRoleBadgeColor(member.role)} text-xs`}>
                                  {member.role}
                                </Badge>
                              </div>
                            ))}
                            {members.length > 5 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                And {members.length - 5} more members...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Community Stats */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Community Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-foreground rounded p-4 text-center">
                          <div className="text-2xl font-bold text-primary">{members.length}</div>
                          <div className="text-sm text-muted-foreground">Total Members</div>
                        </div>
                        <div className="border border-foreground rounded p-4 text-center">
                          <div className="text-2xl font-bold text-primary">{messages.length}</div>
                          <div className="text-sm text-muted-foreground">Messages</div>
                        </div>
                        <div className="border border-foreground rounded p-4 text-center">
                          <div className="text-2xl font-bold text-primary">{events.length}</div>
                          <div className="text-sm text-muted-foreground">Events</div>
                        </div>
                        <div className="border border-foreground rounded p-4 text-center">
                          <div className="text-2xl font-bold text-primary">
                            {new Date(community.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">Created</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CommunityDetail;