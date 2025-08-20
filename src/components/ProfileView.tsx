import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, MapPin, GraduationCap, Calendar, Settings, Eye, EyeOff } from "lucide-react";
import ProfileInfo from "./ProfileInfo";
import ProfileActivities from "./ProfileActivities";
import ProfilePrivacySettings from "./ProfilePrivacySettings";

interface ProfileViewProps {
  userId?: string; // If provided, viewing someone else's profile
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    showAge: true,
    showUniversity: true,
    showStudyYear: true,
    showLocation: true,
    showActivities: true,
    showGallery: true,
  });

  useEffect(() => {
    getProfile();
  }, [userId]);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return;

      setIsOwnProfile(!userId || userId === user?.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (profile) {
        setProfile(profile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getStudyYear = (startDate: string, endDate: string) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const years = end.getFullYear() - start.getFullYear();
    return `Year ${Math.max(1, years + 1)}`;
  };

  if (!profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </div>
    );
  }

  const age = calculateAge(profile.date_of_birth);
  const studyYear = getStudyYear(profile.study_start_date, profile.study_end_date);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header with Privacy/Settings Controls */}
      {isOwnProfile && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrivacySettings(!showPrivacySettings)}
            className="flex items-center gap-2"
          >
            {showPrivacySettings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            Privacy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfileInfo(!showProfileInfo)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Profile Info
          </Button>
        </div>
      )}

      {/* Privacy Settings */}
      {isOwnProfile && showPrivacySettings && (
        <ProfilePrivacySettings
          settings={privacySettings}
          onSettingsChange={setPrivacySettings}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}

      {/* Profile Info (Detailed) */}
      {isOwnProfile && showProfileInfo && (
        <ProfileInfo profile={profile} onClose={() => setShowProfileInfo(false)} />
      )}

      {/* Main Profile View */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : profile.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.full_name || 'User'}
                </h1>
                {profile.bio && (
                  <p className="text-muted-foreground mt-2">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age */}
                {privacySettings.showAge && age && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{age} years old</span>
                  </div>
                )}

                {/* University */}
                {privacySettings.showUniversity && profile.studying_place && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.studying_place}</span>
                  </div>
                )}

                {/* Study Year */}
                {privacySettings.showStudyYear && studyYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{studyYear}</span>
                  </div>
                )}

                {/* Location */}
                {privacySettings.showLocation && profile.address_korea && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.address_korea.split(',')[0]}</span>
                  </div>
                )}
              </div>

              {/* Additional Info Badges */}
              <div className="flex flex-wrap gap-2">
                {profile.study_level && (
                  <Badge variant="secondary" className="capitalize">
                    {profile.study_level}
                  </Badge>
                )}
                {profile.study_course && (
                  <Badge variant="outline">
                    {profile.study_course}
                  </Badge>
                )}
                {profile.gender && (
                  <Badge variant="outline" className="capitalize">
                    {profile.gender}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Section */}
      {privacySettings.showActivities && (
        <ProfileActivities 
          userId={userId || profile.user_id}
          showGallery={privacySettings.showGallery}
        />
      )}
    </div>
  );
}