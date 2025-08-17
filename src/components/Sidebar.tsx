import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, Users, Heart, User as UserIcon, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  user: User | null;
  session: Session | null;
  profile: any;
}

export const Sidebar = ({ user, session, profile }: SidebarProps) => {
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    }
  };

  if (!user || !session) return null;

  return (
    <div className="w-64 h-screen bg-gradient-card backdrop-blur-md border-r border-border/50 p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          PPMKFriends
        </h1>
      </div>

      {/* Profile Section */}
      <div className="mb-8 p-4 rounded-lg bg-gradient-card border border-border/30">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">
              {profile?.display_name || profile?.username || "User"}
            </p>
            <p className="text-sm text-muted-foreground">
              @{profile?.username || "user"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3 h-12">
          <Home className="w-5 h-5" />
          Home
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12">
          <Users className="w-5 h-5" />
          Friends
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12">
          <Heart className="w-5 h-5" />
          Liked Posts
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12">
          <UserIcon className="w-5 h-5" />
          Profile
        </Button>
      </nav>

      {/* Sign Out */}
      <Button 
        variant="outline" 
        onClick={handleSignOut}
        className="w-full gap-2 mt-4"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </Button>
    </div>
  );
};