import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AvatarForm from "@/app/settings/avatar-form";
import ProfileForm from "@/app/settings/profile-form";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile to get avatar_url and other profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and profile information.
        </p>
      </div>
      <Separator />
      <div className="grid gap-6">
        <AvatarForm profile={profile} />
        <ProfileForm profile={profile} email={user?.email || ''} />
      </div>
    </div>
  );
}
