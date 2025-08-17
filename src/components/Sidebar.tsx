import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rss, Megaphone, Users, ShoppingCart, MessageCircle, User as UserIcon, LogOut } from "lucide-react";
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
    <div className="w-64 h-screen bg-card border-r-2 border-foreground p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary uppercase tracking-wider">
          PPMKFriends
        </h1>
      </div>

      {/* Profile Section */}
      <div className="mb-8 p-4 bg-card border-2 border-foreground shadow-brutal">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-foreground">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
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
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold uppercase">
          <Rss className="w-5 h-5" />
          Feed
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold uppercase">
          <Megaphone className="w-5 h-5" />
          Broadcast
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold uppercase">
          <Users className="w-5 h-5" />
          Communities
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold uppercase">
          <ShoppingCart className="w-5 h-5" />
          Marketplace
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold uppercase">
          <MessageCircle className="w-5 h-5" />
          Message
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 font-bold uppercase">
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