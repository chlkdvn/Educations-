import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { useParams } from 'react-router-dom';
import humanizeDuration from 'humanize-duration';
import Footer from '../../components/student/Footer';
import Rating from '../../components/student/Rating';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from "../../components/Loading";
import {
  Play,
  CheckCircle,
  ChevronDown,
  Clock,
  Award,
  Star,
  Video,
  BookOpen,
  Zap,
  Users,
  FileText,
  Download,
  HelpCircle,
  MessageCircle,
  Calendar,
  Sparkles,
  Crown,
  Gem,
  Diamond,
  Trophy,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  Maximize,
  Minimize,
  Briefcase,
  Lock,
  FileDown
} from 'lucide-react';

const Player = () => {
  const {
    enrolledCourses,
    fetchUserEnrolledCourses,
    getToken,
    userData,
    backendUrl,
    CalculateChapterTime,
    navigate
  } = useContext(AppContext);

  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [courseStats, setCourseStats] = useState({});
  const [premiumFeatures, setPremiumFeatures] = useState({});

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  const getCourse = () => {
    const course = enrolledCourses.find(c => c._id === courseId);
    if (course) {
      setCourseData(course);
      const userRating = course.courseRatings?.find(r => r.userId === userData?._id);
      setInitialRating(userRating?.rating || 0);
      setPremiumFeatures(course.premiumFeatures || {});

      const totalLectures = course.courseContent?.reduce((acc, ch) => acc + ch.chapterContent.length, 0) || 0;
      const totalDuration = course.courseContent?.reduce((acc, ch) =>
        acc + ch.chapterContent.reduce((sum, lec) => sum + lec.lectureDuration, 0), 0) || 0;

      setCourseStats({
        totalLectures,
        totalDuration,
        enrolledStudents: course.enrolledStudents?.length || 0,
        averageRating: course.averageRating || 0,
        completionRate: course.completionRate || 0,
        difficulty: course.difficulty || 'beginner',
        language: course.language || 'English'
      });
    }
  };

  useEffect(() => {
    if (enrolledCourses.length > 0 && courseId && userData) {
      getCourse();
    }
  }, [enrolledCourses, courseId, userData]);

  const toggleSection = (idx) => {
    setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setProgressData(data.progressData || { lectureCompleted: [] });
      }
    } catch (err) {
      console.error("Progress fetch error:", err);
    }
  };

  useEffect(() => {
    if (courseId) getCourseProgress();
  }, [courseId]);

  const markLectureAsCompleted = async (lectureId) => {
    if (!lectureId) return;
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Lecture marked as completed!</span>
          </div>
        );
        getCourseProgress();
        fetchUserEnrolledCourses();
      }
    } catch (err) {
      toast.error("Failed to save progress");
    }
  };

  const handleVideoEnd = () => {
    if (playerData && !progressData?.lectureCompleted.includes(playerData.lectureId)) {
      markLectureAsCompleted(playerData.lectureId);
    }
  };

  const handleRating = async (rating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Thank you for your valuable feedback!</span>
          </div>
        );
        setInitialRating(rating);
        fetchUserEnrolledCourses();
      }
    } catch (err) {
      toast.error("Failed to submit rating");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // IMPROVED RESOURCE DOWNLOAD – works reliably for all file types
  const downloadResource = async (resourceUrl, resourceName) => {
    try {
      // Try backend proxy first (if you have it)
      const token = await getToken();
      const response = await axios({
        url: `${backendUrl}/api/user/download-resource`,
        method: 'POST',
        data: { resourceUrl, resourceName },
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
      return;
    } catch (proxyError) {
      console.warn('Proxy download failed:', proxyError);
    }

    // Direct download with fetch + blob (works great for Cloudinary)
    try {
      const response = await fetch(resourceUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = resourceName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success(`Downloaded ${resourceName}`);
    } catch (error) {
      console.error('Direct download failed:', error);
      toast.info(
        <div className="text-left">
          <p className="font-medium mb-2">Download didn't start automatically.</p>
          <p className="text-sm mb-3">Click to download:</p>
          <a
            href={resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            {resourceName}
          </a>
        </div>,
        { autoClose: 12000 }
      );
    }
  };

  const isCompleted = (lectureId) => progressData?.lectureCompleted.includes(lectureId);

  const calculateProgress = () => {
    if (!courseData || !progressData) return 0;
    const totalLectures = courseData.courseContent?.reduce((acc, ch) => acc + ch.chapterContent.length, 0) || 1;
    const completed = progressData.lectureCompleted?.length || 0;
    return (completed / totalLectures) * 100;
  };

  if (!courseData) return <Loading />;

  const progressPercentage = calculateProgress();
  const isCoursePremium = courseData.courseType === 'premium';
  const completedLectures = progressData?.lectureCompleted?.length || 0;
  const totalLectures = courseData.courseContent?.reduce((acc, ch) => acc + ch.chapterContent.length, 0) || 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={courseData.courseThumbnail}
                      alt={courseData.courseTitle}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    {isCoursePremium && (
                      <div className="absolute -top-1 -right-1">
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-1 rounded-full">
                          <Crown className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {courseData.courseTitle}
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {completedLectures}/{totalLectures} lectures
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(progressPercentage)}% complete
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isCoursePremium && (
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-2">
                    <Gem className="w-4 h-4" />
                    PREMIUM
                  </div>
                )}

                <div className="relative w-10 h-10">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercentage}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Video Player Section */}
            <div className="flex-1">
              <div
                ref={playerContainerRef}
                className="bg-black rounded-xl overflow-hidden shadow-lg"
              >
                {playerData ? (
                  <>
                    <div className="relative">
                      <video
                        ref={videoRef}
                        src={playerData.lectureUrl}
                        controls
                        className="w-full aspect-video"
                        onEnded={handleVideoEnd}
                        autoPlay
                      />

                      {/* Fullscreen Button Only – No Download */}
                      <div className="absolute bottom-20 right-4 z-10">
                        <button
                          onClick={toggleFullscreen}
                          className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              Chapter {playerData.chapter} • Lecture {playerData.lecture}
                            </span>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">
                                {humanizeDuration(playerData.lectureDuration * 60 * 1000, { units: ['m'] })}
                              </span>
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {playerData.lectureTitle}
                          </h2>
                        </div>
                        <button
                          onClick={() => markLectureAsCompleted(playerData.lectureId)}
                          disabled={isCompleted(playerData.lectureId)}
                          className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${isCompleted(playerData.lectureId)
                              ? 'bg-green-500 text-white cursor-default'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                          {isCompleted(playerData.lectureId) ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Completed
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Mark Complete
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Course Progress</span>
                          <span>{Math.round(progressPercentage)}% Complete</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000`}
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full aspect-video bg-gray-900 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                      <Play className="w-12 h-12 text-white ml-1" />
                    </div>
                    <p className="text-xl text-gray-300 font-medium mb-2">Select a lecture</p>
                    <p className="text-gray-400">Choose from the course content to start learning</p>
                  </div>
                )}
              </div>

              {/* Course Stats */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-lg font-bold">{courseStats.totalLectures}</p>
                      <p className="text-sm text-gray-600">Lectures</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-lg font-bold">
                        {humanizeDuration(courseStats.totalDuration * 60 * 1000, { units: ['h', 'm'] })}
                      </p>
                      <p className="text-sm text-gray-600">Duration</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-lg font-bold">{courseStats.enrolledStudents}</p>
                      <p className="text-sm text-gray-600">Students</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-lg font-bold">{courseStats.averageRating.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Features Showcase */}
              {isCoursePremium && premiumFeatures && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Premium Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {premiumFeatures.hasCertificate && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="font-medium">Certificate</p>
                            <p className="text-sm text-gray-600">Upon completion</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {premiumFeatures.hasInstructorAssistance && (
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Instructor Support</p>
                            <p className="text-sm text-gray-600">{premiumFeatures.assistanceHours || 5} hours</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {premiumFeatures.hasLiveSessions && (
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Live Sessions</p>
                            <p className="text-sm text-gray-600">Interactive learning</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {premiumFeatures.hasCommunityAccess && (
                      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">Community</p>
                            <p className="text-sm text-gray-600">{premiumFeatures.communityType || 'Discord'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {premiumFeatures.handouts?.length > 0 && (
                      <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-cyan-600" />
                          <div>
                            <p className="font-medium">Resources</p>
                            <p className="text-sm text-gray-600">{premiumFeatures.handouts.length} files</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {premiumFeatures.hasCareerSupport && (
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="font-medium">Career Support</p>
                            <p className="text-sm text-gray-600">Job assistance</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Course Content Sidebar */}
            <div className="lg:w-96">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl overflow-hidden shadow-lg border">
                  <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Course Content
                    </h2>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{completedLectures}/{totalLectures} completed</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 max-h-[500px] overflow-y-auto">
                    <div className="space-y-3">
                      {courseData.courseContent.map((chapter, chIdx) => (
                        <div key={chIdx} className="border rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleSection(chIdx)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`transition-transform ${openSections[chIdx] ? 'rotate-180' : ''}`}>
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-gray-900">{chapter.chapterTitle}</h3>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  {chapter.chapterContent.length} lectures • {CalculateChapterTime(chapter)}
                                </p>
                              </div>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {chIdx + 1}
                            </div>
                          </button>

                          {openSections[chIdx] && (
                            <div className="border-t">
                              {chapter.chapterContent.map((lecture, lecIdx) => (
                                <button
                                  key={lecIdx}
                                  onClick={() => setPlayerData({
                                    ...lecture,
                                    chapter: chIdx + 1,
                                    lecture: lecIdx + 1,
                                  })}
                                  className={`w-full p-4 flex items-center justify-between border-t hover:bg-gray-50 transition-colors ${playerData?.lectureId === lecture.lectureId ? 'bg-blue-50' : ''
                                    }`}
                                >
                                  <div className="flex items-center gap-3 flex-1 text-left">
                                    {isCompleted(lecture.lectureId) ? (
                                      <div className="w-8 h-8 flex-shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      </div>
                                    ) : (
                                      <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${playerData?.lectureId === lecture.lectureId ? 'bg-blue-100' : 'bg-gray-100'
                                        }`}>
                                        <Play className={`w-4 h-4 ${playerData?.lectureId === lecture.lectureId ? 'text-blue-600' : 'text-gray-500'
                                          }`} />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-medium truncate ${isCompleted(lecture.lectureId) ? 'text-green-600' :
                                          playerData?.lectureId === lecture.lectureId ? 'text-blue-600' : 'text-gray-700'
                                        }`}>
                                        {lecture.lectureTitle}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        <span>Lecture {lecIdx + 1}</span>
                                        <span>•</span>
                                        <span>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['m'] })}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {isCoursePremium && lecture.isPreviewFree === false && (
                                    <div className="ml-2">
                                      <Lock className="w-4 h-4 text-amber-400" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <h3 className="text-lg font-bold text-gray-900">Rate this course</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Share your learning experience with others
                  </p>
                  <div className="mb-4">
                    <Rating initialRating={initialRating} onRate={handleRating} />
                  </div>
                  {initialRating > 0 && (
                    <p className="text-green-600 text-sm font-medium">
                      ✓ You rated this course {initialRating} star{initialRating !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Download Resources Section – Premium Only */}
                {isCoursePremium && premiumFeatures.handouts?.length > 0 && (
                  <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <Download className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900">Course Resources</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Download additional materials for this course
                    </p>
                    <div className="space-y-3">
                      {premiumFeatures.handouts.map((resource, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <FileText className="w-6 h-6 text-gray-600" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{resource.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {(resource.size / 1024 / 1024).toFixed(1)} MB • {resource.type?.split('/')?.[1]?.toUpperCase() || 'File'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadResource(resource.url, resource.name)}
                              className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg font-medium hover:from-blue-100 hover:to-blue-200 transition-all flex items-center gap-2 text-sm"
                            >
                              <FileDown className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Player;