import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EditUserModal({ user, institutions, currentUser, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    institution_id: user.institution_id?.toString() || "none",
    isAdmin: user.isAdmin || false,
    isTeacher: user.isTeacher || false,
    isEmailVerified: user.isEmailVerified || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...user,
      ...formData,
      institution_id: formData.institution_id === "none" ? null : formData.institution_id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            {currentUser && currentUser.isTeacher && !currentUser.isAdmin && currentUser.institution_id ? (
              // Teachers see only their institution (read-only)
              <div className="px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
                {currentUser.institution?.name || institutions.find(i => i.id === currentUser.institution_id)?.name || 'Your Institution'}
                <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
              </div>
            ) : (
              // Admins can select any institution
              <Select
                value={formData.institution_id}
                onValueChange={(value) => setFormData({ ...formData, institution_id: value })}
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
          
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                />
                <span>Admin</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isTeacher}
                  onChange={(e) => setFormData({ ...formData, isTeacher: e.target.checked })}
                />
                <span>Teacher</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isEmailVerified}
                  onChange={(e) => setFormData({ ...formData, isEmailVerified: e.target.checked })}
                />
                <span>Email Verified</span>
              </label>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button type="submit" className="flex-1">Save Changes</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 