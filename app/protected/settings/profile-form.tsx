"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ProfileFormProps {
  profile: {
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    role: string | null;
  } | null;
  email: string;
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    
    try {
      const result = await updateProfile(formData);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your profile has been updated.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="first_name">First Name</Label>
        <Input
          id="first_name"
          name="first_name"
          defaultValue={profile?.first_name || ""}
          placeholder="Enter your first name"
        />
        <p className="text-sm text-muted-foreground mt-1">This is how we&apos;ll address you in the application.</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="last_name">Last Name</Label>
        <Input
          id="last_name"
          name="last_name"
          defaultValue={profile?.last_name || ""}
          placeholder="Enter your last name"
        />
        <p className="text-sm text-muted-foreground mt-1">Your family name or surname.</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          value={email}
          readOnly
          disabled
        />
        <p className="text-sm text-muted-foreground mt-1">Your email address is used for notifications and sign-in.</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          name="company"
          defaultValue={profile?.company || ""}
          placeholder="Enter your company name"
        />
        <p className="text-sm text-muted-foreground mt-1">The organization you work for.</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          name="role"
          defaultValue={profile?.role || ""}
          placeholder="e.g., Senior Recruiter, Talent Acquisition Manager"
        />
        <p className="text-sm text-muted-foreground mt-1">Your current position in recruiting or talent acquisition.</p>
      </div>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
