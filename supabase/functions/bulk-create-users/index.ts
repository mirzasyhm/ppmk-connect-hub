
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BulkCreateUsersRequest {
  users: Array<{
    email: string;
    password: string;
    fullName: string;
    role?: string;
    profileData: any;
  }>;
  createdBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Bulk create users function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { users, createdBy }: BulkCreateUsersRequest = await req.json();
    console.log(`Creating ${users.length} users`);

    const results: any[] = [];
    let successCount = 0;
    let emailSuccessCount = 0;

    for (const userData of users) {
      try {
        console.log(`Processing user: ${userData.email}`);

        // Create invited credential record first
        const { error: credError } = await supabase
          .from('invited_credentials')
          .insert({
            email: userData.email,
            password_hash: userData.password,
            role: userData.role || 'member',
            invited_by: createdBy,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (credError) {
          console.error('Error creating credential for', userData.email, credError);
          results.push({ email: userData.email, success: false, error: credError.message });
          continue;
        }

        // Create the user account using admin API
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            username: userData.email.split('@')[0],
            display_name: userData.fullName
          }
        });

        if (authError) {
          console.error('Error creating user for', userData.email, authError);
          results.push({ email: userData.email, success: false, error: authError.message });
          continue;
        }

        // Create profile with all the data
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              username: userData.email.split('@')[0],
              display_name: userData.fullName,
              email: userData.email,
              ...userData.profileData
            });

          if (profileError) {
            console.error('Error creating profile for', userData.email, profileError);
          }

          // Assign role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: userData.role || 'member',
              assigned_by: createdBy
            });

          if (roleError) {
            console.error('Error assigning role for', userData.email, roleError);
          }

          successCount++;

          // Send credentials email
          try {
            const emailResponse = await resend.emails.send({
              from: "Admin <onboarding@resend.dev>",
              to: [userData.email],
              subject: "Your Account Credentials",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #333;">Welcome ${userData.fullName}!</h1>
                  <p>Your account has been created successfully. Here are your login credentials:</p>
                  
                  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Password:</strong> ${userData.password}</p>
                  </div>
                  
                  <p style="color: #666;">Please keep these credentials secure and change your password after your first login.</p>
                  
                  <p>Best regards,<br>The Admin Team</p>
                </div>
              `,
            });

            if (emailResponse.error) {
              console.error('Email error for', userData.email, emailResponse.error);
            } else {
              emailSuccessCount++;
              console.log('Email sent successfully to', userData.email);
            }
          } catch (emailError) {
            console.error('Email sending failed for', userData.email, emailError);
          }

          results.push({ 
            email: userData.email, 
            success: true, 
            userId: authData.user.id,
            password: userData.password,
            fullName: userData.fullName
          });
        }
      } catch (error) {
        console.error('Error processing user', userData.email, error);
        results.push({ email: userData.email, success: false, error: error.message });
      }
    }

    console.log(`Bulk creation complete: ${successCount}/${users.length} users created, ${emailSuccessCount} emails sent`);

    return new Response(JSON.stringify({ 
      results,
      summary: {
        total: users.length,
        success: successCount,
        emailsSent: emailSuccessCount
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in bulk-create-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
