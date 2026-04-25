"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Loader2 } from "lucide-react";

/**
 * EditInstitutionDialog - Pencil-styled dialog for editing institutions.
 */
export default function EditInstitutionDialog({
  open,
  onOpenChange,
  institution,
  onSave,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    studentEmailSuffix: "",
    teacherEmailSuffix: "",
  });

  useEffect(() => {
    if (institution) {
      setFormData({
        name: institution.name || "",
        address: institution.address || "",
        studentEmailSuffix: institution.studentEmailSuffix || "",
        teacherEmailSuffix: institution.teacherEmailSuffix || "",
      });
    }
  }, [institution]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Institution name is required";
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
      await onSave({ ...institution, ...formData });
      setErrors({});
    } catch (error) {
      console.error("Error updating institution:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#19aa59]/10">
              <Building2 className="h-5 w-5 text-[#19aa59]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-[16px] font-semibold text-[#030914]">
                Edit institution
              </DialogTitle>
              <DialogDescription className="text-[12px] text-gray-500">
                Update institution details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <Field
            label="Institution name"
            required
            error={errors.name}
          >
            <TextInput
              placeholder="Enter institution name"
              value={formData.name}
              onChange={(v) => handleChange("name", v)}
              disabled={isLoading}
              hasError={!!errors.name}
            />
          </Field>

          <Field label="Address">
            <TextInput
              placeholder="Enter address (optional)"
              value={formData.address}
              onChange={(v) => handleChange("address", v)}
              disabled={isLoading}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Student email suffix"
              required
              error={errors.studentEmailSuffix}
            >
              <TextInput
                placeholder="@students.edu"
                value={formData.studentEmailSuffix}
                onChange={(v) => handleChange("studentEmailSuffix", v)}
                disabled={isLoading}
                hasError={!!errors.studentEmailSuffix}
                mono
              />
            </Field>
            <Field
              label="Teacher email suffix"
              required
              error={errors.teacherEmailSuffix}
            >
              <TextInput
                placeholder="@edu"
                value={formData.teacherEmailSuffix}
                onChange={(v) => handleChange("teacherEmailSuffix", v)}
                disabled={isLoading}
                hasError={!!errors.teacherEmailSuffix}
                mono
              />
            </Field>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 mt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-white border border-gray-200 text-[13px] font-medium text-[#030914] hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-[#19aa59] hover:bg-[#15934d] text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[#030914]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, disabled, hasError, mono }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full h-9 px-3 text-[13px] text-[#030914] placeholder:text-gray-400 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-[#19aa59]/15 disabled:opacity-60 ${
        hasError
          ? "border-red-400 focus:border-red-400"
          : "border-gray-200 focus:border-[#19aa59]"
      } ${mono ? "[font-family:var(--font-geist-mono),monospace]" : ""}`}
    />
  );
}
