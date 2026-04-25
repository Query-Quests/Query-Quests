"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, File, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function UploadDatabaseDialog({
  open,
  onOpenChange,
  institutions,
  currentUser,
  onSuccess,
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    institution_id: "",
    file: null,
  });

  const [errors, setErrors] = useState({});

  const isTeacher = currentUser?.isTeacher && !currentUser?.isAdmin;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith(".sql")) {
      setErrors({ ...errors, file: "Only .sql files are allowed" });
      return;
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors({ ...errors, file: "File size exceeds 500MB limit" });
      return;
    }

    setFormData({ ...formData, file });
    setErrors({ ...errors, file: null });

    // Auto-fill name if empty
    if (!formData.name) {
      const name = file.name.replace(/\.sql$/i, "").replace(/[_-]/g, " ");
      setFormData((prev) => ({ ...prev, file, name }));
    }
  };

  const removeFile = () => {
    setFormData({ ...formData, file: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.file) {
      newErrors.file = "Please select a SQL file";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("file", formData.file);
      uploadData.append("name", formData.name);
      uploadData.append("description", formData.description);
      uploadData.append("creator_id", currentUser.id);

      if (isTeacher && currentUser.institution_id) {
        uploadData.append("institution_id", currentUser.institution_id);
      } else if (formData.institution_id && formData.institution_id !== "none") {
        uploadData.append("institution_id", formData.institution_id);
      }

      const response = await fetch("/api/databases/upload", {
        method: "POST",
        body: uploadData,
      });

      if (response.ok) {
        onSuccess();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading database");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      institution_id: "",
      file: null,
    });
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const labelCls = "text-[12px] font-bold text-[#030914] uppercase tracking-[0.4px]";
  const fieldCls =
    "w-full h-10 px-3 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-xl border-gray-200 bg-white p-6 gap-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[20px] font-bold text-[#030914] tracking-[-0.3px]">
            Upload SQL dump
          </DialogTitle>
          <DialogDescription className="text-[13px] text-gray-500 leading-[1.5]">
            Upload a .sql file to create a new sandbox database. The file will
            be processed and made available for challenges.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* File Upload */}
          <div className="flex flex-col gap-1.5">
            <Label className={labelCls}>SQL file</Label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-[#19aa59] bg-[#19aa59]/5"
                  : errors.file
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 hover:border-[#19aa59]/50 hover:bg-gray-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".sql"
                onChange={handleFileInput}
                className="hidden"
              />

              {formData.file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#030914] flex items-center justify-center shrink-0">
                    <File className="h-5 w-5 text-[#19aa59]" />
                  </div>
                  <div className="text-left min-w-0">
                    <p
                      className="text-sm font-semibold text-[#030914] truncate"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    >
                      {formData.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(formData.file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="ml-2 inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-gray-500" />
                  </div>
                  <p className="text-sm text-[#030914] font-semibold">
                    Drop your SQL file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">Max file size: 500MB</p>
                </div>
              )}
            </div>
            {errors.file && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className={labelCls}>
              Database name
            </Label>
            <input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., company_sales"
              className={fieldCls}
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description" className={labelCls}>
              Description (optional)
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the database contents and purpose…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#19aa59] focus:ring-2 focus:ring-[#19aa59]/20 resize-y"
            />
          </div>

          {/* Institution */}
          {!isTeacher && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="institution" className={labelCls}>
                Institution (optional)
              </Label>
              <Select
                value={formData.institution_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, institution_id: value })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border-gray-200 bg-white text-sm">
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No institution (global)</SelectItem>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-[#030914] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-[#19aa59] hover:bg-[#15934d] text-white text-[13px] font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload database
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
