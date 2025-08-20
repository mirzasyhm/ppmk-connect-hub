import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Sidebar } from "@/components/Sidebar";
import Index from "./pages/Index";
import { Feed } from "./pages/Feed";
import Broadcast from "./pages/Broadcast";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import { Marketplace } from "./pages/Marketplace";
import { Events } from "./pages/Events";
import { Messages } from "./pages/Messages";
import Profile from "./pages/Profile";
import ProfileInfoPage from "./pages/ProfileInfo";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);

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
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Layout wrapper component for authenticated pages
  const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
    if (!user || !session) {
      return <Index />;
    }

    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar user={user} session={session} profile={profile} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={
              <AuthenticatedLayout>
                <Feed user={user!} session={session!} profile={profile} />
              </AuthenticatedLayout>
            } />
            <Route path="/broadcast" element={
              <AuthenticatedLayout>
                <Broadcast />
              </AuthenticatedLayout>
            } />
            <Route path="/communities" element={
              <AuthenticatedLayout>
                <Communities />
              </AuthenticatedLayout>
            } />
            <Route path="/communities/:id" element={
              <AuthenticatedLayout>
                <CommunityDetail />
              </AuthenticatedLayout>
            } />
            <Route path="/marketplace" element={
              <AuthenticatedLayout>
                <Marketplace />
              </AuthenticatedLayout>
            } />
            <Route path="/events" element={
              <AuthenticatedLayout>
                <Events />
              </AuthenticatedLayout>
            } />
            <Route path="/messages" element={
              <AuthenticatedLayout>
                <Messages />
              </AuthenticatedLayout>
            } />
            <Route path="/profile" element={
              <AuthenticatedLayout>
                <Profile />
              </AuthenticatedLayout>
            } />
            <Route path="/profile/info" element={
              <AuthenticatedLayout>
                <ProfileInfoPage />
              </AuthenticatedLayout>
            } />
            <Route path="/admin" element={
              <AuthenticatedLayout>
                <Admin user={user} session={session} profile={profile} />
              </AuthenticatedLayout>
            } />
            <Route path="/notifications" element={
              <AuthenticatedLayout>
                <Notifications />
              </AuthenticatedLayout>
            } />
            <Route path="/settings" element={
              <AuthenticatedLayout>
                <Settings user={user} />
              </AuthenticatedLayout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
