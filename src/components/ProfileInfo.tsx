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
import { User, Calendar, MapPin, GraduationCap, Heart, Phone, Mail, FileText, X, Save } from "lucide-react";

interface ProfileFormData {
  full_name: string;
  display_name: string;
  bio: string;
  avatar_url: string;
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
  study_year: string;
  ppmk_batch: string;
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

interface ProfileInfoProps {
  profile: any;
  onClose: () => void;
}

export default function ProfileInfo({ profile, onClose }: ProfileInfoProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customRace, setCustomRace] = useState("");
  const [customReligion, setCustomReligion] = useState("");
  const [customRelationship, setCustomRelationship] = useState("");
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<ProfileFormData>();

  useEffect(() => {
    if (profile) {
      // Set form values for all profile fields
      Object.keys(profile).forEach((key) => {
        if (profile[key] !== null && key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at') {
          setValue(key as keyof ProfileFormData, profile[key]);
        }
      });

      // Handle custom fields for select dropdowns
      if (profile.race && !['malay', 'chinese', 'indian'].includes(profile.race)) {
        setCustomRace(profile.race);
        setValue('race', 'other');
      }
      
      if (profile.religion && !['islam', 'christianity', 'buddhism', 'hinduism', 'taoism', 'none'].includes(profile.religion)) {
        setCustomReligion(profile.religion);
        setValue('religion', 'other');
      }
      
      if (profile.next_of_kin_relationship && !['parent', 'spouse', 'sibling', 'child', 'guardian', 'friend', 'relative'].includes(profile.next_of_kin_relationship)) {
        setCustomRelationship(profile.next_of_kin_relationship);
        setValue('next_of_kin_relationship', 'other');
      }
    }
  }, [profile, setValue]);

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
      setIsEditing(false);
    } catch (error: any) {
      toast.error("Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayValue = (value: string | null | undefined, fallback: string = "Not provided") => {
    return value || fallback;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              {isEditing ? "Edit your personal information" : "View and manage your personal details"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button 
                  onClick={() => setIsEditing(true)}
                  size="sm"
                >
                  Edit
                </Button>
                <Button 
                  variant="outline"
                  onClick={onClose}
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  form="profile-info-form"
                  disabled={loading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form id="profile-info-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Profile */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                {isEditing ? (
                  <Input {...register("display_name")} placeholder="How others see you" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.display_name)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                {isEditing ? (
                  <Input {...register("full_name")} placeholder="Your legal name" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.full_name)}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <Textarea {...register("bio")} placeholder="Tell others about yourself" />
              ) : (
                <div className="p-3 bg-muted rounded-md min-h-[80px]">
                  {formatDisplayValue(profile?.bio)}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-muted rounded-md capitalize">
                    {formatDisplayValue(profile?.gender)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="marital_status">Marital Status</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-muted rounded-md capitalize">
                    {formatDisplayValue(profile?.marital_status)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="race">Race</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Select 
                      onValueChange={(value) => {
                        setValue("race", value === 'other' ? customRace : value);
                        if (value !== 'other') setCustomRace("");
                      }} 
                      value={watch("race") === customRace ? 'other' : watch("race")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select race" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="malay">Malay</SelectItem>
                        <SelectItem value="chinese">Chinese</SelectItem>
                        <SelectItem value="indian">Indian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {watch("race") === 'other' && (
                      <Input
                        placeholder="Please specify"
                        value={customRace}
                        onChange={(e) => {
                          setCustomRace(e.target.value);
                          setValue("race", e.target.value);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md capitalize">
                    {formatDisplayValue(profile?.race)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="religion">Religion</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Select 
                      onValueChange={(value) => {
                        setValue("religion", value === 'other' ? customReligion : value);
                        if (value !== 'other') setCustomReligion("");
                      }} 
                      value={watch("religion") === customReligion ? 'other' : watch("religion")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="islam">Islam</SelectItem>
                        <SelectItem value="christianity">Christianity</SelectItem>
                        <SelectItem value="buddhism">Buddhism</SelectItem>
                        <SelectItem value="hinduism">Hinduism</SelectItem>
                        <SelectItem value="taoism">Taoism</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {watch("religion") === 'other' && (
                      <Input
                        placeholder="Please specify"
                        value={customReligion}
                        onChange={(e) => {
                          setCustomReligion(e.target.value);
                          setValue("religion", e.target.value);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md capitalize">
                    {formatDisplayValue(profile?.religion)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                {isEditing ? (
                  <Input {...register("date_of_birth")} type="date" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDate(profile?.date_of_birth)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="born_place">Place of Birth</Label>
                {isEditing ? (
                  <Input {...register("born_place")} placeholder="Place of birth" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.born_place)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Identification Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Identification Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="passport_number">Passport Number</Label>
                {isEditing ? (
                  <Input {...register("passport_number")} placeholder="Passport number" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.passport_number)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="arc_number">ARC Number</Label>
                {isEditing ? (
                  <Input {...register("arc_number")} placeholder="ARC number" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.arc_number)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="identity_card_number">Identity Card Number</Label>
                {isEditing ? (
                  <Input {...register("identity_card_number")} placeholder="IC number" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.identity_card_number)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telephone_malaysia">Malaysia Phone</Label>
                {isEditing ? (
                  <Input {...register("telephone_malaysia")} placeholder="+60" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.telephone_malaysia)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="telephone_korea">Korea Phone</Label>
                {isEditing ? (
                  <Input {...register("telephone_korea")} placeholder="+82" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.telephone_korea)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input {...register("email")} type="email" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.email)}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address_malaysia">Malaysia Address</Label>
                {isEditing ? (
                  <Textarea {...register("address_malaysia")} placeholder="Malaysia address" />
                ) : (
                  <div className="p-3 bg-muted rounded-md min-h-[80px]">
                    {formatDisplayValue(profile?.address_malaysia)}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address_korea">Korea Address</Label>
                {isEditing ? (
                  <Textarea {...register("address_korea")} placeholder="Korea address" />
                ) : (
                  <div className="p-3 bg-muted rounded-md min-h-[80px]">
                    {formatDisplayValue(profile?.address_korea)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Education Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studying_place">University/Institution</Label>
                {isEditing ? (
                  <Input {...register("studying_place")} placeholder="University name" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.studying_place)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="study_course">Course of Study</Label>
                {isEditing ? (
                  <Input {...register("study_course")} placeholder="Course name" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.study_course)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="study_level">Study Level</Label>
                {isEditing ? (
                  <Select onValueChange={(value) => setValue("study_level", value)} value={watch("study_level")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="graduate">Graduate</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                      <SelectItem value="exchange">Exchange</SelectItem>
                      <SelectItem value="language">Language Course</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted rounded-md capitalize">
                    {formatDisplayValue(profile?.study_level)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="study_start_date">Study Start Date</Label>
                {isEditing ? (
                  <Input {...register("study_start_date")} type="date" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDate(profile?.study_start_date)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="study_end_date">Study End Date</Label>
                {isEditing ? (
                  <Input {...register("study_end_date")} type="date" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDate(profile?.study_end_date)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="study_year">Study Year</Label>
                {isEditing ? (
                  <Input {...register("study_year")} placeholder="Study year" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.study_year)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="ppmk_batch">PPMK Batch</Label>
                {isEditing ? (
                  <Input {...register("ppmk_batch")} placeholder="PPMK batch" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.ppmk_batch)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Sponsorship Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sponsorship Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sponsorship">Sponsorship</Label>
                {isEditing ? (
                  <Input {...register("sponsorship")} placeholder="Sponsorship organization" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.sponsorship)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="sponsorship_phone_number">Sponsorship Phone</Label>
                {isEditing ? (
                  <Input {...register("sponsorship_phone_number")} placeholder="Sponsorship contact number" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.sponsorship_phone_number)}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="sponsorship_address">Sponsorship Address</Label>
                {isEditing ? (
                  <Textarea {...register("sponsorship_address")} placeholder="Sponsorship address" />
                ) : (
                  <div className="p-3 bg-muted rounded-md min-h-[80px]">
                    {formatDisplayValue(profile?.sponsorship_address)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Medical & Emergency Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Medical & Emergency Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blood_type">Blood Type</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.blood_type)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="allergy">Allergies</Label>
                {isEditing ? (
                  <Input {...register("allergy")} placeholder="Known allergies" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.allergy)}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="medical_condition">Medical Conditions</Label>
                {isEditing ? (
                  <Textarea {...register("medical_condition")} placeholder="Medical conditions" />
                ) : (
                  <div className="p-3 bg-muted rounded-md min-h-[80px]">
                    {formatDisplayValue(profile?.medical_condition)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="next_of_kin">Next of Kin</Label>
                {isEditing ? (
                  <Input {...register("next_of_kin")} placeholder="Next of kin name" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.next_of_kin)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                {isEditing ? (
                  <div className="space-y-2">
                    <Select 
                      onValueChange={(value) => {
                        setValue("next_of_kin_relationship", value === 'other' ? customRelationship : value);
                        if (value !== 'other') setCustomRelationship("");
                      }} 
                      value={watch("next_of_kin_relationship") === customRelationship ? 'other' : watch("next_of_kin_relationship")}
                    >
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
                    {watch("next_of_kin_relationship") === 'other' && (
                      <Input
                        placeholder="Please specify"
                        value={customRelationship}
                        onChange={(e) => {
                          setCustomRelationship(e.target.value);
                          setValue("next_of_kin_relationship", e.target.value);
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md capitalize">
                    {formatDisplayValue(profile?.next_of_kin_relationship)}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="next_of_kin_contact_number">Contact Number</Label>
                {isEditing ? (
                  <Input {...register("next_of_kin_contact_number")} placeholder="Emergency contact number" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {formatDisplayValue(profile?.next_of_kin_contact_number)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}