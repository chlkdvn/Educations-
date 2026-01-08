// components/educator/CourseManagement.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  FiBook, FiUsers, FiDollarSign, FiClock, FiEdit, 
  FiTrash2, FiPlus, FiVideo, FiFileText, FiCheck, 
  FiX, FiEye, FiEyeOff, FiDownload, FiLink, FiFilter,
  FiSearch, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiStar, FiBarChart2, FiCalendar, FiMessageSquare,
  FiFile, FiUpload, FiCloud, FiSave, FiType,
  FiClock as FiClockIcon,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';

const CourseManagement = () => {
  const { backendUrl, getToken, currency } = useContext(AppContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // States for editing
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingPremium, setIsEditingPremium] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  
  // Basic course form state
  const [basicForm, setBasicForm] = useState({
    courseTitle: '',
    courseDescription: '',
    coursePrice: 0,
    discount: 0,
    tags: '',
    difficulty: 'beginner',
    language: 'English',
    requirements: '',
    learningOutcomes: '',
    isPublished: 'pending' // Changed from boolean to string
  });

  // Premium features form state
  const [premiumForm, setPremiumForm] = useState({
    socialLinks: {
      facebook: '',
      whatsapp: '',
      telegram: '',
      discord: '',
      linkedin: '',
      twitter: '',
    },
    hasInstructorAssistance: false,
    assistanceHours: 5,
    assistanceSchedule: '',
    hasCommunityAccess: false,
    communityType: 'discord',
    hasLiveSessions: false,
    liveSessionSchedule: '',
    hasCertificate: false,
    hasStudyGroups: false,
    hasQnASessions: false,
    qnaSchedule: '',
    hasCareerSupport: false
  });

  // Course Content Management
  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isAddingLecture, setIsAddingLecture] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  
  // Lecture Form
  const [lectureForm, setLectureForm] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false
  });

  // Chapter Form
  const [chapterForm, setChapterForm] = useState({
    chapterTitle: '',
    chapterDescription: ''
  });

  // Upload states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');

  // Filtered courses based on status (pending, approved, rejected)
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'pending' && course.isPublished === 'pending') ||
                         (filterType === 'approved' && course.isPublished === 'approved') ||
                         (filterType === 'rejected' && course.isPublished === 'rejected') ||
                         (filterType === 'premium' && course.courseType === 'premium') ||
                         (filterType === 'basic' && course.courseType === 'basic');
    
    return matchesSearch && matchesFilter;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClockIcon className="w-4 h-4" />;
      case 'approved': return <FiCheckCircle className="w-4 h-4" />;
      case 'rejected': return <FiXCircle className="w-4 h-4" />;
      default: return <FiClockIcon className="w-4 h-4" />;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // Load Cloudinary Widget Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Initialize content when course is selected
  useEffect(() => {
    if (selectedCourse) {
      setBasicForm({
        courseTitle: selectedCourse.courseTitle || '',
        courseDescription: selectedCourse.courseDescription || '',
        coursePrice: selectedCourse.coursePrice || 0,
        discount: selectedCourse.discount || 0,
        tags: Array.isArray(selectedCourse.tags) ? selectedCourse.tags.join(', ') : selectedCourse.tags || '',
        difficulty: selectedCourse.difficulty || 'beginner',
        language: selectedCourse.language || 'English',
        requirements: Array.isArray(selectedCourse.requirements) ? selectedCourse.requirements.join(', ') : selectedCourse.requirements || '',
        learningOutcomes: Array.isArray(selectedCourse.learningOutcomes) ? selectedCourse.learningOutcomes.join(', ') : selectedCourse.learningOutcomes || '',
        isPublished: selectedCourse.isPublished || 'pending' // Updated
      });

      if (selectedCourse.courseType === 'premium' && selectedCourse.premiumFeatures) {
        setPremiumForm({
          socialLinks: selectedCourse.premiumFeatures.socialLinks || {
            facebook: '',
            whatsapp: '',
            telegram: '',
            discord: '',
            linkedin: '',
            twitter: '',
          },
          hasInstructorAssistance: selectedCourse.premiumFeatures.hasInstructorAssistance || false,
          assistanceHours: selectedCourse.premiumFeatures.assistanceHours || 5,
          assistanceSchedule: selectedCourse.premiumFeatures.assistanceSchedule || '',
          hasCommunityAccess: selectedCourse.premiumFeatures.hasCommunityAccess || false,
          communityType: selectedCourse.premiumFeatures.communityType || 'discord',
          hasLiveSessions: selectedCourse.premiumFeatures.hasLiveSessions || false,
          liveSessionSchedule: selectedCourse.premiumFeatures.liveSessionSchedule || '',
          hasCertificate: selectedCourse.premiumFeatures.hasCertificate || false,
          hasStudyGroups: selectedCourse.premiumFeatures.hasStudyGroups || false,
          hasQnASessions: selectedCourse.premiumFeatures.hasQnASessions || false,
          qnaSchedule: selectedCourse.premiumFeatures.qnaSchedule || '',
          hasCareerSupport: selectedCourse.premiumFeatures.hasCareerSupport || false
        });
      }

      // Initialize chapters and lectures
      if (selectedCourse.courseContent) {
        setChapters(selectedCourse.courseContent);
      }
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/getAllCourses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setCourses(data.courses);
        if (data.courses.length > 0 && !selectedCourse) {
          setSelectedCourse(data.courses[0]);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      const { data } = await axios.delete(
        `${backendUrl}/api/educator/deleteCourse/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        toast.success(data.message || 'Course deleted successfully');
        setCourses(courses.filter(course => course._id !== courseId));
        if (selectedCourse && selectedCourse._id === courseId) {
          setSelectedCourse(null);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCourseBasic = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = await getToken();
      
      // Prepare updates according to backend structure
      const updates = {
        courseTitle: basicForm.courseTitle,
        courseDescription: basicForm.courseDescription,
        coursePrice: Number(basicForm.coursePrice),
        discount: Number(basicForm.discount),
        tags: basicForm.tags ? basicForm.tags.split(',').map(tag => tag.trim()) : [],
        difficulty: basicForm.difficulty,
        language: basicForm.language,
        requirements: basicForm.requirements ? basicForm.requirements.split(',').map(req => req.trim()) : [],
        learningOutcomes: basicForm.learningOutcomes ? basicForm.learningOutcomes.split(',').map(out => out.trim()) : [],
        isPublished: basicForm.isPublished // Updated to string
      };

      const { data } = await axios.post(
        `${backendUrl}/api/educator/updateCourseBasic/${selectedCourse._id}`,
        updates,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (data.success) {
        toast.success('Course updated successfully');
        fetchCourses();
        setIsEditingBasic(false);
        if (data.course) {
          setSelectedCourse(data.course);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePremiumFeatures = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = await getToken();
      
      const { data } = await axios.post(
        `${backendUrl}/api/educator/updatePremiumFeatures/${selectedCourse._id}`,
        premiumForm,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (data.success) {
        toast.success('Premium features updated successfully');
        fetchCourses();
        setIsEditingPremium(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update premium features');
    } finally {
      setIsLoading(false);
    }
  };

  // Save course content to backend
  const saveCourseContent = async () => {
    if (!selectedCourse) return;
    
    try {
      setIsSavingContent(true);
      const token = await getToken();
      
      // Prepare chapters data with proper structure
      const formattedChapters = chapters.map((chapter, index) => ({
        chapterId: chapter.chapterId || `chapter_${Date.now()}_${index}`,
        chapterOrder: chapter.chapterOrder || index + 1,
        chapterTitle: chapter.chapterTitle,
        chapterDescription: chapter.chapterDescription || '',
        chapterContent: (chapter.chapterContent || []).map((lecture, lecIndex) => ({
          lectureId: lecture.lectureId || `lecture_${Date.now()}_${index}_${lecIndex}`,
          lectureOrder: lecture.lectureOrder || lecIndex + 1,
          lectureTitle: lecture.lectureTitle,
          lectureDuration: Number(lecture.lectureDuration) || 0,
          lectureUrl: lecture.lectureUrl,
          isPreviewFree: Boolean(lecture.isPreviewFree)
        }))
      }));

      // Note: You need to add this endpoint to your backend
      // First, let's use the updateCourseBasic endpoint with courseContent
      const updates = {
        courseContent: formattedChapters
      };

      const { data } = await axios.post(
        `${backendUrl}/api/educator/updateCourseBasic/${selectedCourse._id}`,
        updates,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (data.success) {
        toast.success('Course content saved successfully');
        fetchCourses(); // Refresh course data
        setIsEditingContent(false);
      }
    } catch (error) {
      console.error('Save content error:', error);
      toast.error(error.response?.data?.message || 'Failed to save course content');
    } finally {
      setIsSavingContent(false);
    }
  };

  // Cloudinary Video Upload
  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      toast.error('Cloudinary is loading, please wait...');
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(0);

    window.cloudinary.openUploadWidget(
      {
        cloudName: 'dhqe7gm5e',
        uploadPreset: 'course_lectures',
        sources: ['local', 'url', 'camera', 'dropbox', 'google_drive'],
        multiple: false,
        resourceType: 'video',
        clientAllowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'ogg', 'm4v'],
        maxFileSize: 200000000,
        folder: 'course-lectures',
        tags: ['lecture', 'education'],
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const uploadedUrl = result.info.secure_url;
          setLectureForm(prev => ({ ...prev, lectureUrl: uploadedUrl }));
          setVideoUrl(uploadedUrl);
          toast.success('Video uploaded successfully!');
          setUploadProgress(100);
        } else if (error) {
          toast.error(`Upload failed: ${error.message || 'Please try again.'}`);
        }
        setUploadingVideo(false);
      }
    );
  };

  // Chapter Management
  const addChapter = () => {
    if (!chapterForm.chapterTitle.trim()) {
      toast.error('Please enter chapter title');
      return;
    }

    const newChapter = {
      chapterId: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterTitle: chapterForm.chapterTitle,
      chapterDescription: chapterForm.chapterDescription || '',
      chapterContent: [],
      chapterOrder: chapters.length + 1
    };

    setChapters([...chapters, newChapter]);
    setChapterForm({ chapterTitle: '', chapterDescription: '' });
    setIsAddingChapter(false);
    toast.success('Chapter added successfully');
  };

  const deleteChapter = (chapterId) => {
    setChapters(chapters.filter(chapter => chapter.chapterId !== chapterId));
    toast.success('Chapter deleted');
  };

  // Lecture Management
  const addLecture = () => {
    if (!lectureForm.lectureTitle || !lectureForm.lectureDuration || !lectureForm.lectureUrl) {
      toast.error('Please fill all required fields');
      return;
    }

    const newLecture = {
      lectureId: `lecture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lectureTitle: lectureForm.lectureTitle,
      lectureDuration: Number(lectureForm.lectureDuration),
      lectureUrl: lectureForm.lectureUrl,
      isPreviewFree: lectureForm.isPreviewFree,
      lectureOrder: chapters
        .find(ch => ch.chapterId === selectedChapterId)
        ?.chapterContent?.length || 0 + 1
    };

    setChapters(chapters.map(chapter => {
      if (chapter.chapterId === selectedChapterId) {
        return {
          ...chapter,
          chapterContent: [...(chapter.chapterContent || []), newLecture]
        };
      }
      return chapter;
    }));

    setLectureForm({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false
    });
    setIsAddingLecture(false);
    setVideoUrl('');
    toast.success('Lecture added successfully');
  };

  const updateLecture = () => {
    if (!lectureForm.lectureTitle || !lectureForm.lectureDuration || !lectureForm.lectureUrl) {
      toast.error('Please fill all required fields');
      return;
    }

    setChapters(chapters.map(chapter => {
      if (chapter.chapterId === selectedChapterId) {
        return {
          ...chapter,
          chapterContent: chapter.chapterContent.map(lecture => 
            lecture.lectureId === editingLecture.lectureId 
              ? { 
                  ...lecture, 
                  lectureTitle: lectureForm.lectureTitle,
                  lectureDuration: Number(lectureForm.lectureDuration),
                  lectureUrl: lectureForm.lectureUrl,
                  isPreviewFree: lectureForm.isPreviewFree
                }
              : lecture
          )
        };
      }
      return chapter;
    }));

    setLectureForm({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false
    });
    setEditingLecture(null);
    setIsAddingLecture(false);
    setVideoUrl('');
    toast.success('Lecture updated successfully');
  };

  const deleteLecture = (chapterId, lectureId) => {
    setChapters(chapters.map(chapter => {
      if (chapter.chapterId === chapterId) {
        return {
          ...chapter,
          chapterContent: chapter.chapterContent.filter(lecture => lecture.lectureId !== lectureId)
        };
      }
      return chapter;
    }));
    toast.success('Lecture deleted');
  };

  const startEditLecture = (chapterId, lecture) => {
    setSelectedChapterId(chapterId);
    setEditingLecture(lecture);
    setLectureForm({
      lectureTitle: lecture.lectureTitle,
      lectureDuration: lecture.lectureDuration,
      lectureUrl: lecture.lectureUrl,
      isPreviewFree: lecture.isPreviewFree || false
    });
    setVideoUrl(lecture.lectureUrl);
    setIsAddingLecture(true);
  };

  // Submit course for review
  const submitForReview = async () => {
    if (!selectedCourse) return;
    
    if (!window.confirm('Are you sure you want to submit this course for review? You won\'t be able to edit it while it\'s under review.')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      
      const { data } = await axios.post(
        `${backendUrl}/api/educator/submitForReview/${selectedCourse._id}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (data.success) {
        toast.success('Course submitted for review successfully');
        fetchCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit course for review');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your courses and content</p>
            </div>
            <button
              onClick={fetchCourses}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Course List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Compact Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {['all', 'pending', 'approved', 'rejected', 'premium', 'basic'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterType(filter)}
                      className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                        filterType === filter
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compact Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all duration-200 hover:shadow cursor-pointer ${
                    selectedCourse?._id === course._id 
                      ? 'border-blue-500 ring-1 ring-blue-200' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  {/* Compact Course Image */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={course.courseThumbnail}
                      alt={course.courseTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        course.courseType === 'premium'
                          ? 'bg-purple-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {course.courseType?.charAt(0).toUpperCase() || 'B'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(course.isPublished)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(course.isPublished)}
                          <span>{getStatusText(course.isPublished).charAt(0)}</span>
                        </div>
                      </span>
                    </div>
                  </div>

                  {/* Compact Course Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                      {course.courseTitle}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <FiUsers className="w-3 h-3" />
                        <span>{course.enrolledStudents?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiVideo className="w-3 h-3" />
                        <span>{course.totalLectures || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-gray-900">
                          {currency}{course.coursePrice}
                        </span>
                        {course.discount > 0 && (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                            -{course.discount}%
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => deleteCourse(course._id, e)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Course"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiBook className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 text-sm mb-4">Try adjusting your search</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Course Details */}
          <div className="space-y-4">
            {selectedCourse ? (
              <>
                {/* Compact Course Header Card */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="max-w-[70%]">
                      <h2 className="text-lg font-bold text-gray-900 mb-2 truncate">{selectedCourse.courseTitle}</h2>
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          selectedCourse.courseType === 'premium'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedCourse.courseType?.toUpperCase() || 'BASIC'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedCourse.isPublished)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(selectedCourse.isPublished)}
                            <span>{getStatusText(selectedCourse.isPublished)}</span>
                          </div>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setIsEditingBasic(!isEditingBasic)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Course"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Show rejection reason if course is rejected */}
                  {selectedCourse.isPublished === 'rejected' && selectedCourse.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{selectedCourse.rejectionReason}</p>
                          {selectedCourse.reviewedAt && (
                            <p className="text-xs text-red-600 mt-2">
                              Reviewed on: {new Date(selectedCourse.reviewedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact Course Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <FiUsers className="text-blue-600 w-4 h-4" />
                        <span className="text-xs font-medium text-gray-700">Students</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedCourse.enrolledStudents?.length || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <FiVideo className="text-purple-600 w-4 h-4" />
                        <span className="text-xs font-medium text-gray-700">Lectures</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedCourse.totalLectures || 0}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <FiClock className="text-green-600 w-4 h-4" />
                        <span className="text-xs font-medium text-gray-700">Duration</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedCourse.totalDuration || 0} min</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <FiStar className="text-amber-600 w-4 h-4" />
                        <span className="text-xs font-medium text-gray-700">Rating</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{selectedCourse.averageRating || 0}/5</p>
                    </div>
                  </div>

                  {/* Compact Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setIsEditingContent(true)}
                      className="flex-1 min-w-[120px] px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <FiVideo className="w-4 h-4" />
                      Manage Content
                    </button>
                    
                    {selectedCourse.courseType === 'premium' && (
                      <button
                        onClick={() => setIsEditingPremium(!isEditingPremium)}
                        className="flex-1 min-w-[120px] px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <FiStar className="w-4 h-4" />
                        Premium
                      </button>
                    )}

                    {/* Submit for review button (only show for draft/pending courses) */}
                    {selectedCourse.isPublished === 'pending' && (
                      <button
                        onClick={submitForReview}
                        className="flex-1 min-w-[120px] px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <FiCheck className="w-4 h-4" />
                        Submit for Review
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <FiBook className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No Course Selected</h3>
                <p className="text-gray-600 text-sm">Select a course to manage</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Management Modal - COMPACT */}
      {isEditingContent && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Manage Course Content</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveCourseContent}
                  disabled={isSavingContent}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <FiSave className="w-4 h-4" />
                  {isSavingContent ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingContent(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-md"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Compact Add Chapter Button */}
              <button
                onClick={() => setIsAddingChapter(true)}
                className="w-full mb-4 p-4 border border-dashed border-gray-300 hover:border-blue-400 rounded-lg bg-gray-50 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FiPlus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Add New Chapter</p>
                  </div>
                </div>
              </button>

              {/* Compact Chapters List */}
              <div className="space-y-3">
                {chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.chapterId} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="p-3 flex items-center justify-between bg-white border-b">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedChapter(expandedChapter === chapter.chapterId ? null : chapter.chapterId)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedChapter === chapter.chapterId ? 
                            <FiChevronUp className="w-4 h-4" /> : 
                            <FiChevronDown className="w-4 h-4" />
                          }
                        </button>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                            Ch {chapterIndex + 1}: {chapter.chapterTitle}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {chapter.chapterContent?.length || 0} lectures
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedChapterId(chapter.chapterId);
                            setIsAddingLecture(true);
                          }}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 text-xs"
                        >
                          <FiPlus className="w-3 h-3" /> Lecture
                        </button>
                        <button
                          onClick={() => deleteChapter(chapter.chapterId)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {expandedChapter === chapter.chapterId && (
                      <div className="p-2 space-y-2">
                        {chapter.chapterContent?.map((lecture, lectureIndex) => (
                          <div key={lecture.lectureId} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <FiVideo className="text-blue-600 w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                  {lecture.lectureTitle}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <span>{lecture.lectureDuration} min</span>
                                  {lecture.isPreviewFree && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                      Preview
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditLecture(chapter.chapterId, lecture)}
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteLecture(chapter.chapterId, lecture.lectureId)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Add/Edit Chapter Modal */}
      {isAddingChapter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">Add Chapter</h3>
              <button
                onClick={() => setIsAddingChapter(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Chapter Title *
                  </label>
                  <input
                    type="text"
                    value={chapterForm.chapterTitle}
                    onChange={(e) => setChapterForm({...chapterForm, chapterTitle: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Introduction to React"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={chapterForm.chapterDescription}
                    onChange={(e) => setChapterForm({...chapterForm, chapterDescription: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows="2"
                    placeholder="Brief description..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addChapter}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Add Chapter
                </button>
                <button
                  onClick={() => setIsAddingChapter(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Add/Edit Lecture Modal */}
      {isAddingLecture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">
                {editingLecture ? 'Edit Lecture' : 'Add Lecture'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingLecture(false);
                  setEditingLecture(null);
                  setLectureForm({
                    lectureTitle: '',
                    lectureDuration: '',
                    lectureUrl: '',
                    isPreviewFree: false
                  });
                  setVideoUrl('');
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {/* Lecture Title & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Lecture Title *
                    </label>
                    <input
                      type="text"
                      value={lectureForm.lectureTitle}
                      onChange={(e) => setLectureForm({...lectureForm, lectureTitle: e.target.value})}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Introduction to Components"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration (min) *
                    </label>
                    <input
                      type="number"
                      value={lectureForm.lectureDuration}
                      onChange={(e) => setLectureForm({...lectureForm, lectureDuration: e.target.value})}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Lecture Video *
                  </label>
                  
                  {videoUrl ? (
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FiCloud className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-xs font-medium text-green-700">Video uploaded</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setLectureForm({...lectureForm, lectureUrl: ''});
                            setVideoUrl('');
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openCloudinaryWidget}
                      disabled={uploadingVideo}
                      className={`w-full p-4 border border-dashed rounded-lg text-center transition-colors ${
                        uploadingVideo
                          ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                          : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:border-blue-400'
                      }`}
                    >
                      {uploadingVideo ? (
                        <div className="space-y-1">
                          <div className="w-8 h-8 mx-auto border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                          <p className="text-xs">Uploading... {uploadProgress}%</p>
                        </div>
                      ) : (
                        <>
                          <FiUpload className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-xs font-medium">Upload Video</p>
                          <p className="text-xs mt-1 text-gray-500">MP4, MOV, AVI up to 200MB</p>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Free Preview Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Free Preview</p>
                    <p className="text-xs text-gray-500">Watch without purchase</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lectureForm.isPreviewFree}
                      onChange={(e) => setLectureForm({...lectureForm, isPreviewFree: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={editingLecture ? updateLecture : addLecture}
                    disabled={!lectureForm.lectureTitle || !lectureForm.lectureDuration || !lectureForm.lectureUrl}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {editingLecture ? 'Update Lecture' : 'Add Lecture'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingLecture(false);
                      setEditingLecture(null);
                      setLectureForm({
                        lectureTitle: '',
                        lectureDuration: '',
                        lectureUrl: '',
                        isPreviewFree: false
                      });
                      setVideoUrl('');
                    }}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Basic Course Modal */}
      {isEditingBasic && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">Edit Course Details</h3>
              <button
                onClick={() => setIsEditingBasic(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4">
              <form onSubmit={updateCourseBasic}>
                <div className="space-y-4">
                  {/* Course Status Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Course Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['pending', 'approved', 'rejected'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setBasicForm({...basicForm, isPublished: status})}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            basicForm.isPublished === status
                              ? getStatusColor(status)
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {getStatusText(status)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Course Title */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={basicForm.courseTitle}
                      onChange={(e) => setBasicForm({...basicForm, courseTitle: e.target.value})}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  {/* Course Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Course Description *
                    </label>
                    <textarea
                      value={basicForm.courseDescription}
                      onChange={(e) => setBasicForm({...basicForm, courseDescription: e.target.value})}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      rows="3"
                      required
                    />
                  </div>

                  {/* Price and Discount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price ({currency})
                      </label>
                      <input
                        type="number"
                        value={basicForm.coursePrice}
                        onChange={(e) => setBasicForm({...basicForm, coursePrice: e.target.value})}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        value={basicForm.discount}
                        onChange={(e) => setBasicForm({...basicForm, discount: e.target.value})}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBasic(false)}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;