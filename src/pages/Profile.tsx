import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Calendar, MapPin, GraduationCap, Heart, Phone, Mail, FileText, AlertTriangle } from "lucide-react";

interface ProfileFormData {
  full_name: string;
  gender: string;
  marital_status: string;
  race: string;
  religion: string;
  date_of_birth: string;
  born_place: string;
  passport_number: string;
  arc_number: string;
  identity_card_number: string;
  telephone_malaysia: string;
  telephone_korea: string;
  email: string;
  address_malaysia: string;
  address_korea: string;
  studying_place: string;
  study_course: string;
  study_level: string;
  study_start_date: string;
  study_end_date: string;
  sponsorship: string;
  sponsorship_address: string;
  sponsorship_phone_number: string;
  blood_type: string;
  allergy: string;
  medical_condition: string;
  next_of_kin: string;
  next_of_kin_relationship: string;
  next_of_kin_contact_number: string;
}

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [customRace, setCustomRace] = useState("");
  const [customReligion, setCustomReligion] = useState("");
  const [customRelationship, setCustomRelationship] = useState("");
  
  const { register, handleSubmit, setValue, watch } = useForm<ProfileFormData>();

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        Object.keys(profile).forEach((key) => {
          if (profile[key] !== null) {
            setValue(key as keyof ProfileFormData, profile[key]);
          }
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic personal details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input {...register("full_name")} placeholder="Enter your full name" />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => setValue("gender", value)} value={watch("gender")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select onValueChange={(value) => setValue("marital_status", value)} value={watch("marital_status")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="race">Race</Label>
                <Select onValueChange={(value) => {
                  setValue("race", value);
                  if (value === "others") {
                    setValue("race", customRace);
                  }
                }} value={watch("race")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select race" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="malay">Malay</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="others">Others (Enter Detail)</SelectItem>
                  </SelectContent>
                </Select>
                {watch("race") === "others" && (
                  <div className="mt-2">
                    <Input 
                      value={customRace}
                      onChange={(e) => {
                        setCustomRace(e.target.value);
                        setValue("race", e.target.value);
                      }}
                      placeholder="Please specify your race" 
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="religion">Religion</Label>
                <Select onValueChange={(value) => {
                  setValue("religion", value);
                  if (value === "other") {
                    setValue("religion", customReligion);
                  }
                }} value={watch("religion")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select religion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="islam">Islam</SelectItem>
                    <SelectItem value="christianity">Christianity</SelectItem>
                    <SelectItem value="buddhism">Buddhism</SelectItem>
                    <SelectItem value="hinduism">Hinduism</SelectItem>
                    <SelectItem value="taoism">Taoism</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                {watch("religion") === "other" && (
                  <div className="mt-2">
                    <Input 
                      value={customReligion}
                      onChange={(e) => {
                        setCustomReligion(e.target.value);
                        setValue("religion", e.target.value);
                      }}
                      placeholder="Please specify your religion" 
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input {...register("date_of_birth")} type="date" />
              </div>
              <div>
                <Label htmlFor="born_place">Place of Birth</Label>
                <Input {...register("born_place")} placeholder="Enter place of birth" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identification Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Identification Documents
            </CardTitle>
            <CardDescription>Official document numbers for identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="passport_number">Passport Number</Label>
                <Input {...register("passport_number")} placeholder="Enter passport number" />
              </div>
              <div>
                <Label htmlFor="arc_number">ARC Number</Label>
                <Input {...register("arc_number")} placeholder="Enter ARC number" />
              </div>
              <div>
                <Label htmlFor="identity_card_number">Identity Card Number</Label>
                <Input {...register("identity_card_number")} placeholder="Enter IC number" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>Phone numbers, email, and addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telephone_malaysia">Malaysia Phone</Label>
                <Input {...register("telephone_malaysia")} placeholder="+60" />
              </div>
              <div>
                <Label htmlFor="telephone_korea">Korea Phone</Label>
                <Input {...register("telephone_korea")} placeholder="+82" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input {...register("email")} type="email" placeholder="Enter email address" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div>
                <Label htmlFor="address_malaysia">Malaysia Address</Label>
                <Textarea {...register("address_malaysia")} placeholder="Enter Malaysia address" />
              </div>
              <div>
                <Label htmlFor="address_korea">Korea Address</Label>
                <Textarea {...register("address_korea")} placeholder="Enter Korea address" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education Information
            </CardTitle>
            <CardDescription>Study details and sponsorship information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studying_place">University/Institution</Label>
                <Input {...register("studying_place")} placeholder="Enter university name" />
              </div>
              <div>
                <Label htmlFor="study_course">Course of Study</Label>
                <Input {...register("study_course")} placeholder="Enter course name" />
              </div>
              <div>
                <Label htmlFor="study_level">Study Level</Label>
                <Select onValueChange={(value) => setValue("study_level", value)} value={watch("study_level")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select study level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="language">Language Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="study_start_date">Study Start Date</Label>
                <Input {...register("study_start_date")} type="date" />
              </div>
              <div>
                <Label htmlFor="study_end_date">Study End Date</Label>
                <Input {...register("study_end_date")} type="date" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div>
                <Label htmlFor="sponsorship">Sponsorship Details</Label>
                <Textarea {...register("sponsorship")} placeholder="Enter sponsorship information" />
              </div>
              <div>
                <Label htmlFor="sponsorship_address">Sponsorship Address</Label>
                <Textarea {...register("sponsorship_address")} placeholder="Enter sponsor address" />
              </div>
              <div>
                <Label htmlFor="sponsorship_phone_number">Sponsorship Phone</Label>
                <Input {...register("sponsorship_phone_number")} placeholder="Enter sponsor phone" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical & Emergency Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Medical & Emergency Information
            </CardTitle>
            <CardDescription>Health details and emergency contacts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blood_type">Blood Type</Label>
                <Select onValueChange={(value) => setValue("blood_type", value)} value={watch("blood_type")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="allergy">Allergies</Label>
                <Textarea {...register("allergy")} placeholder="List any allergies" />
              </div>
              <div>
                <Label htmlFor="medical_condition">Medical Conditions</Label>
                <Textarea {...register("medical_condition")} placeholder="List any medical conditions" />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="next_of_kin">Next of Kin</Label>
                <Input {...register("next_of_kin")} placeholder="Full name" />
              </div>
              <div>
                <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                <Select onValueChange={(value) => {
                  setValue("next_of_kin_relationship", value);
                  if (value === "other") {
                    setValue("next_of_kin_relationship", customRelationship);
                  }
                }} value={watch("next_of_kin_relationship")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {watch("next_of_kin_relationship") === "other" && (
                  <div className="mt-2">
                    <Input 
                      value={customRelationship}
                      onChange={(e) => {
                        setCustomRelationship(e.target.value);
                        setValue("next_of_kin_relationship", e.target.value);
                      }}
                      placeholder="Please specify the relationship" 
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="next_of_kin_contact_number">Contact Number</Label>
                <Input {...register("next_of_kin_contact_number")} placeholder="Phone number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-32">
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}