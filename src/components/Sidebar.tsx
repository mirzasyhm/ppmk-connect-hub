import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rss, Megaphone, Users, ShoppingCart, MessageCircle, User as UserIcon, LogOut, Calendar, Shield, Settings, Bell, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SidebarProps {
  user: User | null;
  session: Session | null;
  profile: any;
}

interface UserRole {
  role: string;
}

export const Sidebar = ({ user, session, profile }: SidebarProps) => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', {
        _user_id: user?.id
      });
      
      if (!error) {
        setUserRole(data);
      }
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  const getNavClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `w-full justify-start gap-3 h-12 font-bold uppercase ${
      isActive ? 'bg-primary text-primary-foreground' : ''
    }`;
  };

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
      // Redirect to login page
      navigate("/");
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
        <Button asChild variant="ghost" className={getNavClassName('/feed')}>
          <Link to="/feed">
            <Rss className="w-5 h-5" />
            Feed
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/broadcast')}>
          <Link to="/broadcast">
            <Megaphone className="w-5 h-5" />
            Broadcast
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/communities')}>
          <Link to="/communities">
            <Users className="w-5 h-5" />
            Communities
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/marketplace')}>
          <Link to="/marketplace">
            <ShoppingCart className="w-5 h-5" />
            Marketplace
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/events')}>
          <Link to="/events">
            <Calendar className="w-5 h-5" />
            Events
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/messages')}>
          <Link to="/messages">
            <MessageCircle className="w-5 h-5" />
            Message
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/profile')}>
          <Link to="/profile">
            <UserIcon className="w-5 h-5" />
            Profile
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/search')}>
          <Link to="/search">
            <Search className="w-5 h-5" />
            Search
          </Link>
        </Button>
        {(userRole === 'admin' || userRole === 'superadmin') && (
          <Button asChild variant="ghost" className={getNavClassName('/admin')}>
            <Link to="/admin">
              <Shield className="w-5 h-5" />
              Admin
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" className={getNavClassName('/notifications')}>
          <Link to="/notifications">
            <Bell className="w-5 h-5" />
            Notifications
          </Link>
        </Button>
        <Button asChild variant="ghost" className={getNavClassName('/settings')}>
          <Link to="/settings">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </Button>
      </nav>

      {/* Theme Toggle */}
      <div className="mb-4 flex justify-center">
        <ThemeToggle />
      </div>

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