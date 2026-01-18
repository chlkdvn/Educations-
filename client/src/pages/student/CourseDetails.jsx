import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/Loading';
import humanizeDuration from 'humanize-duration';
import Footer from '../../components/student/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Clock, Users, Star, ChevronDown, CheckCircle, Award, FileText, HelpCircle,
  Play, Globe, BarChart3, Target, Check, Zap, MessageSquare, Video,
  Users as UsersIcon, Briefcase, BookOpen, Lock
} from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const {
    calculateRating, backendUrl, userData, calculateNoOfLectures,
    CalculateCourseDuration, getToken, CalculateChapterTime, currency
  } = useContext(AppContext);

  /* -------------------------------------------------- */
  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/${id}`);
      if (data.success) {
        setCourseData(data.courseData);
        const firstFreePreview = data.courseData.courseContent
          ?.flatMap(ch => ch.chapterContent)
          ?.find(l => l.isPreviewFree && l.lectureUrl);
        if (firstFreePreview) setPreviewUrl(firstFreePreview.lectureUrl);
      } else toast.error(data.message || 'Failed to load course');
    } catch (err) {
      toast.error('Something went wrong while loading course details');
      console.error(err);
    }
  };

  useEffect(() => { fetchCourseData(); }, [id]);

  useEffect(() => {
    if (userData && courseData)
      setIsAlreadyEnrolled(userData.enrolledCourse?.includes(courseData._id));
  }, [userData, courseData]);

  /* -------------------------------------------------- */
  const enrollCourse = async () => {
    if (!userData) return toast.warn('Please login to enroll');
    if (isAlreadyEnrolled) return toast.info('You are already enrolled');
    setIsLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/initializeCoursePayment`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.alreadyEnrolled) {
        toast.success('You are already enrolled!');
        setIsAlreadyEnrolled(true);
        window.location.href = '/my-enrollments';
        return;
      }
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }
      toast.error(data.message || 'Unable to start payment');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------- */
  const toggleSection = (chapterId) =>
    setOpenSections(p => ({ ...p, [chapterId]: !p[chapterId] }));

  const openPreview = (url) => {
    if (url) { setPreviewUrl(url); setPreviewOpen(true); }
  };

  const getDifficultyBadge = (d) => {
    const map = { beginner: 'bg-green-100 text-green-800', intermediate: 'bg-yellow-100 text-yellow-800', advanced: 'bg-red-100 text-red-800', expert: 'bg-purple-100 text-purple-800' };
    return map[d?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const flag = (lang) => ({ English: '🇺🇸', Spanish: '🇪🇸', French: '🇫🇷', German: '🇩🇪', Chinese: '🇨🇳', Japanese: '🇯🇵', Hindi: '🇮🇳', Arabic: '🇦🇪' }[lang] || '🌐');

  if (!courseData) return <Loading />;

  const finalPrice = courseData.discount > 0
    ? Math.round(courseData.coursePrice * (100 - courseData.discount) / 100)
    : courseData.coursePrice;

  const totalLectures = calculateNoOfLectures(courseData);
  const courseRating = calculateRating(courseData);
  const totalDuration = CalculateCourseDuration(courseData);
  const premiumFeatures = courseData.premiumFeatures || {};
  const completedLectures = courseData.courseContent?.reduce((acc, ch) =>
    acc + (ch.chapterContent?.filter(l => l.completed)?.length || 0), 0) || 0;
  const completionPercentage = totalLectures ? Math.round((completedLectures / totalLectures) * 100) : 0;

  /* -------------------------------------------------- */
  return (
    <>
      {/* ---------- PREVIEW MODAL ---------- */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Course Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="aspect-video">
              <iframe src={previewUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* ---------- HERO ---------- */}
        <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* left content */}
              <div className="flex-1 w-full">
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyBadge(courseData.difficulty)}`}>
                    {courseData.difficulty?.charAt(0).toUpperCase() + courseData.difficulty?.slice(1)}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {courseData.courseType?.charAt(0).toUpperCase() + courseData.courseType?.slice(1)}
                  </span>
                  {courseData.isFeatured && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Featured
                    </span>
                  )}
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {flag(courseData.language)} {courseData.language}
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  {courseData.courseTitle}
                </h1>

                <div className="prose max-w-none mb-8 break-words">
                  <div
                    className="text-lg text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
                  />
                </div>

                {/* ---------- EDUCATOR CARD (NEW) ---------- */}
                {courseData.FindEductor && (
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={courseData.FindEductor.imageUrl}
                      alt={courseData.FindEductor.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">Instructor</h4>
                      <p className="text-gray-600">{courseData.FindEductor.name}</p>
                      <p className="text-sm text-gray-500">{courseData.FindEductor.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-bold text-gray-900">{courseRating.toFixed(1)}</span>
                    <span>({courseData.totalReviews || courseData.courseRatings?.length || 0} ratings)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-blue-600" />
                    <span>{courseData.enrolledStudents?.length || 0} students enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span>Last updated: {new Date(courseData.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* ---------- THUMBNAIL + PROMO VIDEO (NEW) ---------- */}
              <div className="w-full lg:w-96">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  {/* Promo video first (if exists) */}
                  {courseData.promoUrl && (
                    <div className="aspect-video bg-black">
                      <video
                        src={courseData.promoUrl}
                        controls
                        poster={courseData.courseThumbnail}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Fallback thumbnail when no promo */}
                  {!courseData.promoUrl && (
                    <img
                      src={courseData.courseThumbnail}
                      alt={courseData.courseTitle}
                      className="w-full h-64 lg:h-80 object-cover"
                    />
                  )}

                  {/* Free-preview overlay (unchanged) */}
                  {previewUrl && (
                    <button
                      onClick={() => openPreview(previewUrl)}
                      className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center group hover:bg-opacity-50 transition-all"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform mb-3">
                        <Play className="w-10 h-10 text-blue-600 fill-current" />
                      </div>
                      <span className="text-white font-semibold text-center px-4">Preview this course</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- MAIN LAYOUT ---------- */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT: CONTENT */}
            <div className="flex-1 order-2 lg:order-1">
              {/* Learning Outcomes */}
              {courseData.learningOutcomes?.length > 0 && (
                <div className="mb-12 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Target className="w-8 h-8 text-blue-600" />
                    What You'll Learn
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseData.learningOutcomes.map((o, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {courseData.requirements?.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {courseData.requirements.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* Course Content */}
              <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl font-bold text-gray-900">Course Content</h2>
                  <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full font-semibold text-center">
                    {totalLectures} lectures • {totalDuration}
                  </div>
                </div>

                {isAlreadyEnrolled && (
                  <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                      <span className="font-semibold text-gray-900">Your Progress</span>
                      <span className="text-sm text-gray-600">{completionPercentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {completedLectures} of {totalLectures} lectures completed
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {courseData.courseContent?.map((chapter, idx) => (
                    <div key={chapter.chapterId || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <button
                        onClick={() => toggleSection(chapter.chapterId || idx)}
                        className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`transition-transform duration-200 ${openSections[chapter.chapterId || idx] ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-6 h-6 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 text-lg">{chapter.chapterTitle}</h3>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium inline-block">
                                {chapter.chapterContent?.length || 0} lectures
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {CalculateChapterTime(chapter)} • Chapter {idx + 1}
                            </p>
                          </div>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                      </button>

                      {openSections[chapter.chapterId || idx] && chapter.chapterContent && (
                        <div className="border-t divide-y divide-gray-100">
                          {chapter.chapterContent.map((lecture, i) => (
                            <div key={lecture.lectureId || i} className="p-5 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 w-full">
                                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${lecture.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {lecture.completed ? <CheckCircle className="w-6 h-6" /> : <Play className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                      <p className="font-semibold text-gray-900">{lecture.lectureTitle}</p>
                                      {lecture.isPreviewFree && !isAlreadyEnrolled && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                          FREE PREVIEW
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['m'] })}
                                      </span>
                                      {!lecture.completed && lecture.lectureUrl && isAlreadyEnrolled && (
                                        <button
                                          onClick={() => window.open(lecture.lectureUrl, '_blank')}
                                          className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                          Connect to Lecture →
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {lecture.isPreviewFree && lecture.lectureUrl && !isAlreadyEnrolled && (
                                  <button
                                    onClick={() => openPreview(lecture.lectureUrl)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all whitespace-nowrap"
                                  >
                                    Preview
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Features */}
              {courseData.courseType === 'premium' && premiumFeatures && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Premium Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {premiumFeatures.hasInstructorAssistance && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                        <MessageSquare className="w-10 h-10 text-blue-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Instructor Assistance</h3>
                        <p className="text-gray-600 text-sm">{premiumFeatures.assistanceHours} hours of direct support</p>
                      </div>
                    )}
                    {premiumFeatures.hasCertificate && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
                        <Award className="w-10 h-10 text-green-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Certificate of Completion</h3>
                        <p className="text-gray-600 text-sm">Official certificate upon course completion</p>
                      </div>
                    )}
                    {premiumFeatures.hasLiveSessions && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                        <Video className="w-10 h-10 text-purple-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Live Sessions</h3>
                        <p className="text-gray-600 text-sm">Schedule: {premiumFeatures.liveSessionSchedule || 'To be announced'}</p>
                      </div>
                    )}
                    {premiumFeatures.hasCommunityAccess && (
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100">
                        <UsersIcon className="w-10 h-10 text-orange-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Community Access</h3>
                        <p className="text-gray-600 text-sm">Join our {premiumFeatures.communityType} community</p>
                      </div>
                    )}
                    {premiumFeatures.hasStudyGroups && (
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-2xl border border-cyan-100">
                        <BookOpen className="w-10 h-10 text-cyan-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Study Groups</h3>
                        <p className="text-gray-600 text-sm">Collaborate with fellow students</p>
                      </div>
                    )}
                    {premiumFeatures.hasCareerSupport && (
                      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-2xl border border-yellow-100">
                        <Briefcase className="w-10 h-10 text-yellow-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Career Support</h3>
                        <p className="text-gray-600 text-sm">Get help with job placement</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Handouts */}
              {premiumFeatures.handouts?.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Resources</h2>
                  <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                    {premiumFeatures.handouts.map((h, i) => (
                      <div key={h.id || i} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {isAlreadyEnrolled ? <FileText className="w-8 h-8 text-blue-600" /> : <Lock className="w-8 h-8 text-gray-400" />}
                          <div>
                            <h4 className="font-medium text-gray-900">{h.name}</h4>
                            <p className="text-sm text-gray-500">{(h.size / 1024).toFixed(1)} KB • {h.type}</p>
                          </div>
                        </div>
                        {isAlreadyEnrolled ? (
                          <a href={h.url} download className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors w-full sm:w-auto text-center">
                            Download
                          </a>
                        ) : (
                          <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium w-full sm:w-auto text-center">
                            Enroll to access
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {!isAlreadyEnrolled && (
                    <p className="text-sm text-gray-600 mt-3">Enroll in the course to access all downloadable resources</p>
                  )}
                </div>
              )}
            </div>

            {/* ---------- SIDEBAR ---------- */}
            <div className="w-full lg:w-96 order-1 lg:order-2">
              <div className="lg:sticky lg:top-8">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 mb-4">
                      <span className="text-5xl font-bold text-white">{currency}{finalPrice}</span>
                      {courseData.discount > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-xl text-blue-200 line-through">{currency}{courseData.coursePrice}</span>
                          <span className="bg-white text-blue-700 px-3 py-1 rounded-full font-bold text-sm">{courseData.discount}% OFF</span>
                        </div>
                      )}
                    </div>
                    <p className="text-blue-100 text-sm">{courseData.discount > 0 ? 'Limited time offer' : 'One-time payment'}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    <button
                      onClick={enrollCourse}
                      disabled={isAlreadyEnrolled || isLoading}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${isAlreadyEnrolled
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-default'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-[0.98]'
                        } ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing Payment...
                        </span>
                      ) : isAlreadyEnrolled ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Access Course
                        </span>
                      ) : (
                        'Enroll Now'
                      )}
                    </button>

                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <p className="text-sm text-green-800 font-medium">⭐ 30-day money-back guarantee</p>
                      <p className="text-xs text-green-700 mt-1">Full refund if you're not satisfied</p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg">This course includes:</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700">{totalLectures} on-demand lectures</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700">{totalDuration} total duration</span>
                        </div>
                        {premiumFeatures.hasCertificate && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Award className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">Certificate of completion</span>
                          </div>
                        )}
                        {premiumFeatures.handouts?.length > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-gray-700">
                              {isAlreadyEnrolled ? `${premiumFeatures.handouts.length} downloadable resources` : `${premiumFeatures.handouts.length} resources available`}
                            </span>
                          </div>
                        )}
                        {premiumFeatures.hasInstructorAssistance && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <HelpCircle className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-gray-700">Instructor support</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Globe className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-gray-700">Full lifetime access</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5">
                      <h4 className="font-bold text-gray-900 mb-4 text-center">Course Stats</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                            <span className="font-bold text-gray-900 text-xl">{courseRating.toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-gray-600">Rating</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="font-bold text-gray-900 text-xl">{courseData.enrolledStudents?.length || 0}</span>
                          </div>
                          <p className="text-sm text-gray-600">Students</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                          <BarChart3 className="w-4 h-4" />
                          <span>{completionPercentage}% average completion rate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CourseDetails;
