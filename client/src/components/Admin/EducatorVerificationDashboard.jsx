// components/Admin/EducatorVerificationDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  User, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Eye,
  Mail,
  Calendar,
  Code,
  Globe,
  XCircle,
  Clock,
  RefreshCw,
  Award,
  Star,
  TrendingUp,
  FileText,
  Shield,
  AlertCircle,
  Download,
  Users,
  BarChart3
} from 'lucide-react';

const EducatorVerificationDashboard = () => {
  const { backendUrl } = useContext(AppContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [approvingId, setApprovingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusText = {
    pending: 'Pending Review',
    approved: 'Approved Educator',
    rejected: 'Rejected'
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    approved: <CheckCircle className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />
  };

  useEffect(() => {
    fetchApplications();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/admin/getAllEducatorApplications`, {
           withCredentials:true
      });
      
      if (response.data.success) {
        let filteredApps = response.data.applications || [];
        
        // Apply status filter
        if (statusFilter !== 'all') {
          filteredApps = filteredApps.filter(app => {
            if (statusFilter === 'pending') return app.isApproved === false;
            if (statusFilter === 'approved') return app.isApproved === true;
            return true;
          });
        }
        
        // Apply search filter
        if (searchTerm) {
          filteredApps = filteredApps.filter(app => 
            app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.languages?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.bio?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setApplications(filteredApps);
        setTotalPages(Math.ceil(filteredApps.length / 8));
        
        // Calculate stats
        const total = filteredApps.length;
        const pending = filteredApps.filter(a => a.isApproved === false).length;
        const approved = filteredApps.filter(a => a.isApproved === true).length;
        const rejected = 0; // You might want to add a rejected field
        
        setStats({
          total,
          pending,
          approved,
          rejected,
          approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
        });
      } else {
        toast.error('Failed to fetch applications');
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (educatorId) => {
    try {
      setApprovingId(educatorId);
      const response = await axios.post(
        `${backendUrl}/api/admin/approveEducator`,
        { educatorId },
        {  withCredentials:true }
      );
      
      if (response.data.success) {
        toast.success('🎉 Educator approved successfully!');
        // Update local state
        setApplications(prev => prev.map(app => 
          app._id === educatorId ? { ...app, isApproved: true } : app
        ));
        
        if (selectedApp?._id === educatorId) {
          setSelectedApp({...selectedApp, isApproved: true});
        }
        
        // Refresh stats
        fetchApplications();
      } else {
        toast.error(response.data.message || 'Failed to approve');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve educator');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (educatorId) => {
    // Implement reject functionality if needed
    toast.info('Reject functionality coming soon...');
  };

  const openInNewTab = (url) => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getApplicationStatus = (app) => {
    if (app.isApproved === true) return 'approved';
    if (app.isApproved === false) return 'pending';
    return 'pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const paginatedApplications = applications.slice(
    (currentPage - 1) * 8,
    currentPage * 8
  );

  const exportApplications = () => {
    const data = applications.map(app => ({
      Name: app.fullName,
      Email: app.email || 'N/A',
      Status: getApplicationStatus(app),
      Tagline: app.tagline,
      Technologies: app.languages,
      Applied_Date: formatDate(app.createdAt),
      GitHub: app.github,
      Bio: app.bio
    }));
    
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `educator-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Educator Verification</h1>
              </div>
              <p className="text-gray-600 max-w-2xl">
                Review and approve programming instructors for the platform. Ensure quality educators with proper qualifications.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportApplications}
                disabled={applications.length === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center disabled:opacity-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={fetchApplications}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center shadow-sm hover:shadow"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                  <p className="text-xs text-yellow-600 mt-1">Requires attention</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved Educators</p>
                  <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                  <p className="text-xs text-green-600 mt-1">Active on platform</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approval Rate</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.approvalRate}%</p>
                  <p className="text-xs text-purple-600 mt-1">Quality metric</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Applications List */}
          <div className="lg:col-span-2">
            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'All Applications', icon: <Filter className="w-4 h-4" /> },
                    { id: 'pending', label: 'Pending Review', icon: <Clock className="w-4 h-4" /> },
                    { id: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> }
                  ].map((status) => (
                    <button
                      key={status.id}
                      onClick={() => {
                        setStatusFilter(status.id);
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                        statusFilter === status.id
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.icon}
                      <span className="ml-2">{status.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search educators by name, tech, or bio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full md:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Applications List</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {paginatedApplications.length} of {applications.length} applications
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                      <option>Newest First</option>
                      <option>Oldest First</option>
                      <option>Name A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Loading educator applications...</p>
                </div>
              ) : paginatedApplications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No applications match your search criteria. Try adjusting your filters.'
                      : 'No educator applications have been submitted yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {paginatedApplications.map((app, index) => {
                    const status = getApplicationStatus(app);
                    return (
                      <div
                        key={app._id}
                        className={`p-5 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                          selectedApp?._id === app._id 
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500' 
                            : 'hover:border-l-4 hover:border-blue-200'
                        }`}
                        onClick={() => setSelectedApp(app)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="relative">
                              <img
                                src={app.profileImage}
                                alt={app.fullName}
                                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.fullName)}&background=random&size=64`;
                                }}
                              />
                              {status === 'approved' && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-gray-900 text-lg truncate">{app.fullName}</h3>
                                  <p className="text-gray-600 text-sm truncate max-w-md">{app.tagline}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center ${statusColors[status]}`}>
                                    {statusIcons[status]}
                                    <span className="ml-1.5">{statusText[status]}</span>
                                  </span>
                                  <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Code className="w-4 h-4 mr-2 text-blue-500" />
                                  <span className="truncate">{app.languages || 'Not specified'}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                                  <span>{formatDate(app.createdAt)}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                                  <span>{formatTimeAgo(app.createdAt)}</span>
                                </div>
                              </div>
                              
                              {app.bio && (
                                <p className="text-gray-700 text-sm mt-3 line-clamp-2">
                                  {app.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {paginatedApplications.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {applications.length} total
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Application Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6 overflow-hidden">
              {selectedApp ? (
                <>
                  <div className="relative">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Application Details</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          statusColors[getApplicationStatus(selectedApp)]
                        }`}>
                          {statusText[getApplicationStatus(selectedApp)]}
                        </span>
                      </div>
                    </div>

                    {/* Profile Section */}
                    <div className="px-6 pb-6 pt-8 -mt-4">
                      <div className="relative">
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                          <div className="relative">
                            <img
                              src={selectedApp.profileImage}
                              alt={selectedApp.fullName}
                              className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-xl"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApp.fullName)}&background=random&size=112`;
                              }}
                            />
                            {getApplicationStatus(selectedApp) === 'approved' && (
                              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center mt-14">
                        <h3 className="text-xl font-bold text-gray-900">{selectedApp.fullName}</h3>
                        <p className="text-gray-600 mt-1">{selectedApp.tagline}</p>
                        {selectedApp.email && (
                          <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                            <Mail className="w-4 h-4 mr-1" />
                            {selectedApp.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Details Sections */}
                    <div className="px-6 space-y-6">
                      {/* Bio Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-blue-500" />
                            Bio & Experience
                          </h4>
                          <span className="text-xs text-gray-500">Required</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {selectedApp.bio || 'No bio provided'}
                          </p>
                        </div>
                      </div>

                      {/* Technologies */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <Code className="w-4 h-4 mr-2 text-green-500" />
                          Technical Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedApp.languages?.split(',').map((tech, index) => (
                            <span
                              key={index}
                              className="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg text-sm font-medium border border-green-100 flex items-center"
                            >
                              <Star className="w-3 h-3 mr-2 text-green-500" />
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* GitHub Link */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-purple-500" />
                          GitHub Profile
                        </h4>
                        {selectedApp.github ? (
                          <button
                            onClick={() => openInNewTab(selectedApp.github)}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-black font-bold text-xl">G</span>
                              </div>
                              <div className="text-left">
                                <span className="font-semibold">GitHub Profile</span>
                                <p className="text-xs text-gray-300 truncate max-w-[140px]">
                                  {selectedApp.github.replace('https://github.com/', '')}
                                </p>
                              </div>
                            </div>
                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                          </button>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl text-center">
                            <p className="text-gray-600">No GitHub link provided</p>
                          </div>
                        )}
                      </div>

                      {/* Application Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium mb-1">Applied On</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(selectedApp.createdAt)}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-xl border border-purple-100">
                          <p className="text-xs text-purple-600 font-medium mb-1">User ID</p>
                          <p className="font-mono text-sm font-semibold text-gray-900 truncate" title={selectedApp.userId}>
                            {selectedApp.userId?.substring(0, 8)}...
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-6 border-t border-gray-200">
                        {getApplicationStatus(selectedApp) === 'pending' && (
                          <div className="space-y-3">
                            <button
                              onClick={() => handleApprove(selectedApp._id)}
                              disabled={approvingId === selectedApp._id}
                              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              {approvingId === selectedApp._id ? (
                                <span className="flex items-center justify-center">
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                  Approving...
                                </span>
                              ) : (
                                <span className="flex items-center justify-center">
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  Approve Educator
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(selectedApp._id)}
                              className="w-full py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject Application
                            </button>
                          </div>
                        )}

                        {getApplicationStatus(selectedApp) === 'approved' && (
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                              <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg mr-3">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-green-800 font-medium">Educator Approved</p>
                                  <p className="text-green-700 text-sm mt-1">
                                    Can create and publish courses
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setSelectedApp({...selectedApp, isApproved: false})}
                                className="py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                              >
                                Mark Pending
                              </button>
                              <button className="py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                View Profile
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Application</h3>
                  <p className="text-gray-600 text-sm">
                    Choose an application from the list to view complete details and take action
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducatorVerificationDashboard;