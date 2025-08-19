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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Date of Birth</TableHead>
                          <TableHead>Study Course</TableHead>
                          <TableHead>Study Level</TableHead>
                          <TableHead>Phone (MY)</TableHead>
                          <TableHead>Phone (KR)</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          {userRole === 'superadmin' && <TableHead>Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || user.display_name || 'N/A'}
                            </TableCell>
                            <TableCell>{user.email || 'N/A'}</TableCell>
                            <TableCell>{user.username || 'N/A'}</TableCell>
                            <TableCell>{user.gender || 'N/A'}</TableCell>
                            <TableCell>
                              {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>{user.study_course || 'N/A'}</TableCell>
                            <TableCell>{user.study_level || 'N/A'}</TableCell>
                            <TableCell>{user.telephone_malaysia || 'N/A'}</TableCell>
                            <TableCell>{user.telephone_korea || 'N/A'}</TableCell>
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
      </main>
    </div>
  );
};

export default Admin;
