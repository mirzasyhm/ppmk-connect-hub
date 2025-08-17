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
import { useToast } from "@/hooks/use-toast";
import { Users, Upload, Shield, Database } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
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
      const [usersResult, credentialsResult] = await Promise.all([
        // Fetch all users with their profiles and roles
        supabase
          .from('profiles')
          .select(`
            *,
            user_roles (
              role,
              assigned_at
            )
          `),
        
        // Fetch invited credentials (superadmin only)
        userRole === 'superadmin' ? 
          supabase
            .from('invited_credentials')
            .select('*')
            .order('created_at', { ascending: false }) :
          { data: [], error: null }
      ]);

      if (usersResult.error) {
        console.error('Error fetching users:', usersResult.error);
      } else {
        setUsers(usersResult.data || []);
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

        const newCredentials: any[] = [];

        // Process each row and create invited credentials
        for (const row of jsonData) {
          const userData = row as any;
          const generatedPassword = generatePassword();
          
          try {
            // Create invited credential
            const { error: credError } = await supabase
              .from('invited_credentials')
              .insert({
                email: userData.email,
                password_hash: generatedPassword,
                role: userData.role || 'member',
                invited_by: user?.id,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
              });

            if (credError) {
              console.error('Error creating credential for', userData.email, credError);
              continue;
            }

            // Create the user account
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: userData.email,
              password: generatedPassword,
              email_confirm: true,
              user_metadata: {
                username: userData.email.split('@')[0],
                display_name: userData.fullName
              }
            });

            if (authError) {
              console.error('Error creating user for', userData.email, authError);
              continue;
            }

            // Create profile with all the data from Excel
            if (authData.user) {
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  user_id: authData.user.id,
                  username: userData.email.split('@')[0],
                  display_name: userData.fullName,
                  full_name: userData.fullName,
                  email: userData.email,
                  gender: userData.gender,
                  marital_status: userData.maritalStatus,
                  race: userData.race,
                  religion: userData.religion,
                  date_of_birth: userData.dateOfBirth,
                  born_place: userData.bornPlace,
                  passport_number: userData.passportNumber,
                  arc_number: userData.arcNumber,
                  identity_card_number: userData.identityCardNumber,
                  telephone_malaysia: userData["telephoneNumbers Malaysia"],
                  telephone_korea: userData["telephoneNumbers Korea"],
                  address_malaysia: userData["addresses Malaysia"],
                  address_korea: userData["addresses Korea"],
                  studying_place: userData.studyingPlace,
                  study_course: userData.studyCourse,
                  study_level: userData.studyLevel,
                  study_start_date: userData["studyPeriod StartDate"],
                  study_end_date: userData["studyPeriod EndDate"],
                  sponsorship: userData.sponsorship,
                  sponsorship_address: userData.sponsorshipAddress,
                  sponsorship_phone_number: userData.sponsorshipPhoneNumber,
                  blood_type: userData.bloodType,
                  allergy: userData.allergy,
                  medical_condition: userData.medicalCondition,
                  next_of_kin: userData.nextOfKin,
                  next_of_kin_relationship: userData.nextOfKinRelationship,
                  next_of_kin_contact_number: userData.nextOfKinContactNumber
                });

              if (profileError) {
                console.error('Error creating profile for', userData.email, profileError);
              } else {
                // Store credentials for tracking
                newCredentials.push({
                  email: userData.email,
                  password: generatedPassword,
                  fullName: userData.fullName,
                  created: new Date().toISOString()
                });
              }
            }
          } catch (error) {
            console.error('Error processing user', userData.email, error);
          }
        }

        // Update generated credentials state
        setGeneratedCredentials(prev => [...prev, ...newCredentials]);

        toast({
          title: "Bulk Import Complete",
          description: `Processed ${jsonData.length} users from Excel file with generated passwords.`,
        });

        await fetchAdminData();
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

  // Function to send all credentials
  const sendAllCredentials = async () => {
    if (generatedCredentials.length === 0) return;

    setIsProcessing(true);
    let sentCount = 0;

    for (const cred of generatedCredentials) {
      const success = await sendCredentialsEmail(cred.email, cred.password, cred.fullName);
      if (success) {
        sentCount++;
      }
    }

    toast({
      title: "Email Distribution Complete",
      description: `Sent credentials to ${sentCount} out of ${generatedCredentials.length} users.`,
    });

    setIsProcessing(false);
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
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} session={session} profile={profile} />
      
      <main className="flex-1 p-6">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        {userRole === 'superadmin' && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.display_name || user.full_name || 'N/A'}
                          </TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>{user.username || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              user.user_roles?.[0]?.role === 'superadmin' ? 'default' :
                              user.user_roles?.[0]?.role === 'admin' ? 'secondary' : 'outline'
                            }>
                              {user.user_roles?.[0]?.role || 'member'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          {userRole === 'superadmin' && (
                            <TableCell>
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
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                        Upload an Excel file to create multiple user accounts with profiles
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
                          Upload an Excel file with columns: email, password, role, username, display_name, full_name, etc.
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
                            {isProcessing ? 'Processing...' : 'Process File'}
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
                              onClick={sendAllCredentials}
                              disabled={isProcessing}
                              variant="outline"
                              size="sm"
                            >
                              {isProcessing ? 'Sending...' : 'Send All Credentials'}
                            </Button>
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
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
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
      </main>
    </div>
  );
};

export default Admin;