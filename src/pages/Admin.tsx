import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Upload, Shield, Database, Search, Eye, Edit } from "lucide-react";
import * as XLSX from 'xlsx';

interface AdminProps {
  user: User | null;
  session: Session | null;
  profile: any;
}

const Admin = ({ user, session, profile }: AdminProps) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [invitedCredentials, setInvitedCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { toast } = useToast();

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
      
      if (error) {
        console.error('Error checking role:', error);
        return;
      }
      
      setUserRole(data);
      
      if (data === 'admin' || data === 'superadmin') {
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error checking role:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch all profiles
      const profilesResult = await supabase
        .from('profiles')
        .select('*');

      // Fetch all user roles  
      const rolesResult = await supabase
        .from('user_roles')
        .select('*');

      // Fetch invited credentials (superadmin only)
      const credentialsResult = userRole === 'superadmin' ? 
        await supabase
          .from('invited_credentials')
          .select('*')
          .order('created_at', { ascending: false }) :
        { data: [], error: null };

      if (profilesResult.error) {
        console.error('Error fetching profiles:', profilesResult.error);
      }

      if (rolesResult.error) {
        console.error('Error fetching roles:', rolesResult.error);
      }

      // Combine profiles with their roles
      if (profilesResult.data && rolesResult.data) {
        const usersWithRoles = profilesResult.data.map(profile => {
          const userRole = rolesResult.data.find(role => role.user_id === profile.user_id);
          return {
            ...profile,
            user_roles: userRole ? [userRole] : []
          };
        });
        setUsers(usersWithRoles);
      }

      if (credentialsResult.error) {
        console.error('Error fetching credentials:', credentialsResult.error);
      } else {
        setInvitedCredentials(credentialsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
  };

  // Function to generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Function to send credentials email
  const sendCredentialsEmail = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-credentials', {
        body: { email, password, fullName }
      });
      
      if (error) {
        console.error('Error sending email:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const processExcelFile = async () => {
    if (!uploadFile) return;
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Prepare user data for bulk creation
        const usersToCreate = jsonData.map((row: any) => {
          const generatedPassword = generatePassword();
          
          return {
            email: row.email,
            password: generatedPassword,
            fullName: row.fullName,
            role: row.role || 'member',
            profileData: {
              full_name: row.fullName,
              gender: row.gender,
              marital_status: row.maritalStatus,
              race: row.race,
              religion: row.religion,
              date_of_birth: row.dateOfBirth,
              born_place: row.bornPlace,
              passport_number: row.passportNumber,
              arc_number: row.arcNumber,
              identity_card_number: row.identityCardNumber,
              telephone_malaysia: row["telephoneNumbers Malaysia"],
              telephone_korea: row["telephoneNumbers Korea"],
              address_malaysia: row["addresses Malaysia"],
              address_korea: row["addresses Korea"],
              studying_place: row.studyingPlace,
              study_course: row.studyCourse,
              study_level: row.studyLevel,
              study_start_date: row["studyPeriod StartDate"],
              study_end_date: row["studyPeriod EndDate"],
              sponsorship: row.sponsorship,
              sponsorship_address: row.sponsorshipAddress,
              sponsorship_phone_number: row.sponsorshipPhoneNumber,
              blood_type: row.bloodType,
              allergy: row.allergy,
              medical_condition: row.medicalCondition,
              next_of_kin: row.nextOfKin,
              next_of_kin_relationship: row.nextOfKinRelationship,
              next_of_kin_contact_number: row.nextOfKinContactNumber
            }
          };
        });

        console.log('Calling bulk-create-users function with', usersToCreate.length, 'users');

        // Call the bulk create users edge function
        const { data: result, error } = await supabase.functions.invoke('bulk-create-users', {
          body: { 
            users: usersToCreate,
            createdBy: user?.id 
          }
        });

        if (error) {
          console.error('Error in bulk creation:', error);
          toast({
            title: "Error",
            description: "Failed to process users in bulk.",
            variant: "destructive",
          });
        } else {
          console.log('Bulk creation result:', result);
          
          // Update generated credentials state with successful creations
          const successfulCredentials = result.results
            .filter((r: any) => r.success)
            .map((r: any) => ({
              email: r.email,
              password: r.password,
              fullName: r.fullName,
              created: new Date().toISOString()
            }));

          setGeneratedCredentials(prev => [...prev, ...successfulCredentials]);

          toast({
            title: "Bulk Import Complete",
            description: `Created ${result.summary.success} users, sent ${result.summary.emailsSent} emails out of ${result.summary.total} total.`,
          });

          await fetchAdminData();
        }

        setUploadFile(null);
      };

      reader.readAsArrayBuffer(uploadFile);
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: "Error",
        description: "Failed to process Excel file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to download credentials as file
  const downloadCredentials = () => {
    if (generatedCredentials.length === 0) return;

    const csvContent = [
      ['Email', 'Password', 'Full Name', 'Created Date'],
      ...generatedCredentials.map(cred => [
        cred.email,
        cred.password,
        cred.fullName,
        new Date(cred.created).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-credentials-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Send emails for recent invites (top 10)
  const sendEmailsForRecentInvites = async () => {
    if (invitedCredentials.length === 0) return;
    setIsProcessing(true);
    let sentCount = 0;
    for (const cred of invitedCredentials.slice(0, 10)) {
      const success = await sendCredentialsEmail(
        cred.email,
        cred.password_hash,
        cred.full_name || cred.email.split('@')[0]
      );
      if (success) sentCount++;
    }
    toast({
      title: 'Email Distribution Complete',
      description: `Sent ${sentCount} out of ${Math.min(10, invitedCredentials.length)} recent invites.`,
    });
    setIsProcessing(false);
  };

  // Send email for a single invite
  const sendEmailForInvite = async (cred: any) => {
    setIsProcessing(true);
    const success = await sendCredentialsEmail(
      cred.email,
      cred.password_hash,
      cred.full_name || cred.email.split('@')[0]
    );
    toast({
      title: success ? 'Email sent' : 'Failed to send',
      description: cred.email,
      variant: success ? 'default' : 'destructive',
    });
    setIsProcessing(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // First, remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole as 'member' | 'admin' | 'superadmin',
            assigned_by: user?.id
          });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update user role.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User role updated successfully.",
        });
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          username: editingUser.username,
          display_name: editingUser.display_name,
          email: editingUser.email,
          gender: editingUser.gender,
          marital_status: editingUser.marital_status,
          race: editingUser.race,
          religion: editingUser.religion,
          date_of_birth: editingUser.date_of_birth,
          born_place: editingUser.born_place,
          passport_number: editingUser.passport_number,
          arc_number: editingUser.arc_number,
          identity_card_number: editingUser.identity_card_number,
          telephone_malaysia: editingUser.telephone_malaysia,
          telephone_korea: editingUser.telephone_korea,
          address_malaysia: editingUser.address_malaysia,
          address_korea: editingUser.address_korea,
          studying_place: editingUser.studying_place,
          study_course: editingUser.study_course,
          study_level: editingUser.study_level,
          study_start_date: editingUser.study_start_date,
          study_end_date: editingUser.study_end_date,
          sponsorship: editingUser.sponsorship,
          sponsorship_address: editingUser.sponsorship_address,
          sponsorship_phone_number: editingUser.sponsorship_phone_number,
          blood_type: editingUser.blood_type,
          allergy: editingUser.allergy,
          medical_condition: editingUser.medical_condition,
          next_of_kin: editingUser.next_of_kin,
          next_of_kin_relationship: editingUser.next_of_kin_relationship,
          next_of_kin_contact_number: editingUser.next_of_kin_contact_number,
          bio: editingUser.bio
        })
        .eq('user_id', editingUser.user_id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update user profile.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "User profile updated successfully.",
        });
        setIsEditDialogOpen(false);
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user profile.",
        variant: "destructive",
      });
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.display_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.study_course?.toLowerCase().includes(searchLower) ||
      user.study_level?.toLowerCase().includes(searchLower) ||
      user.telephone_malaysia?.toLowerCase().includes(searchLower) ||
      user.telephone_korea?.toLowerCase().includes(searchLower) ||
      user.user_roles?.[0]?.role?.toLowerCase().includes(searchLower)
    );
  });

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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need to be logged in to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!userRole || (userRole !== 'admin' && userRole !== 'superadmin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-destructive mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Admin Panel</h1>
            <div className="flex items-center gap-2">
              <Badge variant={userRole === 'superadmin' ? 'default' : 'secondary'}>
                {userRole?.toUpperCase()}
              </Badge>
              <p className="text-muted-foreground">
                Manage users, roles, and system settings
              </p>
            </div>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              {userRole === 'superadmin' && (
                <>
                  <TabsTrigger value="bulk-import" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Bulk Import
                  </TabsTrigger>
                  <TabsTrigger value="system" className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    System
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage user accounts and roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search users by name, email, course, phone, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Gender</TableHead>
                          {userRole === 'superadmin' && <TableHead>Date of Birth</TableHead>}
                          <TableHead>University</TableHead>
                          <TableHead>Study Level</TableHead>
                          {userRole === 'superadmin' && <TableHead>Phone (MY)</TableHead>}
                          {userRole === 'superadmin' && <TableHead>Phone (KR)</TableHead>}
                          <TableHead>Role</TableHead>
                          {userRole === 'superadmin' && <TableHead>Joined</TableHead>}
                          {userRole === 'superadmin' && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || user.display_name || 'N/A'}
                            </TableCell>
                            <TableCell>{user.email || 'N/A'}</TableCell>
                            <TableCell>{user.username || 'N/A'}</TableCell>
                            <TableCell>{user.gender || 'N/A'}</TableCell>
                            {userRole === 'superadmin' && (
                              <TableCell>
                                {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                              </TableCell>
                            )}
                            <TableCell>{user.studying_place || 'N/A'}</TableCell>
                            <TableCell>{user.study_level || 'N/A'}</TableCell>
                            {userRole === 'superadmin' && (
                              <TableCell>{user.telephone_malaysia || 'N/A'}</TableCell>
                            )}
                            {userRole === 'superadmin' && (
                              <TableCell>{user.telephone_korea || 'N/A'}</TableCell>
                            )}
                            <TableCell>
                              <Badge variant={
                                user.user_roles?.[0]?.role === 'superadmin' ? 'default' :
                                user.user_roles?.[0]?.role === 'admin' ? 'secondary' : 'outline'
                              }>
                                {user.user_roles?.[0]?.role || 'member'}
                              </Badge>
                            </TableCell>
                            {userRole === 'superadmin' && (
                              <TableCell>
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </TableCell>
                            )}
                            {userRole === 'superadmin' && (
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(user)}
                                    className="gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Detail
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    className="gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </Button>
                                  <Select
                                    defaultValue={user.user_roles?.[0]?.role || 'member'}
                                    onValueChange={(value) => updateUserRole(user.user_id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="member">Member</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="superadmin">Superadmin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {userRole === 'superadmin' && (
              <>
                <TabsContent value="bulk-import">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bulk User Import</CardTitle>
                      <CardDescription>
                        Upload an Excel file to create multiple user accounts with profiles and automatic email distribution
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Excel File</label>
                        <Input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                        />
                        <p className="text-sm text-muted-foreground">
                          Upload an Excel file with user data. Users will be created automatically and credentials will be sent via email.
                        </p>
                      </div>
                      
                      {uploadFile && (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="font-medium">Selected file: {uploadFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Size: {(uploadFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Button 
                            onClick={processExcelFile}
                            className="mt-3"
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Processing & Sending Emails...' : 'Process File & Send Emails'}
                          </Button>
                        </div>
                      )}

                      {generatedCredentials.length > 0 && (
                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                            Generated Credentials ({generatedCredentials.length} users)
                          </h4>
                          <div className="flex gap-2 mb-4">
                            <Button 
                              onClick={downloadCredentials}
                              variant="outline"
                              size="sm"
                            >
                              Download CSV
                            </Button>
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Email</TableHead>
                                  <TableHead className="text-xs">Password</TableHead>
                                  <TableHead className="text-xs">Name</TableHead>
                                  <TableHead className="text-xs">Created</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {generatedCredentials.map((cred, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="text-xs">{cred.email}</TableCell>
                                    <TableCell className="text-xs font-mono">{cred.password}</TableCell>
                                    <TableCell className="text-xs">{cred.fullName}</TableCell>
                                    <TableCell className="text-xs">
                                      {new Date(cred.created).toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Recent Invitations</h4>
                        <div className="flex justify-end mb-2">
                          <Button
                            onClick={sendEmailsForRecentInvites}
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                          >
                            {isProcessing ? 'Sending...' : 'Send Emails to Recent (Top 10)'}
                          </Button>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invitedCredentials.slice(0, 10).map((cred) => (
                              <TableRow key={cred.id}>
                                <TableCell>{cred.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{cred.role}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={cred.used ? 'default' : 'secondary'}>
                                    {cred.used ? 'Used' : 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(cred.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => sendEmailForInvite(cred)}
                                    disabled={isProcessing}
                                  >
                                    Send Email
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="system">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Information</CardTitle>
                      <CardDescription>
                        System statistics and overview
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium">Total Users</h4>
                          <p className="text-2xl font-bold text-primary">{users.length}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium">Admins</h4>
                          <p className="text-2xl font-bold text-primary">
                            {users.filter(u => u.user_roles?.[0]?.role === 'admin').length}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium">Pending Invites</h4>
                          <p className="text-2xl font-bold text-primary">
                            {invitedCredentials.filter(c => !c.used).length}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium">Your Role</h4>
                          <p className="text-2xl font-bold text-primary">{userRole}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
        </div>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete profile information for {selectedUser?.full_name || selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="font-medium">Full Name</Label>
                <p className="text-sm">{selectedUser.full_name || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Username</Label>
                <p className="text-sm">{selectedUser.username || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Display Name</Label>
                <p className="text-sm">{selectedUser.display_name || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Email</Label>
                <p className="text-sm">{selectedUser.email || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Gender</Label>
                <p className="text-sm">{selectedUser.gender || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Date of Birth</Label>
                <p className="text-sm">{selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Marital Status</Label>
                <p className="text-sm">{selectedUser.marital_status || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Race</Label>
                <p className="text-sm">{selectedUser.race || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Religion</Label>
                <p className="text-sm">{selectedUser.religion || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Born Place</Label>
                <p className="text-sm">{selectedUser.born_place || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Passport Number</Label>
                <p className="text-sm">{selectedUser.passport_number || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">ARC Number</Label>
                <p className="text-sm">{selectedUser.arc_number || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Identity Card Number</Label>
                <p className="text-sm">{selectedUser.identity_card_number || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Phone (Malaysia)</Label>
                <p className="text-sm">{selectedUser.telephone_malaysia || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Phone (Korea)</Label>
                <p className="text-sm">{selectedUser.telephone_korea || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Address (Malaysia)</Label>
                <p className="text-sm">{selectedUser.address_malaysia || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Address (Korea)</Label>
                <p className="text-sm">{selectedUser.address_korea || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">University</Label>
                <p className="text-sm">{selectedUser.studying_place || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Study Course</Label>
                <p className="text-sm">{selectedUser.study_course || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Study Level</Label>
                <p className="text-sm">{selectedUser.study_level || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Study Start Date</Label>
                <p className="text-sm">{selectedUser.study_start_date ? new Date(selectedUser.study_start_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Study End Date</Label>
                <p className="text-sm">{selectedUser.study_end_date ? new Date(selectedUser.study_end_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Sponsorship</Label>
                <p className="text-sm">{selectedUser.sponsorship || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Sponsorship Address</Label>
                <p className="text-sm">{selectedUser.sponsorship_address || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Sponsorship Phone</Label>
                <p className="text-sm">{selectedUser.sponsorship_phone_number || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Blood Type</Label>
                <p className="text-sm">{selectedUser.blood_type || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Allergy</Label>
                <p className="text-sm">{selectedUser.allergy || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Medical Condition</Label>
                <p className="text-sm">{selectedUser.medical_condition || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Next of Kin</Label>
                <p className="text-sm">{selectedUser.next_of_kin || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Next of Kin Relationship</Label>
                <p className="text-sm">{selectedUser.next_of_kin_relationship || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Next of Kin Contact</Label>
                <p className="text-sm">{selectedUser.next_of_kin_contact_number || 'N/A'}</p>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-medium">Bio</Label>
                <p className="text-sm">{selectedUser.bio || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Role</Label>
                <Badge variant={
                  selectedUser.user_roles?.[0]?.role === 'superadmin' ? 'default' :
                  selectedUser.user_roles?.[0]?.role === 'admin' ? 'secondary' : 'outline'
                }>
                  {selectedUser.user_roles?.[0]?.role || 'member'}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Joined</Label>
                <p className="text-sm">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update profile information for {editingUser?.full_name || editingUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editingUser.username || ''}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={editingUser.display_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, display_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={editingUser.gender || ''}
                  onChange={(e) => setEditingUser({...editingUser, gender: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={editingUser.date_of_birth || ''}
                  onChange={(e) => setEditingUser({...editingUser, date_of_birth: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Input
                  id="marital_status"
                  value={editingUser.marital_status || ''}
                  onChange={(e) => setEditingUser({...editingUser, marital_status: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="race">Race</Label>
                <Input
                  id="race"
                  value={editingUser.race || ''}
                  onChange={(e) => setEditingUser({...editingUser, race: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Input
                  id="religion"
                  value={editingUser.religion || ''}
                  onChange={(e) => setEditingUser({...editingUser, religion: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="born_place">Born Place</Label>
                <Input
                  id="born_place"
                  value={editingUser.born_place || ''}
                  onChange={(e) => setEditingUser({...editingUser, born_place: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_number">Passport Number</Label>
                <Input
                  id="passport_number"
                  value={editingUser.passport_number || ''}
                  onChange={(e) => setEditingUser({...editingUser, passport_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arc_number">ARC Number</Label>
                <Input
                  id="arc_number"
                  value={editingUser.arc_number || ''}
                  onChange={(e) => setEditingUser({...editingUser, arc_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identity_card_number">Identity Card Number</Label>
                <Input
                  id="identity_card_number"
                  value={editingUser.identity_card_number || ''}
                  onChange={(e) => setEditingUser({...editingUser, identity_card_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone_malaysia">Phone (Malaysia)</Label>
                <Input
                  id="telephone_malaysia"
                  value={editingUser.telephone_malaysia || ''}
                  onChange={(e) => setEditingUser({...editingUser, telephone_malaysia: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone_korea">Phone (Korea)</Label>
                <Input
                  id="telephone_korea"
                  value={editingUser.telephone_korea || ''}
                  onChange={(e) => setEditingUser({...editingUser, telephone_korea: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_malaysia">Address (Malaysia)</Label>
                <Textarea
                  id="address_malaysia"
                  value={editingUser.address_malaysia || ''}
                  onChange={(e) => setEditingUser({...editingUser, address_malaysia: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_korea">Address (Korea)</Label>
                <Textarea
                  id="address_korea"
                  value={editingUser.address_korea || ''}
                  onChange={(e) => setEditingUser({...editingUser, address_korea: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studying_place">University</Label>
                <Input
                  id="studying_place"
                  value={editingUser.studying_place || ''}
                  onChange={(e) => setEditingUser({...editingUser, studying_place: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study_course">Study Course</Label>
                <Input
                  id="study_course"
                  value={editingUser.study_course || ''}
                  onChange={(e) => setEditingUser({...editingUser, study_course: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study_level">Study Level</Label>
                <Input
                  id="study_level"
                  value={editingUser.study_level || ''}
                  onChange={(e) => setEditingUser({...editingUser, study_level: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study_start_date">Study Start Date</Label>
                <Input
                  id="study_start_date"
                  type="date"
                  value={editingUser.study_start_date || ''}
                  onChange={(e) => setEditingUser({...editingUser, study_start_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="study_end_date">Study End Date</Label>
                <Input
                  id="study_end_date"
                  type="date"
                  value={editingUser.study_end_date || ''}
                  onChange={(e) => setEditingUser({...editingUser, study_end_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsorship">Sponsorship</Label>
                <Input
                  id="sponsorship"
                  value={editingUser.sponsorship || ''}
                  onChange={(e) => setEditingUser({...editingUser, sponsorship: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsorship_address">Sponsorship Address</Label>
                <Textarea
                  id="sponsorship_address"
                  value={editingUser.sponsorship_address || ''}
                  onChange={(e) => setEditingUser({...editingUser, sponsorship_address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsorship_phone_number">Sponsorship Phone</Label>
                <Input
                  id="sponsorship_phone_number"
                  value={editingUser.sponsorship_phone_number || ''}
                  onChange={(e) => setEditingUser({...editingUser, sponsorship_phone_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blood_type">Blood Type</Label>
                <Input
                  id="blood_type"
                  value={editingUser.blood_type || ''}
                  onChange={(e) => setEditingUser({...editingUser, blood_type: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergy">Allergy</Label>
                <Input
                  id="allergy"
                  value={editingUser.allergy || ''}
                  onChange={(e) => setEditingUser({...editingUser, allergy: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_condition">Medical Condition</Label>
                <Input
                  id="medical_condition"
                  value={editingUser.medical_condition || ''}
                  onChange={(e) => setEditingUser({...editingUser, medical_condition: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_of_kin">Next of Kin</Label>
                <Input
                  id="next_of_kin"
                  value={editingUser.next_of_kin || ''}
                  onChange={(e) => setEditingUser({...editingUser, next_of_kin: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_of_kin_relationship">Next of Kin Relationship</Label>
                <Input
                  id="next_of_kin_relationship"
                  value={editingUser.next_of_kin_relationship || ''}
                  onChange={(e) => setEditingUser({...editingUser, next_of_kin_relationship: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_of_kin_contact_number">Next of Kin Contact</Label>
                <Input
                  id="next_of_kin_contact_number"
                  value={editingUser.next_of_kin_contact_number || ''}
                  onChange={(e) => setEditingUser({...editingUser, next_of_kin_contact_number: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser({...editingUser, bio: e.target.value})}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default Admin;
