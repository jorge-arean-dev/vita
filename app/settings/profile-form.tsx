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
    // Add other profile fields as needed
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
    } catch (error) {
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
        <p className="text-sm text-muted-foreground mt-1">This is how we'll address you in the application.</p>
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
      
      {/* You can add more profile fields here as needed */}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
