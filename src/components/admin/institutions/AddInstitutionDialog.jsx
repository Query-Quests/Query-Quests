"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building, Loader2 } from "lucide-react";

/**
 * AddInstitutionDialog - Dialog for creating new institutions
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onOpenChange - Callback when open state changes
 * @param {function} props.onSave - Callback when institution is saved
 */
export default function AddInstitutionDialog({ open, onOpenChange, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    studentEmailSuffix: "",
    teacherEmailSuffix: "",
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Institution name is required";
    }

    if (!formData.studentEmailSuffix.trim()) {
      newErrors.studentEmailSuffix = "Student email suffix is required";
    } else if (!formData.studentEmailSuffix.startsWith("@")) {
      newErrors.studentEmailSuffix = "Email suffix must start with @";
    }

    if (!formData.teacherEmailSuffix.trim()) {
      newErrors.teacherEmailSuffix = "Teacher email suffix is required";
    } else if (!formData.teacherEmailSuffix.startsWith("@")) {
      newErrors.teacherEmailSuffix = "Email suffix must start with @";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      // Reset form on success
      setFormData({
        name: "",
        address: "",
        studentEmailSuffix: "",
        teacherEmailSuffix: "",
      });
      setErrors({});
    } catch (error) {
      console.error("Error creating institution:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: "",
        address: "",
        studentEmailSuffix: "",
        teacherEmailSuffix: "",
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add Institution</DialogTitle>
              <DialogDescription>
                Create a new educational institution
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            {/* Institution Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Institution Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter institution name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address (optional)"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Email Suffixes */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studentEmailSuffix">
                  Student Email Suffix <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentEmailSuffix"
                  placeholder="@students.edu"
                  value={formData.studentEmailSuffix}
                  onChange={(e) => handleChange("studentEmailSuffix", e.target.value)}
                  className={errors.studentEmailSuffix ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.studentEmailSuffix && (
                  <p className="text-sm text-destructive">{errors.studentEmailSuffix}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherEmailSuffix">
                  Teacher Email Suffix <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teacherEmailSuffix"
                  placeholder="@edu"
                  value={formData.teacherEmailSuffix}
                  onChange={(e) => handleChange("teacherEmailSuffix", e.target.value)}
                  className={errors.teacherEmailSuffix ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {errors.teacherEmailSuffix && (
                  <p className="text-sm text-destructive">{errors.teacherEmailSuffix}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Institution"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
