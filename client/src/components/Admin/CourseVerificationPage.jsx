// admin/pages/CourseVerificationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Loader2,
  Search,
  Filter,
  FileText,
  User,
  Calendar,
  DollarSign,
  Star,
  Download,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  Volume2,
  VolumeX,
  File,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Video,
  Users as UsersIcon,
  Award,
  Book,
  FileVideo,
  FileAudio,
  FileImage,
  FileArchive,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import {
  getCoursesForVerification,
  getVerificationStats,
  approveCourse,
  rejectCourse,
  getCourseDetailsForVerification,
  downloadResource,
  openSocialLink,
  formatCurrency,
  formatDate,
  formatDuration
} from '../../utitle/api';

const CourseVerificationPage = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [videoStates, setVideoStates] = useState({});
  const videoRefs = useRef({});
  const modalRef = useRef(null);

  useEffect(() => {
    loadCourses();
    loadStats();
  }, [filterStatus, pagination.page, searchTerm]);

  useEffect(() => {
    if (selectedCourseDetails && modalRef.current) {
      modalRef.current.scrollTop = 0;
      if (selectedCourseDetails.courseContent) {
        const chapterIds = selectedCourseDetails.courseContent.map(chapter => chapter.chapterId);
        setExpandedChapters(new Set(chapterIds));
      }
    }
  }, [selectedCourseDetails]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const result = await getCoursesForVerification({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit
      });

      if (result.success) {
        setCourses(result.courses || []);
        setPagination(result.pagination || pagination);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getVerificationStats();
      if (result.success) {
        setStats(result.stats || stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCourseDetails = async (courseId) => {
    try {
      const result = await getCourseDetailsForVerification(courseId);
      if (result.success) {
        setSelectedCourseDetails(result.course);
        const states = {};
        result.course.courseContent?.forEach(chapter => {
          chapter.chapterContent?.forEach(lecture => {
            if (lecture.lectureUrl) {
              states[lecture.lectureId] = {
                playing: false,
                currentTime: 0,
                duration: 0,
                volume: 1,
                muted: false
              };
            }
          });
        });
        setVideoStates(states);
      }
    } catch (error) {
      console.error('Error loading course details:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    loadCourses();
  };

  const handleApproveClick = (course) => {
    setSelectedCourse(course);
    setApproveNotes('');
    setShowApproveModal(true);
  };

  const handleRejectClick = (course) => {
    setSelectedCourse(course);
    setRejectReason('');
    setRejectNotes('');
    setShowRejectModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedCourse) return;

    const result = await approveCourse(selectedCourse._id, approveNotes);

    if (result.success) {
      setShowApproveModal(false);
      setSelectedCourse(null);
      setApproveNotes('');
      loadCourses();
      loadStats();
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedCourse || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    const result = await rejectCourse(selectedCourse._id, rejectReason, rejectNotes);

    if (result.success) {
      setShowRejectModal(false);
      setSelectedCourse(null);
      setRejectReason('');
      setRejectNotes('');
      loadCourses();
      loadStats();
    }
  };

  const handlePlayVideo = (lectureId) => {
    setVideoStates(prev => ({
      ...prev,
      [lectureId]: { ...prev[lectureId], playing: true }
    }));

    const videoElement = videoRefs.current[lectureId];
    if (videoElement) videoElement.play().catch(console.error);
  };

  const handlePauseVideo = (lectureId) => {
    setVideoStates(prev => ({
      ...prev,
      [lectureId]: { ...prev[lectureId], playing: false }
    }));

    const videoElement = videoRefs.current[lectureId];
    if (videoElement) videoElement.pause();
  };

  const handleVideoTimeUpdate = (lectureId, event) => {
    const video = event.target;
    setVideoStates(prev => ({
      ...prev,
      [lectureId]: {
        ...prev[lectureId],
        currentTime: video.currentTime,
        duration: video.duration || 0
      }
    }));
  };

  const handleSeek = (lectureId, value) => {
    const videoElement = videoRefs.current[lectureId];
    if (videoElement) {
      const time = (value / 100) * videoElement.duration;
      videoElement.currentTime = time;
      setVideoStates(prev => ({
        ...prev,
        [lectureId]: { ...prev[lectureId], currentTime: time }
      }));
    }
  };

  const handleVolumeChange = (lectureId, value) => {
    const videoElement = videoRefs.current[lectureId];
    if (videoElement) {
      const volume = value / 100;
      videoElement.volume = volume;
      setVideoStates(prev => ({
        ...prev,
        [lectureId]: { ...prev[lectureId], volume, muted: volume === 0 }
      }));
    }
  };

  const toggleMute = (lectureId) => {
    const videoElement = videoRefs.current[lectureId];
    if (videoElement) {
      const muted = !videoElement.muted;
      videoElement.muted = muted;
      setVideoStates(prev => ({
        ...prev,
        [lectureId]: { ...prev[lectureId], muted }
      }));
    }
  };

  const toggleFullscreen = (lectureId) => {
    const videoElement = videoRefs.current[lectureId];
    if (videoElement) {
      if (!document.fullscreenElement) {
        videoElement.requestFullscreen().catch(console.error);
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleDownloadResource = (resource, courseTitle) => {
    const fileName = `${courseTitle.replace(/\s+/g, '_')}_${resource.name}`;
    downloadResource(resource.url, fileName);
  };

  const getFileIcon = (type) => {
    if (type.includes('video')) return <FileVideo className="w-4 h-4" />;
    if (type.includes('audio')) return <FileAudio className="w-4 h-4" />;
    if (type.includes('image')) return <FileImage className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const toggleChapter = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredCourses = courses.filter(course => {
    return (
      searchTerm === '' ||
      course.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.educatorDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Verification</h2>
          <p className="text-gray-600">Review and approve/reject submitted courses</p>
        </div>
        <button
          onClick={loadCourses}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses, educators, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={course.courseThumbnail || 'https://via.placeholder.com/48'}
                          alt={course.courseTitle}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="max-w-[250px]">
                          <p className="font-medium text-gray-900 truncate">{course.courseTitle}</p>
                          <p className="text-sm text-gray-600 truncate">{course.courseDescription}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {course.difficulty || 'Beginner'}
                            </span>
                            <span className="text-xs text-gray-600">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {formatDate(course.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <img
                          src={course.educatorDetails?.profileImage || 'https://via.placeholder.com/32'}
                          alt={course.educatorDetails?.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{course.educatorDetails?.name}</p>
                          <p className="text-sm text-gray-600">{course.educatorDetails?.email}</p>
                          <span className={`text-xs px-2 py-1 rounded ${course.educatorDetails?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {course.educatorDetails?.verified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="font-bold">{formatCurrency(course.coursePrice || 0)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Video className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{course.totalLectures || 0} lectures</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="w-4 h-4 text-gray-400 mr-1" />
                          <span>{formatDuration(course.totalDuration || 0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(course.status)}`}>
                        {getStatusIcon(course.status)}
                        <span className="ml-1 capitalize">{course.status}</span>
                      </span>
                      {course.status === 'rejected' && course.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {course.rejectionReason}</p>
                      )}
                      {course.status === 'approved' && course.reviewedAt && (
                        <p className="text-xs text-gray-600 mt-1">
                          Reviewed: {formatDate(course.reviewedAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            loadCourseDetails(course._id);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Full Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {course.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveClick(course)}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                              title="Approve Course"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRejectClick(course)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Reject Course"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      {selectedCourseDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
          <div
            ref={modalRef}
            className="relative top-2 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-xl bg-white max-h-[98vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">Course Details</h3>
              <button
                onClick={() => {
                  setSelectedCourseDetails(null);
                  setSelectedCourse(null);
                  setExpandedChapters(new Set());
                }}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-6">
              {/* Course Header */}
              <div className="flex items-start space-x-4">
                <img
                  src={selectedCourseDetails.courseThumbnail || 'https://via.placeholder.com/128'}
                  alt={selectedCourseDetails.courseTitle}
                  className="w-32 h-32 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900">{selectedCourseDetails.courseTitle}</h4>
                  <p className="text-gray-600 mt-2">{selectedCourseDetails.courseDescription}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {selectedCourseDetails.courseType === 'premium' ? 'Premium' : 'Basic'}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      {selectedCourseDetails.difficulty || 'Beginner'}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {formatCurrency(selectedCourseDetails.coursePrice || 0)}
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      {selectedCourseDetails.totalLectures || 0} lectures
                    </span>
                    <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                      {formatDuration(selectedCourseDetails.totalDuration || 0)}
                    </span>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedCourseDetails.status)}`}>
                      {selectedCourseDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UsersIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600">Enrolled Students</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedCourseDetails.enrolledStudents?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600">Average Rating</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedCourseDetails.averageRating?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Book className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-600">Total Reviews</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedCourseDetails.totalReviews || 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600">Total Chapters</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedCourseDetails.courseContent?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Educator Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-bold text-gray-900 mb-2">Educator Information</h5>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedCourseDetails.educatorDetails?.profileImage || 'https://via.placeholder.com/48'}
                      alt={selectedCourseDetails.educatorDetails?.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-bold text-gray-900">{selectedCourseDetails.educatorDetails?.name}</p>
                      <p className="text-gray-600">{selectedCourseDetails.educatorDetails?.email}</p>
                      <span className={`text-xs px-2 py-1 rounded ${selectedCourseDetails.educatorDetails?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedCourseDetails.educatorDetails?.verified ? 'Verified Educator' : 'Unverified Educator'}
                      </span>
                    </div>
                  </div>
                  {selectedCourseDetails.premiumFeatures?.socialLinks && (
                    <div className="flex space-x-2">
                      {selectedCourseDetails.premiumFeatures.socialLinks.facebook && (
                        <button
                          onClick={() => openSocialLink('Facebook', selectedCourseDetails.premiumFeatures.socialLinks.facebook)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Facebook className="w-5 h-5" />
                        </button>
                      )}
                      {selectedCourseDetails.premiumFeatures.socialLinks.twitter && (
                        <button
                          onClick={() => openSocialLink('Twitter', selectedCourseDetails.premiumFeatures.socialLinks.twitter)}
                          className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg"
                        >
                          <Twitter className="w-5 h-5" />
                        </button>
                      )}
                      {selectedCourseDetails.premiumFeatures.socialLinks.linkedin && (
                        <button
                          onClick={() => openSocialLink('LinkedIn', selectedCourseDetails.premiumFeatures.socialLinks.linkedin)}
                          className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg"
                        >
                          <Linkedin className="w-5 h-5" />
                        </button>
                      )}
                      {selectedCourseDetails.premiumFeatures.socialLinks.telegram && (
                        <button
                          onClick={() => openSocialLink('Telegram', selectedCourseDetails.premiumFeatures.socialLinks.telegram)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Course Content */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-gray-900">Course Content</h5>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const chapterIds = selectedCourseDetails.courseContent?.map(chapter => chapter.chapterId) || [];
                        setExpandedChapters(new Set(chapterIds));
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Expand All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => setExpandedChapters(new Set())}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedCourseDetails.courseContent?.map((chapter, chapterIndex) => (
                    <div key={chapter.chapterId} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleChapter(chapter.chapterId)}
                        className="w-full bg-gray-50 px-4 py-3 flex items-center justify-between hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <ChevronRight
                            className={`w-5 h-5 mr-2 transition-transform ${expandedChapters.has(chapter.chapterId) ? 'rotate-90' : ''}`}
                          />
                          <h6 className="font-medium text-gray-900 text-left">
                            Chapter {chapterIndex + 1}: {chapter.chapterTitle}
                          </h6>
                        </div>
                        <span className="text-sm text-gray-600">
                          {chapter.chapterContent?.length || 0} lectures
                        </span>
                      </button>

                      {expandedChapters.has(chapter.chapterId) && (
                        <div className="divide-y divide-gray-100 bg-white">
                          {chapter.chapterContent?.map((lecture, lectureIndex) => (
                            <div key={lecture.lectureId} className="px-4 py-3">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Play className="w-4 h-4 text-gray-400" />
                                    <p className="font-medium text-gray-900">
                                      {lectureIndex + 1}. {lecture.lectureTitle}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-600 ml-6">
                                    Duration: {formatDuration(lecture.lectureDuration || 0)}
                                    {lecture.isPreviewFree && (
                                      <span className="ml-2 text-green-600">• Free Preview</span>
                                    )}
                                  </p>
                                </div>
                                {lecture.lectureUrl && (
                                  <div className="flex space-x-2">
                                    {videoStates[lecture.lectureId]?.playing ? (
                                      <button
                                        onClick={() => handlePauseVideo(lecture.lectureId)}
                                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center"
                                      >
                                        <Pause className="w-4 h-4 mr-1" />
                                        Pause
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handlePlayVideo(lecture.lectureId)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                                      >
                                        <Play className="w-4 h-4 mr-1" />
                                        Play
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {lecture.lectureUrl && (
                                <div className="ml-6 space-y-3">
                                  {/* Video Player */}
                                  <div className="relative bg-black rounded-lg overflow-hidden">
                                    <video
                                      ref={el => videoRefs.current[lecture.lectureId] = el}
                                      src={lecture.lectureUrl}
                                      className="w-full"
                                      onTimeUpdate={(e) => handleVideoTimeUpdate(lecture.lectureId, e)}
                                      onLoadedMetadata={(e) => handleVideoTimeUpdate(lecture.lectureId, e)}
                                      onClick={() => {
                                        if (videoStates[lecture.lectureId]?.playing) {
                                          handlePauseVideo(lecture.lectureId);
                                        } else {
                                          handlePlayVideo(lecture.lectureId);
                                        }
                                      }}
                                    />

                                    {/* Custom Controls */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                      <div className="mb-2">
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={videoStates[lecture.lectureId]?.duration ?
                                            (videoStates[lecture.lectureId].currentTime / videoStates[lecture.lectureId].duration) * 100 : 0}
                                          onChange={(e) => handleSeek(lecture.lectureId, e.target.value)}
                                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                        />
                                        <div className="flex justify-between text-xs text-white mt-1">
                                          <span>{formatTime(videoStates[lecture.lectureId]?.currentTime || 0)}</span>
                                          <span>{formatTime(videoStates[lecture.lectureId]?.duration || 0)}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          {videoStates[lecture.lectureId]?.playing ? (
                                            <button onClick={() => handlePauseVideo(lecture.lectureId)} className="text-white hover:text-gray-300">
                                              <Pause className="w-5 h-5" />
                                            </button>
                                          ) : (
                                            <button onClick={() => handlePlayVideo(lecture.lectureId)} className="text-white hover:text-gray-300">
                                              <Play className="w-5 h-5" />
                                            </button>
                                          )}

                                          <div className="flex items-center space-x-2">
                                            <button onClick={() => toggleMute(lecture.lectureId)} className="text-white hover:text-gray-300">
                                              {videoStates[lecture.lectureId]?.muted || videoStates[lecture.lectureId]?.volume === 0 ? (
                                                <VolumeX className="w-5 h-5" />
                                              ) : (
                                                <Volume2 className="w-5 h-5" />
                                              )}
                                            </button>
                                            <input
                                              type="range"
                                              min="0"
                                              max="100"
                                              value={(videoStates[lecture.lectureId]?.volume || 0) * 100}
                                              onChange={(e) => handleVolumeChange(lecture.lectureId, e.target.value)}
                                              className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                            />
                                          </div>
                                        </div>

                                        <button onClick={() => toggleFullscreen(lecture.lectureId)} className="text-white hover:text-gray-300">
                                          <Maximize className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>

                                    {!videoStates[lecture.lectureId]?.playing && (
                                      <div
                                        className="absolute inset-0 flex items-center justify-center cursor-pointer"
                                        onClick={() => handlePlayVideo(lecture.lectureId)}
                                      >
                                        <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                                          <Play className="w-8 h-8 text-white" />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-xs text-gray-500 break-all">
                                    <span className="font-medium">Video URL:</span> {lecture.lectureUrl}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Handouts/Resources */}
              {selectedCourseDetails.premiumFeatures?.handouts?.length > 0 && (
                <div>
                  <h5 className="font-bold text-gray-900 mb-3">Course Resources</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCourseDetails.premiumFeatures.handouts.map((handout) => (
                      <div key={handout.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-500">{getFileIcon(handout.type)}</div>
                            <div>
                              <p className="font-medium text-gray-900">{handout.name}</p>
                              <p className="text-sm text-gray-600">
                                {handout.type} • {(handout.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadResource(handout, selectedCourseDetails.courseTitle)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements & Outcomes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-bold text-gray-900 mb-3">Requirements</h5>
                  <ul className="space-y-2">
                    {selectedCourseDetails.requirements?.map((req, i) => (
                      <li key={i} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 mb-3">What You'll Learn</h5>
                  <ul className="space-y-2">
                    {selectedCourseDetails.learningOutcomes?.map((outcome, i) => (
                      <li key={i} className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-gray-700">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Premium Features */}
              {selectedCourseDetails.courseType === 'premium' && selectedCourseDetails.premiumFeatures && (
                <div>
                  <h5 className="font-bold text-gray-900 mb-3">Premium Features</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedCourseDetails.premiumFeatures.hasCertificate && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-800">Certificate</span>
                        </div>
                      </div>
                    )}
                    {selectedCourseDetails.premiumFeatures.hasInstructorAssistance && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Instructor Help</span>
                        </div>
                      </div>
                    )}
                    {selectedCourseDetails.premiumFeatures.hasLiveSessions && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Video className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-yellow-800">Live Sessions</span>
                        </div>
                      </div>
                    )}
                    {selectedCourseDetails.premiumFeatures.hasCommunityAccess && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-purple-800">Community</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-bold text-gray-900 mb-2">Verification Status</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    <span className={`font-medium capitalize ${getStatusColor(selectedCourseDetails.status).replace('bg-', 'text-').split(' ')[0]}`}>
                      {selectedCourseDetails.status}
                    </span>
                  </div>
                  {selectedCourseDetails.rejectionReason && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rejection Reason:</span>
                      <span className="text-red-600">{selectedCourseDetails.rejectionReason}</span>
                    </div>
                  )}
                  {selectedCourseDetails.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed At:</span>
                      <span className="text-gray-900">{formatDate(selectedCourseDetails.reviewedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedCourseDetails.status === 'pending' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedCourse(selectedCourseDetails);
                      handleRejectClick(selectedCourseDetails);
                    }}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject Course
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCourse(selectedCourseDetails);
                      handleApproveClick(selectedCourseDetails);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedCourse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Approve Course</h3>
              <p className="text-gray-600 mt-1">
                Are you sure you want to approve "{selectedCourse.courseTitle || selectedCourse.title}"?
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Notes (Optional)
              </label>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Add any notes or comments..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedCourse(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedCourse && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reject Course</h3>
              <p className="text-gray-600 mt-1">
                Please provide a reason for rejecting "{selectedCourse.courseTitle || selectedCourse.title}"
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="Provide specific reasons for rejection..."
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedCourse(null);
                  setRejectReason('');
                  setRejectNotes('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className={`px-4 py-2 rounded-lg flex items-center ${!rejectReason.trim() ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                <XCircle className="w-5 h-5 mr-2" />
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseVerificationPage;