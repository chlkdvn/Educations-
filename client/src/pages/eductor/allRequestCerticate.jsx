import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FiFileText,
  FiUsers,
  FiCalendar,
  FiX,
  FiFilter,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiPhone,
  FiUser,
  FiBook,
  FiHash
} from 'react-icons/fi';

const CertificateRequests = () => {
  const { getToken, isEducactor, backendUrl } = useContext(AppContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCertificateRequests = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/getMyCertificateRequests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
      toast.error('Failed to load certificate requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEducactor) {
      fetchCertificateRequests();
    }
  }, [isEducactor]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      rejected: {
        color: 'bg-red-100 text-red-800 border border-red-200',
        icon: <FiX className="w-4 h-4" />,
        text: 'Rejected'
      },
      issued: {
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
        icon: <FiFileText className="w-4 h-4" />,
        text: 'Issued'
      }
    };
    
    const config = statusConfig[status] || {
      color: 'bg-gray-100 text-gray-800 border border-gray-200',
      icon: <FiFileText className="w-4 h-4" />,
      text: status.charAt(0).toUpperCase() + status.slice(1)
    };

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.studentPhone?.includes(searchTerm);
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Certificate Requests</h1>
              <p className="text-gray-600 mt-1">
                View all certificate requests from your students
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards - Only Total Requests and Students */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{requests.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FiFileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Students</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {new Set(requests.map(r => r.studentId)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <FiUsers className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search (no status filter anymore) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by student name, course, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={fetchCertificateRequests}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {paginatedRequests.length > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Certificate Requests ({filteredRequests.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {paginatedRequests.map((request) => (
                  <div key={request.requestId} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Student Info */}
                      <div className="lg:w-2/5">
                        <div className="flex items-start gap-4">
                          <img
                            src={request.studentImage}
                            alt={request.studentName}
                            className="w-16 h-16 rounded-full border-2 border-gray-100"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${request.studentName || 'Student'}&background=random`;
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FiUser className="w-4 h-4 text-gray-400" />
                              <h3 className="font-semibold text-gray-900 text-lg">{request.studentName}</h3>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FiMail className="w-3 h-3" />
                                <span>{request.studentEmail}</span>
                              </div>
                              
                              {request.studentPhone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <FiPhone className="w-3 h-3" />
                                  <span>{request.studentPhone}</span>
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500 mt-3">
                                Student ID: <span className="font-mono">{request.studentId.substring(0, 10)}...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Course Info */}
                      <div className="lg:w-2/5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FiBook className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Course Details</h4>
                            <p className="text-gray-900 font-medium">{request.courseTitle}</p>
                            
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FiHash className="w-3 h-3" />
                                <span>Course ID: <span className="font-mono">{request.courseId}</span></span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FiHash className="w-3 h-3" />
                                <span>Request ID: <span className="font-mono">{request.requestId}</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="lg:w-1/5">
                        <div className="flex flex-col items-start lg:items-end gap-3">
                          <div>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FiCalendar className="w-3 h-3" />
                            <span>Requested recently</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredRequests.length}</span> requests
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <FiChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FiFileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm 
                  ? 'No matching requests found' 
                  : 'No certificate requests yet'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Students will appear here when they request certificates for your courses'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Information Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FiFileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Note:</span> This page shows all certificate requests from your students. 
                You can see who requested certificates and for which courses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateRequests;