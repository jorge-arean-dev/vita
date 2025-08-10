import { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "./profile-form";
import AvatarForm from "./avatar-form";

export const metadata: Metadata = {
  title: "Settings | Vita",
  description: "Manage your profile settings and preferences",
};

export default async function SettingsPage() {
  // Disable caching to ensure fresh user data on each request
  noStore();
  
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Redirect to login if not authenticated
  if (userError || !user) {
    redirect("/auth/login");
  }
  
  // Get user profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  
  return (
    <div className="container max-w-4xl py-10 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} email={user.email || ''} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="avatar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload or change your profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
