import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Lock, Unlock, UserPlus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Communities = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [userMemberships, setUserMemberships] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    type: 'student_club',
    image_url: '',
    is_private: false
  });
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
          setCommunities([]);
          setUserMemberships([]);
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
      await Promise.all([fetchCommunities(), fetchUserMemberships(userId)]);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error("Error fetching communities:", error);
    }
  };

  const fetchUserMemberships = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("community_memberships")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) throw error;
      setUserMemberships(data || []);
    } catch (error) {
      console.error("Error fetching memberships:", error);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("community_memberships")
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: "member",
          status: "active"
        });

      if (error) throw error;

      toast({
        title: "Joined community!",
        description: "You've successfully joined the community.",
      });

      // Refresh memberships
      fetchUserMemberships(user.id);
    } catch (error: any) {
      toast({
        title: "Error joining community",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateCommunity = async () => {
    if (!user || !newCommunity.name.trim() || !newCommunity.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("communities")
        .insert({
          name: newCommunity.name.trim(),
          description: newCommunity.description.trim(),
          type: newCommunity.type,
          image_url: newCommunity.image_url.trim() || null,
          is_private: newCommunity.is_private,
          admin_id: user.id,
          member_count: 1
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically join the creator as admin
      await supabase
        .from("community_memberships")
        .insert({
          community_id: data.id,
          user_id: user.id,
          role: "admin",
          status: "active"
        });

      toast({
        title: "Community created!",
        description: "Your community has been created successfully.",
      });

      // Reset form and close dialog
      setNewCommunity({
        name: '',
        description: '',
        type: 'student_club',
        image_url: '',
        is_private: false
      });
      setIsCreateDialogOpen(false);

      // Refresh communities and memberships
      await Promise.all([fetchCommunities(), fetchUserMemberships(user.id)]);
    } catch (error: any) {
      toast({
        title: "Error creating community",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student_club': return 'bg-primary text-primary-foreground';
      case 'university_group': return 'bg-secondary text-secondary-foreground';
      case 'age_group': return 'bg-muted text-muted-foreground';
      case 'interest_group': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatType = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  const isUserMember = (communityId: string) => {
    return userMemberships.some(membership => membership.community_id === communityId);
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Please sign in to view communities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-2 border-foreground bg-card p-6 shadow-brutal">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground uppercase tracking-wider">
                    Communities
                  </h1>
                  <p className="text-lg text-muted-foreground uppercase font-bold">
                    Connect with students, clubs, and interest groups
                  </p>
                </div>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="brutal" size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    Create Community
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Community</DialogTitle>
                    <DialogDescription>
                      Create a community to connect with students and share interests.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Community Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter community name"
                        value={newCommunity.name}
                        onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your community and its purpose"
                        value={newCommunity.description}
                        onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Community Type</Label>
                      <Select 
                        value={newCommunity.type} 
                        onValueChange={(value) => setNewCommunity({...newCommunity, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student_club">Student Club</SelectItem>
                          <SelectItem value="university_group">University Group</SelectItem>
                          <SelectItem value="age_group">Age Group</SelectItem>
                          <SelectItem value="interest_group">Interest Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="image_url">Community Image URL (Optional)</Label>
                      <Input
                        id="image_url"
                        placeholder="https://example.com/image.jpg"
                        value={newCommunity.image_url}
                        onChange={(e) => setNewCommunity({...newCommunity, image_url: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_private"
                        checked={newCommunity.is_private}
                        onCheckedChange={(checked) => setNewCommunity({...newCommunity, is_private: checked})}
                      />
                      <Label htmlFor="is_private">Private Community</Label>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCommunity}>
                        Create Community
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-foreground"
              />
            </div>
          </div>

          {/* My Communities */}
          {userMemberships.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground uppercase border-b-2 border-foreground pb-2">
                My Communities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities
                  .filter(community => isUserMember(community.id))
                  .map((community) => (
                    <Card key={community.id} className="border-2 border-foreground shadow-brutal">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge className={`${getTypeColor(community.type)} border border-foreground font-bold`}>
                            {formatType(community.type)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {community.is_private ? (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Unlock className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground uppercase">{community.name}</h3>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <p className="text-foreground leading-relaxed line-clamp-3">{community.description}</p>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">
                            {community.member_count} members
                          </span>
                        </div>
                        
                        <Button asChild variant="brutal" className="w-full gap-2">
                          <Link to={`/communities/${community.id}`}>
                            Enter Community
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* All Communities */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground uppercase border-b-2 border-foreground pb-2">
              All Communities
            </h2>
            
            {filteredCommunities.length === 0 ? (
              <div className="text-center py-12 border-2 border-foreground bg-muted">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-bold uppercase">
                  {searchQuery ? "No communities found" : "No communities available"}
                </p>
                <p className="text-muted-foreground mt-2">
                  {searchQuery ? "Try a different search term" : "Be the first to create a community!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map((community) => {
                  const isMember = isUserMember(community.id);
                  
                  return (
                    <Card key={community.id} className="border-2 border-foreground shadow-brutal">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge className={`${getTypeColor(community.type)} border border-foreground font-bold`}>
                            {formatType(community.type)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {community.is_private ? (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Unlock className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground uppercase">{community.name}</h3>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {community.image_url && (
                          <img 
                            src={community.image_url} 
                            alt={community.name}
                            className="w-full h-32 object-cover border-2 border-foreground"
                          />
                        )}
                        
                        <p className="text-foreground leading-relaxed line-clamp-3">{community.description}</p>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">
                            {community.member_count} members
                          </span>
                        </div>
                        
                        {isMember ? (
                          <Button asChild variant="brutal" className="w-full gap-2">
                            <Link to={`/communities/${community.id}`}>
                              Enter Community
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full gap-2"
                            onClick={() => handleJoinCommunity(community.id)}
                          >
                            <UserPlus className="w-4 h-4" />
                            {community.is_private ? 'Request to Join' : 'Join Community'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communities;