import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, GraduationCap, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  gender: string;
  date_of_birth: string;
  studying_place: string;
  study_course: string;
  study_level: string;
  study_start_date: string;
  study_end_date: string;
}

export default function SearchProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getStudyYear = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const totalYears = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const yearsPassed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    return `Year ${Math.max(1, Math.min(yearsPassed, totalYears))} of ${totalYears}`;
  };

  const searchProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("user_id", (await supabase.auth.getUser()).data.user?.id || ""); // Exclude current user

      // Search by name or username
      if (searchTerm) {
        query = query.or(
          `display_name.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`
        );
      }

      // Filter by university
      if (universityFilter) {
        query = query.ilike("studying_place", `%${universityFilter}%`);
      }

      // Filter by study level
      if (levelFilter) {
        query = query.eq("study_level", levelFilter);
      }

      // Filter by gender
      if (genderFilter) {
        query = query.eq("gender", genderFilter);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error("Error searching profiles:", error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error("Error searching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load all profiles initially
    searchProfiles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProfiles();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setUniversityFilter("");
    setLevelFilter("");
    setGenderFilter("");
    // Reload all profiles
    setTimeout(() => searchProfiles(), 100);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Search Students</h1>
          <p className="text-muted-foreground">Find and connect with fellow students on the platform</p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  placeholder="Search by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <Input
                  placeholder="University/Institution..."
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                />

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Study Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16 border-2 border-foreground">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {profile.display_name?.charAt(0) || profile.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground truncate">
                      {profile.display_name || profile.full_name || "Unknown"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      @{profile.username || "user"}
                    </p>
                    
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    <div className="space-y-2">
                      {profile.date_of_birth && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4" />
                          <span>Age {calculateAge(profile.date_of_birth)}</span>
                          {profile.gender && (
                            <Badge variant="secondary" className="text-xs">
                              {profile.gender}
                            </Badge>
                          )}
                        </div>
                      )}

                      {profile.studying_place && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{profile.studying_place}</span>
                        </div>
                      )}

                      {profile.study_course && (
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4" />
                          <span className="truncate">{profile.study_course}</span>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {profile.study_level && (
                          <Badge variant="outline">
                            {profile.study_level}
                          </Badge>
                        )}
                        {profile.study_start_date && profile.study_end_date && (
                          <Badge variant="outline">
                            {getStudyYear(profile.study_start_date, profile.study_end_date)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />
                    
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/profile/${profile.user_id}`}>
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {profiles.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No profiles found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}