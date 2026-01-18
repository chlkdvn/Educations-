import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const uniqid = () => Math.random().toString(36).substr(2, 9);

// Course categories - must match backend exactly
const categories = [
  '3D Design',
  'Arts & Humanities',
  'Graphic Design',
  'Web Development',
  'Marketing',
  'App Development',
  'Frontend Development',
  'Backend Engineering',
  'Data Science',
  'AI & Machine Learning',
  'Cybersecurity',
  'Cloud Computing',
  'Mobile Development',
  'UI/UX Design',
  'Software Engineering'
];

const AddCourse = () => {
  const { backendUrl, getToken } = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const fileInputRef = useRef(null);
  const popupRef = useRef(null);

  // Course states
  const [courseTitle, setCourseTitle] = useState('');
  const [courseType, setCourseType] = useState('basic');
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [category, setCategory] = useState(categories[0]); // NEW: Category state
  const [image, setImage] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // NEW: course overview / promo video
  const [promoUrl, setPromoUrl] = useState('');
  const [promoUploadMethod, setPromoUploadMethod] = useState('cloudinary');
  const [promoUrlInput, setPromoUrlInput] = useState('');
  const [promoUploading, setPromoUploading] = useState(false);
  const [promoUploadProgress, setPromoUploadProgress] = useState(0);

  // Premium course features
  const [premiumFeatures, setPremiumFeatures] = useState({
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
    handouts: [],
    hasStudyGroups: false,
    hasQnASessions: false,
    qnaSchedule: '',
    hasCareerSupport: false,
  });

  // Lecture details
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: '',
    lectureUrl: '',
    isPreviewFree: false,
  });

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMethod, setUploadMethod] = useState('cloudinary');
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Handout upload state
  const [handoutUploading, setHandoutUploading] = useState(false);

  // Additional course fields
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [language, setLanguage] = useState('English');
  const [requirements, setRequirements] = useState([]);
  const [requirementInput, setRequirementInput] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [outcomeInput, setOutcomeInput] = useState('');

  // Initialize Quill Editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'video'],
            ['clean'],
          ],
        },
      });
    }
  }, []);

  // Load Cloudinary Widget Script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js ';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle social link change
  const handleSocialLinkChange = (platform, value) => {
    setPremiumFeatures(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  // ---------- PROMO VIDEO HELPERS ----------
  const openPromoCloudinaryWidget = () => {
    if (!window.cloudinary) {
      toast.error('Cloudinary is loading, please wait...');
      return;
    }
    setPromoUploading(true);
    setPromoUploadProgress(0);
    window.cloudinary.openUploadWidget(
      {
        cloudName: 'dhqe7gm5e',
        uploadPreset: 'course_lectures',
        sources: ['local', 'url', 'camera', 'dropbox', 'google_drive'],
        multiple: false,
        resourceType: 'video',
        clientAllowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'ogg', 'm4v'],
        maxFileSize: 200000000,
        folder: 'course-promos',
        tags: ['promo', 'course-overview'],
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          const url = result.info.secure_url;
          setPromoUrl(url);
          setPromoUrlInput(url);
          toast.success('Course overview video uploaded to Cloudinary!');
          setPromoUploadProgress(100);
        } else if (error) {
          toast.error(`Upload failed: ${error.message || 'Please try again.'}`);
          console.error(error);
        }
        setPromoUploading(false);
      }
    );
  };

  const uploadPromoVideoDirect = async (file) => {
    setPromoUploading(true);
    setPromoUploadProgress(0);
    try {
      const cloudName = 'dhqe7gm5e';
      const uploadPreset = 'course_lectures';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'course-promos');
      formData.append('tags', 'promo,course-overview');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/ ${cloudName}/upload`,
        formData,
        {
          onUploadProgress: (e) => {
            const p = Math.round((e.loaded * 100) / e.total);
            setPromoUploadProgress(p);
          },
        }
      );
      const url = response.data.secure_url;
      setPromoUrl(url);
      setPromoUrlInput(url);
      toast.success('Course overview video uploaded to Cloudinary!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || 'Failed to upload promo video');
    } finally {
      setPromoUploading(false);
    }
  };

  const handlePromoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm', 'video/ogg'];
    const max = 200 * 1024 * 1024;
    if (!allowed.includes(file.type)) {
      toast.error('Invalid video format. Please upload MP4, MOV, AVI, MKV, WEBM, or OGG files.');
      return;
    }
    if (file.size > max) {
      toast.error('Video file too large. Maximum size is 200MB.');
      return;
    }
    uploadPromoVideoDirect(file);
  };

  const handlePromoUrlInput = () => {
    if (!promoUrlInput.trim()) {
      toast.error('Please enter a video URL');
      return;
    }
    try {
      new URL(promoUrlInput);
      setPromoUrl(promoUrlInput);
      toast.success('Course overview URL added!');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  // ---------- END PROMO VIDEO HELPERS ----------

  // Handle handout file upload to Cloudinary
  const handleHandoutUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/gif'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, Word, Excel, PowerPoint, images, or text files.');
      return;
    }
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 50MB.');
      return;
    }

    setHandoutUploading(true);
    try {
      const cloudName = 'dhqe7gm5e';
      const uploadPreset = 'course_lectures';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'course-handouts');
      formData.append('tags', 'handout,education');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/ ${cloudName}/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        }
      );

      const newHandout = {
        id: uniqid(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: response.data.secure_url,
        uploadedAt: new Date().toISOString(),
      };

      setPremiumFeatures(prev => ({
        ...prev,
        handouts: [...prev.handouts, newHandout]
      }));
      toast.success('Handout uploaded to Cloudinary successfully!');
      e.target.value = '';
    } catch (error) {
      console.error('Handout upload error:', error);
      if (error.response?.data?.error?.message) {
        toast.error(`Cloudinary error: ${error.response.data.error.message}`);
      } else {
        toast.error('Failed to upload handout to Cloudinary');
      }
    } finally {
      setHandoutUploading(false);
    }
  };

  // Remove handout
  const removeHandout = (id) => {
    setPremiumFeatures(prev => ({
      ...prev,
      handouts: prev.handouts.filter(h => h.id !== id)
    }));
    toast.success('Handout removed');
  };

  // Preview handout
  const previewHandout = (handout) => {
    window.open(handout.url, '_blank');
  };

  // Open Cloudinary Upload Widget for videos
  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      toast.error('Cloudinary is loading, please wait...');
      return;
    }
    setUploading(true);
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
          const videoUrl = result.info.secure_url;
          setLectureDetails(prev => ({ ...prev, lectureUrl: videoUrl }));
          setVideoUrlInput(videoUrl);
          toast.success('Video uploaded to Cloudinary successfully!');
          setUploadProgress(100);
        } else if (error) {
          toast.error(`Upload failed: ${error.message || 'Please try again.'}`);
          console.error(error);
        }
        setUploading(false);
      }
    );
  };

  // Handle URL input for video
  const handleVideoUrlInput = () => {
    if (!videoUrlInput.trim()) {
      toast.error('Please enter a video URL');
      return;
    }
    try {
      new URL(videoUrlInput);
      setLectureDetails(prev => ({ ...prev, lectureUrl: videoUrlInput }));
      toast.success('Video URL added successfully!');
    } catch (error) {
      toast.error('Please enter a valid URL');
    }
  };

  // Upload video to Cloudinary directly (alternative method)
  const uploadVideoToCloudinary = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const cloudName = 'dhqe7gm5e';
      const uploadPreset = 'course_lectures';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'course-lectures');
      formData.append('tags', 'lecture,education');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/ ${cloudName}/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        }
      );

      const videoUrl = response.data.secure_url;
      setLectureDetails(prev => ({ ...prev, lectureUrl: videoUrl }));
      setVideoUrlInput(videoUrl);
      toast.success('Video uploaded to Cloudinary successfully!');
    } catch (error) {
      console.error('Video upload error:', error);
      if (error.response?.data?.error?.message) {
        toast.error(`Cloudinary error: ${error.response.data.error.message}`);
      } else {
        toast.error('Failed to upload video to Cloudinary');
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle video file upload
  const handleVideoFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm', 'video/ogg'];
    const maxSize = 200 * 1024 * 1024; // 200MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid video format. Please upload MP4, MOV, AVI, MKV, WEBM, or OGG files.');
      return;
    }
    if (file.size > maxSize) {
      toast.error('Video file too large. Maximum size is 200MB.');
      return;
    }
    uploadVideoToCloudinary(file);
  };

  // Preview video
  const handlePreviewVideo = (chapterId, lectureIndex) => {
    const chapter = chapters.find(ch => ch.chapterId === chapterId);
    if (chapter && chapter.chapterContent[lectureIndex]) {
      setCurrentLecture(chapter.chapterContent[lectureIndex]);
      setShowPreview(true);
    }
  };

  // Smooth fake progress bar
  useEffect(() => {
    if (uploading && uploadProgress < 90) {
      const timer = setTimeout(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 600);
      return () => clearTimeout(timer);
    }
    if (!uploading && !handoutUploading) {
      setUploadProgress(0);
    }
  }, [uploading, handoutUploading, uploadProgress]);

  // Chapter Handlers
  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:');
      if (title?.trim()) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title.trim(),
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length ? chapters[chapters.length - 1].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === 'remove') {
      setChapters(chapters.filter(ch => ch.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(chapters.map(ch =>
        ch.chapterId === chapterId ? { ...ch, collapsed: !ch.collapsed } : ch
      ));
    }
  };

  // Lecture Handlers
  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
      setLectureDetails({
        lectureTitle: '',
        lectureDuration: '',
        lectureUrl: '',
        isPreviewFree: false,
      });
      setVideoUrlInput('');
      setUploadMethod('cloudinary');
      setUploadProgress(0);
    } else if (action === 'remove') {
      setChapters(prev => prev.map(ch => {
        if (ch.chapterId === chapterId) {
          ch.chapterContent.splice(lectureIndex, 1);
        }
        return ch;
      }));
    } else if (action === 'preview') {
      handlePreviewVideo(chapterId, lectureIndex);
    }
  };

  const addLecture = () => {
    if (!lectureDetails.lectureTitle || !lectureDetails.lectureDuration || !lectureDetails.lectureUrl) {
      toast.error('Please fill all fields and provide a video');
      return;
    }
    setChapters(prev => prev.map(ch => {
      if (ch.chapterId === currentChapterId) {
        const newLecture = {
          ...lectureDetails,
          lectureId: uniqid(),
          lectureOrder: ch.chapterContent.length
            ? ch.chapterContent[ch.chapterContent.length - 1].lectureOrder + 1
            : 1,
        };
        ch.chapterContent.push(newLecture);
      }
      return ch;
    }));
    toast.success('Lecture added successfully!');
    setShowPopup(false);
  };

  // Handle premium feature toggle
  const handlePremiumFeatureToggle = (feature) => {
    setPremiumFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  // Handle tags
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle requirements
  const handleAddRequirement = () => {
    if (requirementInput.trim() && !requirements.includes(requirementInput.trim())) {
      setRequirements([...requirements, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (reqToRemove) => {
    setRequirements(requirements.filter(req => req !== reqToRemove));
  };

  // Handle learning outcomes
  const handleAddOutcome = () => {
    if (outcomeInput.trim() && !learningOutcomes.includes(outcomeInput.trim())) {
      setLearningOutcomes([...learningOutcomes, outcomeInput.trim()]);
      setOutcomeInput('');
    }
  };

  const handleRemoveOutcome = (outcomeToRemove) => {
    setLearningOutcomes(learningOutcomes.filter(outcome => outcome !== outcomeToRemove));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('image')) return '🖼️';
    return '📎';
  };

  // Submit Course
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!image) {
        toast.error('Please select a course thumbnail');
        setIsLoading(false);
        return;
      }

      // Validate that premium courses have premium features
      if (courseType === 'premium') {
        if (!premiumFeatures.socialLinks || !premiumFeatures.handouts) {
          toast.error('Premium courses must have social links and handouts configured');
          setIsLoading(false);
          return;
        }
      }

      // Validate course content
      if (chapters.length === 0) {
        toast.error('Please add at least one chapter to the course');
        setIsLoading(false);
        return;
      }

      // Validate each chapter has at least one lecture
      for (const chapter of chapters) {
        if (chapter.chapterContent.length === 0) {
          toast.error(`Chapter "${chapter.chapterTitle}" must have at least one lecture`);
          setIsLoading(false);
          return;
        }
      }

      // Prepare course data matching backend schema
      const courseData = {
        courseTitle,
        courseType,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        category, // ← CATEGORY ADDED HERE
        promoUrl, // ← PROMO VIDEO ADDED HERE
        courseContent: chapters.map(chapter => ({
          chapterId: chapter.chapterId,
          chapterOrder: chapter.chapterOrder,
          chapterTitle: chapter.chapterTitle,
          chapterContent: chapter.chapterContent.map(lecture => ({
            lectureId: lecture.lectureId,
            lectureTitle: lecture.lectureTitle,
            lectureDuration: Number(lecture.lectureDuration),
            lectureUrl: lecture.lectureUrl,
            isPreviewFree: lecture.isPreviewFree,
            lectureOrder: lecture.lectureOrder
          }))
        })),
        premiumFeatures: courseType === 'premium' ? {
          ...premiumFeatures,
          handouts: premiumFeatures.handouts.map(handout => ({
            id: handout.id,
            name: handout.name,
            type: handout.type,
            size: handout.size,
            url: handout.url,
            uploadedAt: handout.uploadedAt
          }))
        } : null,
        tags,
        difficulty,
        language,
        requirements,
        learningOutcomes
      };

      const formData = new FormData();
      formData.append('courseData', JSON.stringify(courseData));
      formData.append('image', image);

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/educator/add-course`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (data.success) {
        toast.success(data.message || 'Course created successfully!');

        // Reset form including category
        setCourseTitle('');
        setCourseType('basic');
        setCoursePrice(0);
        setDiscount(0);
        setCategory(categories[0]);
        setImage(null);
        setChapters([]);
        setTags([]);
        setDifficulty('beginner');
        setLanguage('English');
        setRequirements([]);
        setLearningOutcomes([]);
        setPromoUrl('');
        setPremiumFeatures({
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
          handouts: [],
          hasStudyGroups: false,
          hasQnASessions: false,
          qnaSchedule: '',
          hasCareerSupport: false,
        });
        quillRef.current.root.innerHTML = '';

        setTimeout(() => {
          window.location.href = '/educator/my-courses';
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to create course');
      }
    } catch (err) {
      console.error('Course submission error:', err);
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach(error => toast.error(error));
      } else {
        toast.error(err.response?.data?.message || 'Failed to create course. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-auto py-8 px-4 md:px-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Create New Course</h1>
          <p className='text-gray-600 mt-2'>Design your course structure and set up features</p>
        </div>
        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Course Basic Info Card */}
          <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-800 mb-6'>Course Information</h2>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Course Title */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Course Title *
                </label>
                <input
                  onChange={(e) => setCourseTitle(e.target.value)}
                  value={courseTitle}
                  type="text"
                  placeholder="e.g., Advanced React Masterclass"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* Course Category - NEW */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Course Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Course Type Selector */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Course Type *
                </label>
                <div className='flex space-x-4'>
                  <button
                    type='button'
                    onClick={() => setCourseType('basic')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${courseType === 'basic'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <div className='flex items-center justify-center space-x-2'>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      <span>Basic Course</span>
                    </div>
                  </button>
                  <button
                    type='button'
                    onClick={() => setCourseType('premium')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${courseType === 'premium'
                      ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                      : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <div className='flex items-center justify-center space-x-2'>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Premium Course</span>
                    </div>
                  </button>
                </div>
                <p className='text-sm text-gray-500 mt-2'>
                  {courseType === 'basic'
                    ? 'Basic courses include video lectures and quizzes.'
                    : 'Premium courses include all basic features plus social features and instructor assistance.'}
                </p>
              </div>

              {/* Price Inputs */}
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Course Price ({courseType === 'premium' ? 'Premium' : 'Basic'})
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>₦</span>
                    <input
                      onChange={(e) => setCoursePrice(e.target.value)}
                      value={coursePrice}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Discount %
                  </label>
                  <div className='relative'>
                    <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'>%</span>
                    <input
                      onChange={(e) => setDiscount(e.target.value)}
                      value={discount}
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Course Thumbnail *
                </label>
                <div className='flex items-center space-x-4'>
                  <label className='cursor-pointer group'>
                    <div className='w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center group-hover:border-blue-500 transition-colors bg-gray-50'>
                      {image ? (
                        <img
                          src={URL.createObjectURL(image)}
                          alt="Preview"
                          className='w-full h-full object-cover rounded-xl'
                        />
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className='text-sm text-gray-500'>Upload Image</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files[0])}
                      className="hidden"
                      required
                    />
                  </label>
                  <div className='flex-1'>
                    <p className='text-sm text-gray-600'>Recommended: 1280x720px JPG or PNG</p>
                    <p className='text-sm text-gray-500'>This will be displayed as course cover</p>
                  </div>
                </div>
              </div>

              {/* NEW: Course Overview / Promo Video */}
              <div className='lg:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Course Overview Video
                </label>
                <div className='flex space-x-4 mb-4'>
                  <button
                    type='button'
                    onClick={() => setPromoUploadMethod('cloudinary')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm transition-all ${promoUploadMethod === 'cloudinary'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    Upload Video
                  </button>
                  <button
                    type='button'
                    onClick={() => setPromoUploadMethod('url')}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm transition-all ${promoUploadMethod === 'url'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    Enter URL
                  </button>
                </div>

                {promoUploadMethod === 'cloudinary' ? (
                  <>
                    {promoUrl ? (
                      <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                              <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z' clipRule='evenodd' />
                              </svg>
                            </div>
                            <div>
                              <span className='text-green-700 font-medium'>Course overview video uploaded!</span>
                              <p className='text-sm text-green-600 truncate max-w-xs'>{promoUrl}</p>
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={() => setPromoUrl('')}
                            className='text-red-600 hover:text-red-800 font-medium text-sm'
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        <button
                          type='button'
                          onClick={openPromoCloudinaryWidget}
                          disabled={promoUploading}
                          className={`w-full p-6 border-2 border-dashed rounded-xl text-center transition-all ${promoUploading
                            ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                            : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:border-blue-400'}`}
                        >
                          {promoUploading ? (
                            <div className='space-y-2'>
                              <div className='w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' />
                              <p>Uploading... {promoUploadProgress}%</p>
                            </div>
                          ) : (
                            <>
                              <svg className='w-12 h-12 mx-auto mb-3 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                              </svg>
                              <p className='font-medium'>Click to upload course overview video</p>
                              <p className='text-sm mt-1'>MP4, MOV, AVI up to 200MB</p>
                            </>
                          )}
                        </button>
                        <div className='text-center'>
                          <span className='text-gray-500 text-sm'>OR</span>
                        </div>
                        <div className='relative'>
                          <input
                            type='file'
                            id='promoFileUpload'
                            onChange={handlePromoFile}
                            accept='video/mp4,video/mov,video/avi,video/mkv,video/webm,video/ogg'
                            className='hidden'
                          />
                          <label
                            htmlFor='promoFileUpload'
                            className={`block w-full p-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${promoUploading
                              ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                              : 'border-green-300 bg-green-50 hover:bg-green-100 text-green-700 hover:border-green-400'}`}
                          >
                            <svg className='w-12 h-12 mx-auto mb-3 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 13l-3-3m0 0l-3 3m3-3v12' />
                            </svg>
                            <p className='font-medium'>Choose video file for direct upload</p>
                            <p className='text-sm mt-1'>MP4, MOV, AVI, MKV, WEBM, OGG up to 200MB</p>
                          </label>
                        </div>
                      </div>
                    )}
                    {promoUploading && (
                      <div className='mt-4'>
                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                          <span>Uploading to Cloudinary...</span>
                          <span>{promoUploadProgress}%</span>
                        </div>
                        <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300'
                            style={{ width: `${promoUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Enter Video URL</label>
                      <div className='flex space-x-2'>
                        <input
                          type='url'
                          value={promoUrlInput}
                          onChange={e => setPromoUrlInput(e.target.value)}
                          placeholder='https://example.com/video.mp4 or Cloudinary URL'
                          className='flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
                        />
                        <button
                          type='button'
                          onClick={handlePromoUrlInput}
                          className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                        >
                          Add URL
                        </button>
                      </div>
                      <p className='text-xs text-gray-500 mt-2'>Supports Cloudinary, YouTube, Vimeo, or direct video links</p>
                    </div>
                    {promoUrl && (
                      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center'>
                              <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z' clipRule='evenodd' />
                              </svg>
                            </div>
                            <div>
                              <span className='text-green-700 font-medium'>Course overview URL added!</span>
                              <p className='text-sm text-green-600 truncate max-w-xs'>{promoUrl}</p>
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={() => {
                              setPromoUrl('');
                              setPromoUrlInput('');
                            }}
                            className='text-red-600 hover:text-red-800 font-medium text-sm'
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Course Difficulty *
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Course Language *
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g., English"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Tags */}
            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Course Tags
              </label>
              <div className='flex items-center space-x-2 mb-2'>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag (e.g., React, JavaScript)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <div key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Course Requirements
              </label>
              <div className='flex items-center space-x-2 mb-2'>
                <input
                  type="text"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRequirement())}
                  placeholder="Add a requirement (e.g., Basic HTML knowledge)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddRequirement}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {requirements.length > 0 && (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {requirements.map((req, index) => (
                    <li key={index} className="flex items-center justify-between text-gray-700">
                      <span>{req}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(req)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Learning Outcomes */}
            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                What Students Will Learn
              </label>
              <div className='flex items-center space-x-2 mb-2'>
                <input
                  type="text"
                  value={outcomeInput}
                  onChange={(e) => setOutcomeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOutcome())}
                  placeholder="Add a learning outcome (e.g., Build React applications)"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddOutcome}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {learningOutcomes.length > 0 && (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-center justify-between text-gray-700">
                      <span>{outcome}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOutcome(outcome)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Course Description */}
            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Course Description *
              </label>
              <div className="border border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
                <div ref={editorRef} className="min-h-[200px]"></div>
              </div>
            </div>
          </div>

          {/* Premium Features Section */}
          {courseType === 'premium' && (
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-xl font-semibold text-gray-800'>Premium Features</h2>
                  <p className='text-gray-600 text-sm mt-1'>Add exclusive features for your premium students</p>
                </div>
                <span className='px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium'>
                  Premium Course
                </span>
              </div>
              <div className='space-y-8'>
                {/* Social Links */}
                <div className='border border-gray-200 rounded-xl p-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    Social Media & Community Links
                  </h3>
                  <p className='text-gray-600 mb-6 text-sm'>Add links to social media groups and communities for your students</p>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        <span className='flex items-center'>
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook Group Link
                        </span>
                      </label>
                      <input
                        type="url"
                        value={premiumFeatures.socialLinks.facebook}
                        onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/groups/your-group "
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        <span className='flex items-center'>
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.677-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.438 9.88-9.888 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893 0-3.18-1.24-6.162-3.495-8.411" />
                          </svg>
                          WhatsApp Group Link
                        </span>
                      </label>
                      <input
                        type="url"
                        value={premiumFeatures.socialLinks.whatsapp}
                        onChange={(e) => handleSocialLinkChange('whatsapp', e.target.value)}
                        placeholder="https://chat.whatsapp.com/invite/your-group "
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        <span className='flex items-center'>
                          <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                          </svg>
                          Telegram Group Link
                        </span>
                      </label>
                      <input
                        type="url"
                        value={premiumFeatures.socialLinks.telegram}
                        onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
                        placeholder="https://t.me/your-group "
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        <span className='flex items-center'>
                          <svg className="w-4 h-4 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0a12.64 12.64 0 00-.617-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057a19.9 19.9 0 005.993 3.03a.078.078 0 00.084-.028a14.09 14.09 0 001.226-1.994a.076.076 0 00-.041-.106a13.107 13.107 0 01-1.872-.892a.077.077 0 01-.008-.128c.125-.094.251-.188.372-.284a.076.076 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.076.076 0 01.078.01c.12.096.245.19.371.284a.077.077 0 01-.006.127a12.3 12.3 0 01-1.873.892a.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028a19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM11.944 17.168c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                          </svg>
                          Discord Server Link
                        </span>
                      </label>
                      <input
                        type="url"
                        value={premiumFeatures.socialLinks.discord}
                        onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                        placeholder="https://discord.gg/your-server "
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Instructor Assistance */}
                <div className='border border-gray-200 rounded-xl p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-gray-800 flex items-center'>
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Instructor Assistance
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={premiumFeatures.hasInstructorAssistance}
                        onChange={() => handlePremiumFeatureToggle('hasInstructorAssistance')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {premiumFeatures.hasInstructorAssistance && (
                    <div className='space-y-4 mt-4'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Assistance Hours Per Week
                          </label>
                          <select
                            value={premiumFeatures.assistanceHours}
                            onChange={(e) => setPremiumFeatures(prev => ({ ...prev, assistanceHours: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          >
                            <option value={1}>1 hour</option>
                            <option value={2}>2 hours</option>
                            <option value={5}>5 hours</option>
                            <option value={10}>10 hours</option>
                            <option value={15}>15 hours</option>
                            <option value={20}>20 hours</option>
                          </select>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Assistance Schedule
                          </label>
                          <input
                            type="text"
                            value={premiumFeatures.assistanceSchedule}
                            onChange={(e) => setPremiumFeatures(prev => ({ ...prev, assistanceSchedule: e.target.value }))}
                            placeholder="e.g., Weekdays 6-8 PM EST"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Handout Materials */}
                <div className='border border-gray-200 rounded-xl p-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4 flex items-center'>
                    <svg className="w-5 h-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Handout Materials (PDF, Docs, Slides, etc.)
                  </h3>
                  <p className='text-gray-600 mb-6 text-sm'>Upload additional study materials for your students. Files will be uploaded to Cloudinary using the course_lectures preset.</p>
                  <div className='mb-6'>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleHandoutUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      disabled={handoutUploading}
                      className={`w-full p-8 border-2 border-dashed rounded-xl text-center transition-all ${handoutUploading
                        ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                        : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:border-amber-400'
                        }`}
                    >
                      {handoutUploading ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 mx-auto border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                          <p>Uploading to Cloudinary... {uploadProgress}%</p>
                        </div>
                      ) : (
                        <>
                          <svg className="w-12 h-12 mx-auto mb-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className='font-medium'>Click to upload handout materials</p>
                          <p className='text-sm mt-1'>PDF, Word, Excel, PowerPoint, images, or text files up to 50MB</p>
                          <p className='text-xs text-amber-600 mt-1'>Using course_lectures upload preset</p>
                        </>
                      )}
                    </button>
                  </div>
                  {handoutUploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Uploading handout to Cloudinary...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {premiumFeatures.handouts.length > 0 && (
                    <div className='space-y-3'>
                      <h4 className='font-medium text-gray-700'>Uploaded Materials ({premiumFeatures.handouts.length})</h4>
                      <div className='space-y-2'>
                        {premiumFeatures.handouts.map((handout) => (
                          <div key={handout.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group'>
                            <div className='flex items-center space-x-3'>
                              <div className='text-2xl'>{getFileIcon(handout.type)}</div>
                              <div>
                                <p className='font-medium text-gray-900 truncate max-w-xs'>{handout.name}</p>
                                <p className='text-sm text-gray-500'>
                                  {formatFileSize(handout.size)} • {new Date(handout.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <button
                                type="button"
                                onClick={() => previewHandout(handout)}
                                className='text-blue-600 hover:text-blue-800 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity'
                                title='Preview'
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeHandout(handout.id)}
                                className='text-red-500 hover:text-red-700 p-1.5'
                                title='Remove'
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Premium Features */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='border border-gray-200 rounded-xl p-6'>
                    <div className='flex items-center justify-between mb-2'>
                      <h4 className='font-medium text-gray-800'>Completion Certificate</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={premiumFeatures.hasCertificate}
                          onChange={() => handlePremiumFeatureToggle('hasCertificate')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <p className='text-sm text-gray-600'>Issue certificates upon course completion</p>
                  </div>
                  <div className='border border-gray-200 rounded-xl p-6'>
                    <div className='flex items-center justify-between mb-2'>
                      <h4 className='font-medium text-gray-800'>Live Q&A Sessions</h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={premiumFeatures.hasQnASessions}
                          onChange={() => handlePremiumFeatureToggle('hasQnASessions')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    {premiumFeatures.hasQnASessions && (
                      <input
                        type="text"
                        value={premiumFeatures.qnaSchedule}
                        onChange={(e) => setPremiumFeatures(prev => ({ ...prev, qnaSchedule: e.target.value }))}
                        placeholder="e.g., Every Saturday 2 PM EST"
                        className="w-full mt-2 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Course Content Section */}
          <div className='bg-white rounded-2xl shadow-lg p-6 border border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-800 mb-6'>Course Content</h2>
            {chapters.length === 0 ? (
              <div className='text-center py-12'>
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className='text-gray-500 mt-4'>No chapters added yet. Start by adding your first chapter!</p>
              </div>
            ) : (
              <div className='space-y-4'>
                {chapters.map((chapter, chapterIndex) => (
                  <div key={chapter.chapterId} className='border border-gray-200 rounded-xl overflow-hidden'>
                    <div className='bg-gray-50 px-6 py-4 flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <button
                          onClick={() => handleChapter('toggle', chapter.chapterId)}
                          className='text-gray-500 hover:text-gray-700'
                        >
                          <svg className={`w-5 h-5 transition-transform ${chapter.collapsed ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div>
                          <h3 className='font-medium text-gray-900'>
                            Chapter {chapterIndex + 1}: {chapter.chapterTitle}
                          </h3>
                          <p className='text-sm text-gray-500'>
                            {chapter.chapterContent.length} lecture{chapter.chapterContent.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleChapter('remove', chapter.chapterId)}
                        className='text-red-500 hover:text-red-700 p-1'
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {!chapter.collapsed && (
                      <div className='p-6 space-y-3'>
                        {chapter.chapterContent.map((lecture, lectureIndex) => (
                          <div key={lecture.lectureId} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group'>
                            <div className='flex items-center space-x-3'>
                              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <p className='font-medium text-gray-900'>{lecture.lectureTitle}</p>
                                <p className='text-sm text-gray-500'>
                                  {lecture.lectureDuration} minutes
                                  {lecture.isPreviewFree && (
                                    <span className='ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'>
                                      Free Preview
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              {/* PREVIEW BUTTON REMOVED */}
                              <button
                                onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)}
                                className='text-gray-400 hover:text-red-500 p-1'
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleLecture('add', chapter.chapterId)}
                          className='w-full py-3 px-4 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg text-gray-600 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2'
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Lecture</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => handleChapter('add')}
              className='mt-6 w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all flex items-center justify-center space-x-2'
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Chapter</span>
            </button>
          </div>

          {/* Submit Buttons */}
          <div className='flex justify-end space-x-4'>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to reset the form? All data will be lost.')) {
                  setCourseTitle('');
                  setCourseType('basic');
                  setCoursePrice(0);
                  setDiscount(0);
                  setCategory(categories[0]);
                  setImage(null);
                  setChapters([]);
                  setTags([]);
                  setDifficulty('beginner');
                  setLanguage('English');
                  setRequirements([]);
                  setLearningOutcomes([]);
                  setPromoUrl('');
                  setPremiumFeatures({
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
                    handouts: [],
                    hasStudyGroups: false,
                    hasQnASessions: false,
                    qnaSchedule: '',
                    hasCareerSupport: false,
                  });
                  quillRef.current.root.innerHTML = '';
                  toast.info('Form has been reset');
                }
              }}
              className='px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium'
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className='px-8 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Creating Course...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create Course</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Add Lecture Popup */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div
              ref={popupRef}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className='px-6 py-4 border-b border-gray-200 flex-shrink-0'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-xl font-semibold text-gray-900'>Add New Lecture</h2>
                  <button
                    onClick={() => setShowPopup(false)}
                    className='text-gray-400 hover:text-gray-600 p-1'
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lecture Title *
                    </label>
                    <input
                      type="text"
                      value={lectureDetails.lectureTitle}
                      onChange={e => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. Introduction to React Hooks"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={lectureDetails.lectureDuration}
                      onChange={e => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="30"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Lecture Video *
                  </label>
                  <div className="flex space-x-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('cloudinary')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${uploadMethod === 'cloudinary'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      Upload Video to Cloudinary
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('url')}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${uploadMethod === 'url'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
                      Enter Video URL
                    </button>
                  </div>

                  {uploadMethod === 'cloudinary' ? (
                    <>
                      {lectureDetails.lectureUrl ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-green-700 font-medium">Video uploaded successfully to Cloudinary!</span>
                                <p className="text-sm text-green-600 truncate max-w-xs">
                                  {lectureDetails.lectureUrl}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowPreview(true)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => setLectureDetails({ ...lectureDetails, lectureUrl: '' })}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Change
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <button
                            type="button"
                            onClick={openCloudinaryWidget}
                            disabled={uploading}
                            className={`w-full p-6 border-2 border-dashed rounded-xl text-center transition-all ${uploading
                              ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                              : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:border-blue-400'
                              }`}
                          >
                            {uploading ? (
                              <div className="space-y-2">
                                <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                <p>Uploading... {uploadProgress}%</p>
                              </div>
                            ) : (
                              <>
                                <svg className="w-12 h-12 mx-auto mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="font-medium">Click to upload video using Cloudinary Widget</p>
                                <p className="text-sm mt-1">MP4, MOV, AVI up to 200MB</p>
                                <p className="text-xs text-blue-600 mt-1">Using course_lectures upload preset</p>
                              </>
                            )}
                          </button>
                          <div className="text-center">
                            <span className="text-gray-500 text-sm">OR</span>
                          </div>
                          <div className="relative">
                            <input
                              type="file"
                              id="videoFileUpload"
                              onChange={handleVideoFileUpload}
                              accept="video/mp4,video/mov,video/avi,video/mkv,video/webm,video/ogg"
                              className="hidden"
                            />
                            <label
                              htmlFor="videoFileUpload"
                              className={`block w-full p-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${uploading
                                ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                                : 'border-green-300 bg-green-50 hover:bg-green-100 text-green-700 hover:border-green-400'
                                }`}
                            >
                              <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="font-medium">Choose video file for direct upload</p>
                              <p className="text-sm mt-1">MP4, MOV, AVI, MKV, WEBM, OGG up to 200MB</p>
                            </label>
                          </div>
                        </div>
                      )}
                      {uploading && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Uploading to Cloudinary...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter Video URL
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={videoUrlInput}
                            onChange={e => setVideoUrlInput(e.target.value)}
                            placeholder="https://example.com/video.mp4  or Cloudinary URL"
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleVideoUrlInput}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add URL
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Supports Cloudinary, YouTube, Vimeo, or direct video links
                        </p>
                      </div>
                      {lectureDetails.lectureUrl && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-green-700 font-medium">Video URL added!</span>
                                <p className="text-sm text-green-600 truncate max-w-xs">
                                  {lectureDetails.lectureUrl}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowPreview(true)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                              >
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLectureDetails({ ...lectureDetails, lectureUrl: '' });
                                  setVideoUrlInput('');
                                }}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id="freePreview"
                    checked={lectureDetails.isPreviewFree}
                    onChange={e => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-800">Make this lecture free preview</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Students can watch this lecture without purchasing the course.
                      Great for attracting new students!
                    </p>
                  </div>
                </label>
              </div>
              <div className="pt-4 flex space-x-3 px-6 pb-6 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addLecture}
                  disabled={uploading || !lectureDetails.lectureUrl || !lectureDetails.lectureTitle || !lectureDetails.lectureDuration}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Lecture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        {showPreview && currentLecture && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Video Preview</h2>
                  <p className="text-sm text-gray-600">{currentLecture.lectureTitle}</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoPreviewRef}
                    src={currentLecture.lectureUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Video Information</h3>
                    <span className="text-sm text-gray-500">{currentLecture.lectureDuration} minutes</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">URL:</span>{' '}
                      <a
                        href={currentLecture.lectureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {currentLecture.lectureUrl}
                      </a>
                    </p>
                    {currentLecture.isPreviewFree && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Free Preview Enabled
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddCourse;
