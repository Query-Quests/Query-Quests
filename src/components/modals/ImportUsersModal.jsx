import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload } from 'lucide-react';

export default function ImportUsersModal({ institutions, currentUser, onImport, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState("none");

  // Set institution for teachers when currentUser data becomes available
  useEffect(() => {
    if (currentUser && currentUser.isTeacher && !currentUser.isAdmin && currentUser.institution_id) {
      setSelectedInstitution(currentUser.institution_id);
    }
  }, [currentUser]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/users/parse-import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.users);
      } else {
        console.error('Failed to parse file');
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (preview.length > 0) {
      const usersWithInstitution = preview.map(user => ({
        ...user,
        institution_id: selectedInstitution === "none" ? null : parseInt(selectedInstitution)
      }));
      onImport(usersWithInstitution);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Import Users</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Upload File (CSV or XLSX)</Label>
              <div className="mt-2">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: CSV, XLSX. File should contain columns: name, alias (optional), isAdmin (optional), isTeacher (optional)
              </p>
            </div>

            {/* Default Institution */}
            <div className="space-y-2">
              <Label htmlFor="default-institution">Default Institution (for all imported users)</Label>
              {currentUser && currentUser.isTeacher && !currentUser.isAdmin && currentUser.institution_id ? (
                // Teachers see only their institution (read-only)
                <div className="px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm">
                  {currentUser.institution?.name || institutions.find(i => i.id === currentUser.institution_id)?.name || 'Your Institution'}
                  <span className="ml-2 text-xs text-muted-foreground">(Your Institution)</span>
                </div>
              ) : (
                // Admins can select any institution
                <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default institution" />
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
          </div>

          {/* Preview */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Processing file...</p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Preview ({preview.length} users)</h3>
                <Badge variant="secondary">{preview.length} users ready to import</Badge>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Alias</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Institution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 10).map((user, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.alias || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? "destructive" : user.isTeacher ? "default" : "secondary"}>
                            {user.isAdmin ? "Admin" : user.isTeacher ? "Teacher" : "Student"}
                          </Badge>
                        </TableCell>
                        <TableCell>{selectedInstitution === "none" ? "None" : institutions.find(i => i.id.toString() === selectedInstitution)?.name || "None"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.length > 10 && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    ... and {preview.length - 10} more users
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button 
              onClick={handleImport} 
              disabled={preview.length === 0 || isProcessing}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import {preview.length} Users
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 