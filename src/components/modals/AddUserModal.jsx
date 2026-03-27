import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import InstitutionModal from './InstitutionModal';

export default function AddUserModal({ institutions, currentUser, onSave, onClose, onInstitutionAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    institution_id: "none",
    institutionSearch: "",
    showInstitutionDropdown: false,
    showAddInstitutionModal: false,
    isAdmin: false,
    isTeacher: false,
    isEmailVerified: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set institution for teachers when currentUser data becomes available
  useEffect(() => {
    if (currentUser && currentUser.isTeacher && !currentUser.isAdmin && currentUser.institution_id) {
      setFormData(prev => ({
        ...prev,
        institution_id: currentUser.institution_id,
        institutionSearch: currentUser.institution?.name || institutions.find(i => i.id === currentUser.institution_id)?.name || 'Your Institution'
      }));
    }
  }, [currentUser, institutions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formData.showInstitutionDropdown) {
        const dropdown = document.getElementById('institution-dropdown');
        const input = document.getElementById('institution');
        if (dropdown && !dropdown.contains(event.target) && !input?.contains(event.target)) {
          setFormData(prev => ({ ...prev, showInstitutionDropdown: false }));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [formData.showInstitutionDropdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave({
        ...formData,
        institution_id: formData.institution_id === "none" ? null : formData.institution_id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInstitution = async (institutionData) => {
    try {
      const response = await fetch("/api/institutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(institutionData),
      });

      if (response.ok) {
        const newInstitution = await response.json();
        // Update the institutions list in the parent component
        // We'll need to pass a callback to refresh institutions
        if (onInstitutionAdded) {
          onInstitutionAdded(newInstitution);
        }
        // Set the newly created institution as selected
        setFormData({
          ...formData,
          institution_id: newInstitution.id.toString(),
          institutionSearch: newInstitution.name,
          showAddInstitutionModal: false,
        });
      }
    } catch (error) {
      console.error("Error creating institution:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold">Add New User</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two-column layout for desktop, single column for mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter password"
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <div className="relative">
                  {formData.institution_id !== "none" && formData.institutionSearch && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                    </div>
                  )}
                  {formData.institutionSearch && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          institutionSearch: "",
                          institution_id: "none",
                          showInstitutionDropdown: false 
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {currentUser && currentUser.isTeacher && !currentUser.isAdmin && currentUser.institution_id ? (
                    // Teachers see only their institution (read-only)
                    <div className="px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
                      {formData.institutionSearch || 'Your Institution'}
                      <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
                    </div>
                  ) : (
                    // Admins can search and select any institution
                    <Input
                      id="institution"
                      placeholder="Search institutions..."
                      value={formData.institutionSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ 
                          ...formData, 
                          institutionSearch: value,
                          institution_id: value === "" ? "none" : formData.institution_id,
                          showInstitutionDropdown: true 
                        });
                      }}
                      onFocus={() => setFormData({ ...formData, showInstitutionDropdown: true })}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setFormData(prev => ({ ...prev, showInstitutionDropdown: false }));
                        }
                      }}
                      className={formData.institutionSearch ? "pr-16" : ""}
                    />
                  )}
                  {formData.showInstitutionDropdown && !(currentUser && currentUser.isTeacher && !currentUser.isAdmin && currentUser.institution_id) && (
                    <div id="institution-dropdown" className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {/* Add New Institution Button */}
                      <div 
                        className="px-3 py-2 text-sm text-blue-600 cursor-pointer hover:bg-blue-50 border-b border-gray-100 flex items-center gap-2"
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            showInstitutionDropdown: false,
                            showAddInstitutionModal: true 
                          });
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Add New Institution
                      </div>
                      
                      <div 
                        className="px-3 py-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setFormData({ 
                            ...formData, 
                            institution_id: "none", 
                            institutionSearch: "No Institution",
                            showInstitutionDropdown: false 
                          });
                        }}
                      >
                        No Institution
                      </div>
                      {institutions
                        .filter(institution => 
                          institution.name.toLowerCase().includes(formData.institutionSearch?.toLowerCase() || '')
                        )
                        .map((institution) => (
                          <div
                            key={institution.id}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              setFormData({ 
                                ...formData, 
                                institution_id: institution.id.toString(), 
                                institutionSearch: institution.name,
                                showInstitutionDropdown: false 
                              });
                            }}
                          >
                            {institution.name}
                          </div>
                        ))}
                      {institutions.filter(institution => 
                        institution.name.toLowerCase().includes(formData.institutionSearch?.toLowerCase() || '')
                      ).length === 0 && formData.institutionSearch && (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No institutions found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Role & Status</Label>
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
                <p className="text-xs text-muted-foreground">
                  If neither role is selected, the user will be a student
                </p>
              </div>
            </div>
          </div>
          
          {/* Buttons - Full width at bottom */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Add Institution Modal */}
      {formData.showAddInstitutionModal && (
        <InstitutionModal
          onSave={handleAddInstitution}
          onClose={() => setFormData({ ...formData, showAddInstitutionModal: false })}
        />
      )}
    </div>
  );
} 