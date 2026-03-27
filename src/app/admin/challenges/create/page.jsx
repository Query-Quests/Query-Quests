"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { CreateChallengeForm } from "@/components/challenges";

export default function CreateChallenge() {
  const router = useRouter();
  const { user } = useUserRole();
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch("/api/institutions");
      if (response.ok) {
        const institutionsData = await response.json();
        setInstitutions(institutionsData);
      }
    } catch (error) {
      console.error("Error fetching institutions:", error);
      toast.error("Failed to load institutions");
    }
  };

  const handleSubmit = async (challengeData) => {
    // Get current user from localStorage
    const userData = localStorage.getItem("user");
    if (!userData) {
      toast.error("User not authenticated");
      return;
    }

    let currentUser;
    try {
      currentUser = JSON.parse(userData);
    } catch (error) {
      toast.error("Invalid user session");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...challengeData,
          creator_id: currentUser.id,
        }),
      });

      if (response.ok) {
        toast.success("Challenge created successfully!");
        router.push("/admin/challenges");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create challenge");
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Error creating challenge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/challenges");
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Challenge</h1>
          <p className="text-muted-foreground">
            Add a new SQL challenge to the platform
          </p>
        </div>
      </div>

      {/* Form */}
      <CreateChallengeForm
        institutions={institutions}
        user={user}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
