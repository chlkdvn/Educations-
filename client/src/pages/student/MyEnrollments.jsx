import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/student/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Play,
  Clock,
  Check,
  Award,
  Download,
  FileText,
  ChevronRight,
  BookOpen,
  BarChart3,
  Zap,
  Calendar,
  Eye,
  ExternalLink,
  FileDown,
  FolderOpen,
  Sparkles,
  Lock,
  File,
  Facebook,
  Linkedin,
  Twitter,
  MessageCircle,
  Send,
  Globe,
  Link as LinkIcon,
  Instagram,
  Youtube,
  Mail,
  MessageSquare,
  Users,
  Video,
  HelpCircle,
  Briefcase
} from 'lucide-react';

const MyEnrollments = () => {
  const {
    enrolledCourses,
    fetchUserEnrolledCourses,
    CalculateCourseDuration,
    navigate,
    userData,
    backendUrl,
    getToken,
    calculateNoOfLectures,
    currency
  } = useContext(AppContext);

  const [progressArray, setProgressArray] = useState([]);
  const [certificateStatus, setCertificateStatus] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [loadingResources, setLoadingResources] = useState({});
  const [courseResources, setCourseResources] = useState({});
  const [courseFullData, setCourseFullData] = useState({});

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const tempProgressArray = await Promise.all(
        enrolledCourses.map(async (course) => {
          try {
            const { data } = await axios.post(
              `${backendUrl}/api/user/get-course-progress`,
              { courseId: course._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const totalLectures = calculateNoOfLectures(course);
            const lectureCompleted = data.progressData?.lectureCompleted?.length || 0;
            const percentage = totalLectures > 0 ? (lectureCompleted / totalLectures) * 100 : 0;

            return {
              totalLectures,
              lectureCompleted,
              percentage,
              lastAccessed: data.progressData?.lastAccessed || null
            };
          } catch (err) {
            const totalLectures = calculateNoOfLectures(course);
            return {
              totalLectures,
              lectureCompleted: 0,
              percentage: 0,
              lastAccessed: null
            };
          }
        })
      );

      setProgressArray(tempProgressArray);
    } catch (error) {
      toast.error("Failed to load progress");
    }
  };

  const checkCertificateRequests = async () => {
    try {
      const token = await getToken();
      const statusMap = {};

      for (const course of enrolledCourses) {
        const index = enrolledCourses.indexOf(course);
        const progress = progressArray[index] || { percentage: 0 };
        const hasCertificate = course.courseType === 'premium' &&
          course.premiumFeatures?.hasCertificate === true;

        if (hasCertificate && progress.percentage === 100) {
          try {
            const { data } = await axios.post(
              `${backendUrl}/api/user/check-certificate-requested`,
              { courseId: course._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            statusMap[course._id] = data.alreadyRequested || false;
          } catch (error) {
            statusMap[course._id] = false;
          }
        }
      }

      setCertificateStatus(statusMap);
    } catch (error) {
      console.error("Failed to check certificate status", error);
    }
  };

  const fetchCourseFullData = async (courseId) => {
    if (courseFullData[courseId]) return;

    setLoadingResources(prev => ({ ...prev, [courseId]: true }));
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/course/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const courseData = data.courseData;
        setCourseFullData(prev => ({
          ...prev,
          [courseId]: courseData
        }));

        const resources = courseData.premiumFeatures?.handouts || [];
        setCourseResources(prev => ({
          ...prev,
          [courseId]: resources
        }));
      }
    } catch (error) {
      console.error("Failed to fetch course data", error);
    } finally {
      setLoadingResources(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const toggleCourseDetails = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      fetchCourseFullData(courseId);
    }
  };

  // IMPROVED DOWNLOAD FUNCTION – works reliably for all file types (Cloudinary included)
  const downloadResource = async (resourceUrl, resourceName, resourceId) => {
    try {
      // Step 1: Try backend proxy first (recommended)
      const token = await getToken();
      const response = await axios({
        url: `${backendUrl}/api/user/download-resource`,
        method: 'POST',
        data: {
          resourceUrl,
          resourceName,
          resourceId
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resourceName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success(`Downloaded ${resourceName}`);
      return; // Success – exit
    } catch (proxyError) {
      console.warn('Backend proxy download failed:', proxyError);
    }

    // Step 2: Direct download using fetch + blob (works great for Cloudinary)
    try {
      const response = await fetch(resourceUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = resourceName; // Forces correct filename
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success(`Downloaded ${resourceName}`);
    } catch (error) {
      console.error('Direct download failed:', error);

      // Final friendly fallback
      toast.info(
        <div className="text-left">
          <p className="font-medium mb-2">Download didn't start automatically.</p>
          <p className="text-sm mb-3">Click the link below to download:</p>
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            Download {resourceName}
          </a>
        </div>,
        { autoClose: 12000 }
      );
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
      expert: 'bg-purple-100 text-purple-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type, url) => {
    if (url) {
      const extension = url.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return '🖼️';
      if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) return '🎬';
      if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return '🎵';
      if (['pdf'].includes(extension)) return '📄';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return '🗜️';
      if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return '📝';
    }

    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎬';
    if (type.includes('audio')) return '🎵';
    if (type.includes('zip') || type.includes('compressed')) return '🗜️';
    if (type.includes('word') || type.includes('document') || type.includes('text')) return '📝';
    return '📎';
  };

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'discord': return <MessageCircle className="w-5 h-5" />;
      case 'telegram': return <Send className="w-5 h-5" />;
      case 'whatsapp': return <MessageSquare className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const getSocialColor = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return 'bg-blue-600 hover:bg-blue-700';
      case 'linkedin': return 'bg-blue-500 hover:bg-blue-600';
      case 'twitter': return 'bg-sky-500 hover:bg-sky-600';
      case 'instagram': return 'bg-pink-600 hover:bg-pink-700';
      case 'youtube': return 'bg-red-600 hover:bg-red-700';
      case 'discord': return 'bg-indigo-600 hover:bg-indigo-700';
      case 'telegram': return 'bg-blue-400 hover:bg-blue-500';
      case 'whatsapp': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseProgress();
    }
  }, [enrolledCourses]);

  useEffect(() => {
    if (progressArray.length > 0 && enrolledCourses.length > 0) {
      checkCertificateRequests();
    }
  }, [progressArray, enrolledCourses]);

  return (
    <>
      <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 mb-2'>My Learning</h1>
                <p className="text-gray-600">Continue your journey with enrolled courses</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-blue-700">
                  {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Course' : 'Courses'}
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-xl font-bold text-gray-900">
                      {enrolledCourses.filter((_, i) => progressArray[i]?.percentage < 100).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-xl font-bold text-gray-900">
                      {enrolledCourses.filter((_, i) => progressArray[i]?.percentage === 100).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Progress</p>
                    <p className="text-xl font-bold text-gray-900">
                      {progressArray.length > 0
                        ? (progressArray.reduce((acc, p) => acc + p.percentage, 0) / progressArray.length).toFixed(0) + '%'
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No courses enrolled yet</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start your learning journey by exploring our wide range of courses
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {enrolledCourses.map((course, index) => {
                const progress = progressArray[index] || {
                  totalLectures: 0,
                  lectureCompleted: 0,
                  percentage: 0,
                  lastAccessed: null
                };
                const isCompleted = progress.percentage === 100;
                const alreadyRequested = certificateStatus[course._id] || false;
                const isExpanded = expandedCourse === course._id;
                const fullCourseData = courseFullData[course._id] || course;
                const resources = courseResources[course._id] || [];
                const hasResources = resources.length > 0;
                const isPremium = course.courseType === 'premium';
                const hasCertificate = isPremium && fullCourseData.premiumFeatures?.hasCertificate === true;
                const premiumFeatures = fullCourseData.premiumFeatures || {};
                const socialLinks = premiumFeatures.socialLinks || {};
                const hasSocialLinks = Object.values(socialLinks).some(link => link && link.trim() !== '');
                const coursePrice = course.discount > 0
                  ? (course.coursePrice * (100 - course.discount) / 100).toFixed(0)
                  : course.coursePrice;

                const activeSocialLinks = Object.entries(socialLinks)
                  .filter(([_, url]) => url && url.trim() !== '')
                  .map(([platform, url]) => ({ platform, url }));

                return (
                  <div
                    key={course._id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {/* Course Header */}
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Course Image */}
                        <div className="lg:w-48 flex-shrink-0">
                          <div className="relative">
                            <img
                              src={course.courseThumbnail}
                              alt={course.courseTitle}
                              className="w-full h-40 lg:h-32 object-cover rounded-xl"
                            />
                            {isPremium && (
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                                  PREMIUM
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Course Info */}
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                                  {course.difficulty?.charAt(0).toUpperCase() + course.difficulty?.slice(1)}
                                </span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  {course.language || 'English'}
                                </span>
                                {isCompleted && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Completed
                                  </span>
                                )}
                                {hasCertificate && (
                                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Certificate
                                  </span>
                                )}
                              </div>

                              <h3 className="font-bold text-gray-900 text-xl mb-2">
                                {course.courseTitle}
                              </h3>

                              <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-4">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={14} />
                                  <span>{CalculateCourseDuration(course)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <BookOpen size={14} />
                                  <span>{progress.lectureCompleted}/{progress.totalLectures} lectures</span>
                                </div>
                                {progress.lastAccessed && (
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>Last accessed: {new Date(progress.lastAccessed).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Progress Circle */}
                            <div className="lg:w-20">
                              <div className="relative w-16 h-16 mx-auto lg:mx-0">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="3"
                                  />
                                  <path
                                    d="M18 2.0845
                                      a 15.9155 15.9155 0 0 1 0 31.831
                                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={isCompleted ? '#10B981' : '#3B82F6'}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${progress.percentage}, 100`}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-lg font-bold text-gray-900">
                                    {progress.percentage.toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <div className="text-center text-xs text-gray-500 mt-1">Progress</div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Course Progress</span>
                              <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-700 ${isCompleted
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                  }`}
                                style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                              onClick={() => navigate(`/player/${course._id}`)}
                              className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${isCompleted
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                } shadow-md hover:shadow-lg`}
                            >
                              <Play size={18} />
                              {isCompleted ? "Review Course" : "Continue Learning"}
                            </button>

                            {hasCertificate && isCompleted && (
                              alreadyRequested ? (
                                <button
                                  disabled
                                  className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed"
                                >
                                  <Check size={18} />
                                  Certificate Requested
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate(`/request-certificate/${course._id}`)}
                                  className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-200"
                                >
                                  <Award size={18} />
                                  Get Certificate
                                </button>
                              )
                            )}

                            <button
                              onClick={() => toggleCourseDetails(course._id)}
                              className="px-6 py-3 rounded-xl font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-200"
                            >
                              {isExpanded ? 'Show Less' : 'View Details'}
                              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50/50">
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Course Information */}
                            <div className="lg:col-span-2">
                              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                Course Details
                              </h4>
                              <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                                <div className="prose max-w-none">
                                  <div
                                    className="text-gray-700"
                                    dangerouslySetInnerHTML={{ __html: fullCourseData.courseDescription }}
                                  />
                                </div>
                              </div>

                              {isPremium && (
                                <div className="mb-6">
                                  <h5 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    Premium Features
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {premiumFeatures.hasInstructorAssistance && (
                                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2">
                                          <HelpCircle className="w-4 h-4 text-blue-600" />
                                          <span className="font-medium text-gray-900">Instructor Assistance</span>
                                        </div>
                                        {premiumFeatures.assistanceHours && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {premiumFeatures.assistanceHours} hours included
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {premiumFeatures.hasCertificate && (
                                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                                        <div className="flex items-center gap-2">
                                          <Award className="w-4 h-4 text-green-600" />
                                          <span className="font-medium text-gray-900">Certificate</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">Upon completion</p>
                                      </div>
                                    )}
                                    {premiumFeatures.hasLiveSessions && (
                                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-2">
                                          <Video className="w-4 h-4 text-purple-600" />
                                          <span className="font-medium text-gray-900">Live Sessions</span>
                                        </div>
                                        {premiumFeatures.liveSessionSchedule && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {premiumFeatures.liveSessionSchedule}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {premiumFeatures.hasCommunityAccess && (
                                      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg border border-orange-100">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 text-orange-600" />
                                          <span className="font-medium text-gray-900">Community</span>
                                        </div>
                                        {premiumFeatures.communityType && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            {premiumFeatures.communityType}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {premiumFeatures.hasCareerSupport && (
                                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-100">
                                        <div className="flex items-center gap-2">
                                          <Briefcase className="w-4 h-4 text-yellow-600" />
                                          <span className="font-medium text-gray-900">Career Support</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                  <div className="text-lg font-bold text-gray-900">{progress.totalLectures}</div>
                                  <div className="text-xs text-gray-600">Lectures</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                  <div className="text-lg font-bold text-gray-900">{CalculateCourseDuration(course)}</div>
                                  <div className="text-xs text-gray-600">Duration</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                  <div className="text-lg font-bold text-gray-900">
                                    {course.enrolledStudents?.length || 0}
                                  </div>
                                  <div className="text-xs text-gray-600">Students</div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                                  <div className="text-lg font-bold text-gray-900">
                                    {currency}{coursePrice}
                                  </div>
                                  <div className="text-xs text-gray-600">Price</div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Resources & Social Links */}
                            <div className="space-y-6">
                              {/* Resources Section */}
                              <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                  <FolderOpen className="w-5 h-5 text-blue-600" />
                                  Course Resources
                                </h4>

                                {loadingResources[course._id] ? (
                                  <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                                    <div className="animate-pulse space-y-3">
                                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                    </div>
                                  </div>
                                ) : hasResources ? (
                                  <div className="space-y-3">
                                    {resources.map((resource, idx) => (
                                      <div
                                        key={resource.id || idx}
                                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-200 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 flex-1">
                                            <div className="text-2xl">
                                              {getFileIcon(resource.type, resource.url)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-gray-900 text-sm truncate">
                                                {resource.name}
                                              </p>
                                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span>{formatFileSize(resource.size)}</span>
                                                <span>•</span>
                                                <span>{resource.type.split('/')[1]?.toUpperCase()}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => downloadResource(resource.url, resource.name, resource.id)}
                                            className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg font-medium hover:from-blue-100 hover:to-blue-200 transition-all flex items-center gap-2 text-sm"
                                          >
                                            <FileDown className="w-4 h-4" />
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                                    <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-600">No resources available for this course</p>
                                  </div>
                                )}
                              </div>

                              {/* Social Links Section */}
                              {isPremium && hasSocialLinks && (
                                <div>
                                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Connect with Instructor
                                  </h4>
                                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <p className="text-sm text-gray-600 mb-3">
                                      Follow the instructor on social media:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {activeSocialLinks.map(({ platform, url }, idx) => (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`px-3 py-2 rounded-lg text-white font-medium flex items-center gap-2 transition-all ${getSocialColor(platform)}`}
                                        >
                                          {getSocialIcon(platform)}
                                          <span className="text-sm">{platform}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Quick Actions */}
                              <div className="space-y-3">
                                <button
                                  onClick={() => navigate(`/course/${course._id}`)}
                                  className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Course Details
                                </button>

                                {hasCertificate && isCompleted && !alreadyRequested && (
                                  <button
                                    onClick={() => navigate(`/request-certificate/${course._id}`)}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-200 rounded-xl font-medium text-amber-700 hover:from-yellow-100 hover:to-amber-100 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Award className="w-4 h-4" />
                                    Request Certificate
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyEnrollments;