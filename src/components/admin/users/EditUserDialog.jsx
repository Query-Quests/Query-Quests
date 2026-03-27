"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { UserRoleBadge } from "./UserRoleBadge";

/**
 * EditUserDialog - Dialog for editing existing users
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Handler for open state changes
 * @param {Object} props.user - User object to edit
 * @param {Array} props.institutions - List of institutions
 * @param {Object} props.currentUser - Current logged in user
 * @param {Function} props.onSave - Handler for saving changes
 */
export function EditUserDialog({
  open,
  onOpenChange,
  user,
  institutions = [],
  currentUser,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution_id: "none",
    isAdmin: false,
    isTeacher: false,
    isEmailVerified: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user is a teacher (not admin)
  const isTeacherOnly =
    currentUser?.isTeacher && !currentUser?.isAdmin && currentUser?.institution_id;

  // Populate form when user changes
  useEffect(() => {
    if (user && open) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        institution_id: user.institution_id?.toString() || "none",
        isAdmin: user.isAdmin || false,
        isTeacher: user.isTeacher || false,
        isEmailVerified: user.isEmailVerified || false,
      });
      setErrors({});
    }
  }, [user, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...user,
        ...formData,
        institution_id: formData.institution_id === "none" ? null : formData.institution_id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getTeacherInstitutionName = () => {
    if (!currentUser?.institution_id) return "Your Institution";
    const institution = institutions.find(
      (i) => i.id === currentUser.institution_id || i.id === parseInt(currentUser.institution_id)
    );
    return institution?.name || currentUser?.institution?.name || "Your Institution";
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Edit User
            <UserRoleBadge user={user} />
          </DialogTitle>
          <DialogDescription>
            Update user information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* User Info Summary */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter full name"
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Institution Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-institution">Institution</Label>
            {isTeacherOnly ? (
              <div className="px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
                {getTeacherInstitutionName()}
                <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
              </div>
            ) : (
              <Select
                value={formData.institution_id}
                onValueChange={(value) => handleInputChange("institution_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Institution</SelectItem>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id.toString()}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Role & Status */}
          <div className="space-y-4">
            <Label>Role & Status</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(checked) => handleInputChange("isAdmin", checked)}
                />
                <Label htmlFor="edit-isAdmin" className="text-sm font-normal cursor-pointer">
                  Administrator
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isTeacher"
                  checked={formData.isTeacher}
                  onCheckedChange={(checked) => handleInputChange("isTeacher", checked)}
                />
                <Label htmlFor="edit-isTeacher" className="text-sm font-normal cursor-pointer">
                  Teacher
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isEmailVerified"
                  checked={formData.isEmailVerified}
                  onCheckedChange={(checked) => handleInputChange("isEmailVerified", checked)}
                />
                <Label htmlFor="edit-isEmailVerified" className="text-sm font-normal cursor-pointer">
                  Email Verified
                </Label>
              </div>
            </div>
          </div>

          {/* User Stats (read-only) */}
          {(user.solvedChallenges || user.points) && (
            <div className="space-y-2">
              <Label>User Statistics</Label>
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Challenges Solved</p>
                  <p className="text-lg font-semibold">{user.solvedChallenges || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                  <p className="text-lg font-semibold">{user.points || 0}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserDialog;
