import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { BroadcastCard } from "@/components/FeedItems/BroadcastCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Edit, Trash2 } from "lucide-react";

const Broadcast = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    image_url: ''
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
      fetchUserRole(userId);
      fetchBroadcasts();
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user role:", error);
        return;
      }
      
      setUserRole(data?.role || 'member');
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole('member');
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

  const handleCreateBroadcast = async () => {
    if (!user || !formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("broadcasts")
        .insert([
          {
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            image_url: formData.image_url || null,
            created_by: user.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Broadcast created successfully"
      });

      setIsDialogOpen(false);
      setFormData({ title: '', content: '', priority: 'normal', image_url: '' });
      fetchBroadcasts();
    } catch (error) {
      console.error("Error creating broadcast:", error);
      toast({
        title: "Error",
        description: "Failed to create broadcast",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBroadcast = async () => {
    if (!editingBroadcast || !formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("broadcasts")
        .update({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          image_url: formData.image_url || null
        })
        .eq("id", editingBroadcast.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Broadcast updated successfully"
      });

      setIsDialogOpen(false);
      setEditingBroadcast(null);
      setFormData({ title: '', content: '', priority: 'normal', image_url: '' });
      fetchBroadcasts();
    } catch (error) {
      console.error("Error updating broadcast:", error);
      toast({
        title: "Error",
        description: "Failed to update broadcast",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBroadcast = async (broadcastId: string) => {
    try {
      const { error } = await supabase
        .from("broadcasts")
        .delete()
        .eq("id", broadcastId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Broadcast deleted successfully"
      });

      fetchBroadcasts();
    } catch (error) {
      console.error("Error deleting broadcast:", error);
      toast({
        title: "Error",
        description: "Failed to delete broadcast",
        variant: "destructive"
      });
    }
  };

  const openCreateDialog = () => {
    setEditingBroadcast(null);
    setFormData({ title: '', content: '', priority: 'normal', image_url: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (broadcast: any) => {
    setEditingBroadcast(broadcast);
    setFormData({
      title: broadcast.title,
      content: broadcast.content,
      priority: broadcast.priority,
      image_url: broadcast.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

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
              
              {/* Only show create button for admins */}
              {isAdmin && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="brutal" size="lg" className="gap-2" onClick={openCreateDialog}>
                      <Plus className="w-5 h-5" />
                      New Broadcast
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold uppercase">
                        {editingBroadcast ? 'Edit Broadcast' : 'Create New Broadcast'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title" className="text-sm font-bold uppercase">Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="Enter broadcast title"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="content" className="text-sm font-bold uppercase">Content *</Label>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Enter broadcast content"
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="priority" className="text-sm font-bold uppercase">Priority</Label>
                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="image_url" className="text-sm font-bold uppercase">Image URL (Optional)</Label>
                        <Input
                          id="image_url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="Enter image URL"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={editingBroadcast ? handleUpdateBroadcast : handleCreateBroadcast}
                          className="flex-1"
                        >
                          {editingBroadcast ? 'Update' : 'Create'} Broadcast
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
                <BroadcastCard 
                  key={broadcast.id} 
                  broadcast={broadcast} 
                  isAdmin={isAdmin}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteBroadcast}
                />
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
                <BroadcastCard 
                  key={broadcast.id} 
                  broadcast={broadcast} 
                  isAdmin={isAdmin}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteBroadcast}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Broadcast;