"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react";

export default function ContactRequestsPage() {
  const [contactRequests, setContactRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchContactRequests();
  }, []);

  const fetchContactRequests = async () => {
    try {
      const response = await fetch('/api/contact-requests');
      const data = await response.json();
      setContactRequests(data);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      const response = await fetch('/api/contact-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        await fetchContactRequests(); // Refresh the list
        setShowModal(false);
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Contact Requests</h1>
        <p className="text-muted-foreground text-sm lg:text-base">
          Review and manage institution access requests
        </p>
      </div>

      {contactRequests.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Requests</h3>
          <p className="text-sm text-gray-600">There are no pending institution access requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contactRequests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              {/* Compact Single Row */}
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-medium truncate">{request.institutionName}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {request.contactEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {request.estimatedStudents || 'N/A'} students
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-80 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>

                  {request.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
                  <Building className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">{selectedRequest.institutionName}</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Contact Request Details
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="flex-shrink-0">
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Contact Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900">{selectedRequest.contactName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-900 break-all">{selectedRequest.contactEmail}</span>
                    </div>
                    {selectedRequest.contactPhone && (
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-900">{selectedRequest.contactPhone}</span>
                      </div>
                    )}
                    {selectedRequest.website && (
                      <div className="flex items-start gap-2">
                        <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                          {selectedRequest.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Institution Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Student Email Suffix:</span>
                      <div className="text-sm text-gray-600 mt-1">{selectedRequest.studentEmailSuffix}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Teacher Email Suffix:</span>
                      <div className="text-sm text-gray-600 mt-1">{selectedRequest.teacherEmailSuffix}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Estimated Students:</span>
                      <div className="text-sm text-gray-600 mt-1">{selectedRequest.estimatedStudents || 'Not specified'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 text-sm">Estimated Teachers:</span>
                      <div className="text-sm text-gray-600 mt-1">{selectedRequest.estimatedTeachers || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.message && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Additional Information</h4>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-md text-sm">
                    {selectedRequest.message}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
                <div className="text-xs sm:text-sm text-gray-600">
                  Requested on {formatDate(selectedRequest.created_at)}
                </div>
                {selectedRequest.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Institution
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                      className="w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Request
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 