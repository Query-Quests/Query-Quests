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
import { Plus, Loader2 } from "lucide-react";

/**
 * AddUserDialog - Dialog for creating new users
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onOpenChange - Handler for open state changes
 * @param {Array} props.institutions - List of institutions
 * @param {Object} props.currentUser - Current logged in user
 * @param {Function} props.onSave - Handler for saving new user
 * @param {Function} props.onAddInstitution - Handler for adding a new institution
 */
export function AddUserDialog({
  open,
  onOpenChange,
  institutions = [],
  currentUser,
  onSave,
  onAddInstitution,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    institution_id: "none",
    isAdmin: false,
    isTeacher: false,
    isEmailVerified: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is a teacher (not admin)
  const isTeacherOnly =
    currentUser?.isTeacher && !currentUser?.isAdmin && currentUser?.institution_id;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        email: "",
        password: "",
        institution_id: isTeacherOnly ? currentUser.institution_id.toString() : "none",
        isAdmin: false,
        isTeacher: false,
        isEmailVerified: false,
      });
      setErrors({});
    }
  }, [open, isTeacherOnly, currentUser?.institution_id]);

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

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
        ...formData,
        institution_id: formData.institution_id === "none" ? null : formData.institution_id,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating user:", error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="add-name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-name"
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
            <Label htmlFor="add-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-email"
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="add-password">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Enter password (min. 6 characters)"
              className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Institution Field */}
          <div className="space-y-2">
            <Label htmlFor="add-institution">Institution</Label>
            {isTeacherOnly ? (
              <div className="px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
                {getTeacherInstitutionName()}
                <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={formData.institution_id}
                  onValueChange={(value) => handleInputChange("institution_id", value)}
                >
                  <SelectTrigger className="flex-1">
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
                {onAddInstitution && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onAddInstitution}
                    title="Add new institution"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Role & Status */}
          <div className="space-y-4">
            <Label>Role & Status</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="add-isAdmin"
                  checked={formData.isAdmin}
                  onCheckedChange={(checked) => handleInputChange("isAdmin", checked)}
                />
                <Label htmlFor="add-isAdmin" className="text-sm font-normal cursor-pointer">
                  Administrator
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="add-isTeacher"
                  checked={formData.isTeacher}
                  onCheckedChange={(checked) => handleInputChange("isTeacher", checked)}
                />
                <Label htmlFor="add-isTeacher" className="text-sm font-normal cursor-pointer">
                  Teacher
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="add-isEmailVerified"
                  checked={formData.isEmailVerified}
                  onCheckedChange={(checked) => handleInputChange("isEmailVerified", checked)}
                />
                <Label htmlFor="add-isEmailVerified" className="text-sm font-normal cursor-pointer">
                  Email Verified
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              If neither Admin nor Teacher is selected, the user will be a student.
            </p>
          </div>

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
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddUserDialog;
