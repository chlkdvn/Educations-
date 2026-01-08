import { clerkClient } from "@clerk/express"
import { json } from "express"
import Course from "../models/Course.js"
import { v2 as cloudinary } from 'cloudinary'
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import Educator from "../models/EducatorVerification.js"
import { CertificateRequest } from '../models/CertificateRequest.js';
import { Wallet } from "../models/wallet.js"

export const updateRoleToEducator = async (req, res) => {
  try {
    const userId = req.auth.userId
    console.log("userId", userId)
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "educator"
      }
    })
    res.json({ success: true, message: "You can publich a course now " })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }

}

// Add new Course





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

export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId; // Clerk user ID

    console.log('Educator ID from auth:', educatorId);

    // Validate required fields
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Course thumbnail is required"
      });
    }

    if (!courseData) {
      return res.status(400).json({
        success: false,
        message: "Course data is required"
      });
    }

    // Parse course data
    let parsedCourseData;
    try {
      parsedCourseData = JSON.parse(courseData);
    } catch (parseError) {
      console.error('Course data parse error:', parseError);
      return res.status(400).json({
        success: false,
        message: "Invalid course data format"
      });
    }

    console.log('Parsed course data structure:', {
      hasCourseContent: !!parsedCourseData.courseContent,
      courseContentLength: parsedCourseData.courseContent?.length || 0,
      courseType: parsedCourseData.courseType,
      category: parsedCourseData.category,
      hasPremiumFeatures: !!parsedCourseData.premiumFeatures,
      tags: parsedCourseData.tags?.length || 0,
      requirements: parsedCourseData.requirements?.length || 0,
      learningOutcomes: parsedCourseData.learningOutcomes?.length || 0
    });

    // Validate required fields - now including 'category'
    const requiredFields = ['courseTitle', 'courseDescription', 'coursePrice', 'courseType', 'category'];
    const missingFields = requiredFields.filter(field => !parsedCourseData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate category
    if (!categories.includes(parsedCourseData.category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${categories.join(', ')}`
      });
    }

    // Validate course price
    if (parsedCourseData.coursePrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Course price cannot be negative"
      });
    }

    // Validate discount
    const discount = parsedCourseData.discount || 0;
    if (discount < 0 || discount > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 100"
      });
    }

    // Validate course type
    if (!['basic', 'premium'].includes(parsedCourseData.courseType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course type. Must be 'basic' or 'premium'"
      });
    }

    // Validate course content structure
    if (!parsedCourseData.courseContent || !Array.isArray(parsedCourseData.courseContent)) {
      return res.status(400).json({
        success: false,
        message: "Course content is required and must be an array"
      });
    }

    if (parsedCourseData.courseContent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Course must have at least one chapter"
      });
    }

    // Validate each chapter and lecture (same as before)
    for (let i = 0; i < parsedCourseData.courseContent.length; i++) {
      const chapter = parsedCourseData.courseContent[i];
      if (!chapter.chapterId || !chapter.chapterTitle) {
        return res.status(400).json({
          success: false,
          message: `Chapter ${i + 1}: chapterId and chapterTitle are required`
        });
      }

      if (!chapter.chapterContent || !Array.isArray(chapter.chapterContent)) {
        return res.status(400).json({
          success: false,
          message: `Chapter "${chapter.chapterTitle}" must have lecture content`
        });
      }

      if (chapter.chapterContent.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Chapter "${chapter.chapterTitle}" must have at least one lecture`
        });
      }

      for (let j = 0; j < chapter.chapterContent.length; j++) {
        const lecture = chapter.chapterContent[j];
        if (!lecture.lectureId || !lecture.lectureTitle || !lecture.lectureUrl) {
          return res.status(400).json({
            success: false,
            message: `Chapter "${chapter.chapterTitle}", Lecture ${j + 1}: lectureId, lectureTitle, and lectureUrl are required`
          });
        }

        // Validate video URL
        try {
          new URL(lecture.lectureUrl);
        } catch (urlError) {
          return res.status(400).json({
            success: false,
            message: `Chapter "${chapter.chapterTitle}", Lecture "${lecture.lectureTitle}": Invalid video URL format`
          });
        }

        // Validate and parse duration
        const duration = parseInt(lecture.lectureDuration);
        if (isNaN(duration) || duration <= 0) {
          return res.status(400).json({
            success: false,
            message: `Chapter "${chapter.chapterTitle}", Lecture "${lecture.lectureTitle}": Lecture duration must be a positive number`
          });
        }
        chapter.chapterContent[j].lectureDuration = duration;
      }
    }

    // Premium features validation (unchanged, kept for completeness)
    if (parsedCourseData.courseType === 'premium') {
      if (!parsedCourseData.premiumFeatures) {
        return res.status(400).json({
          success: false,
          message: "Premium features are required for premium courses"
        });
      }

      // Social links defaults and validation
      if (!parsedCourseData.premiumFeatures.socialLinks) {
        parsedCourseData.premiumFeatures.socialLinks = {
          facebook: '',
          whatsapp: '',
          telegram: '',
          discord: '',
          linkedin: '',
          twitter: ''
        };
      }

      const socialLinks = parsedCourseData.premiumFeatures.socialLinks;
      const urlFields = ['facebook', 'whatsapp', 'telegram', 'discord', 'linkedin', 'twitter'];
      for (const field of urlFields) {
        if (socialLinks[field] && socialLinks[field].trim() !== '') {
          try {
            new URL(socialLinks[field]);
          } catch (urlError) {
            return res.status(400).json({
              success: false,
              message: `Invalid URL format for ${field}. Please provide a valid URL.`
            });
          }
        }
      }

      // Assistance hours
      if (parsedCourseData.premiumFeatures.assistanceHours !== undefined) {
        const assistanceHours = parseInt(parsedCourseData.premiumFeatures.assistanceHours);
        if (isNaN(assistanceHours) || assistanceHours < 0) {
          return res.status(400).json({
            success: false,
            message: "Assistance hours must be a non-negative number"
          });
        }
        parsedCourseData.premiumFeatures.assistanceHours = assistanceHours;
      } else {
        parsedCourseData.premiumFeatures.assistanceHours = 5;
      }

      // Handouts validation
      if (parsedCourseData.premiumFeatures.handouts && Array.isArray(parsedCourseData.premiumFeatures.handouts)) {
        for (const handout of parsedCourseData.premiumFeatures.handouts) {
          if (!handout.id || !handout.name || !handout.url) {
            return res.status(400).json({
              success: false,
              message: "Invalid handout data - id, name, and url are required"
            });
          }
          try {
            new URL(handout.url);
          } catch (urlError) {
            return res.status(400).json({
              success: false,
              message: `Invalid URL for handout: ${handout.name}`
            });
          }
          if (handout.size && (isNaN(handout.size) || handout.size <= 0)) {
            return res.status(400).json({
              success: false,
              message: `Invalid file size for handout: ${handout.name}`
            });
          }
        }
      } else {
        parsedCourseData.premiumFeatures.handouts = [];
      }

      // Default premium feature flags
      const premiumDefaults = {
        hasInstructorAssistance: false,
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
      };

      for (const [key, defaultValue] of Object.entries(premiumDefaults)) {
        if (parsedCourseData.premiumFeatures[key] === undefined) {
          parsedCourseData.premiumFeatures[key] = defaultValue;
        }
      }
    }

    // Upload thumbnail to Cloudinary
    let thumbnailUrl;
    try {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'course-thumbnails',
        resource_type: 'image',
        transformation: [
          { width: 1280, height: 720, crop: 'fill' },
          { quality: 'auto:good' }
        ]
      });
      thumbnailUrl = imageUpload.secure_url;

      // Clean up temp file
      const fs = await import('fs');
      if (imageFile.path) {
        fs.unlinkSync(imageFile.path);
      }
    } catch (uploadError) {
      console.error('Thumbnail upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload course thumbnail to Cloudinary"
      });
    }

    // Calculate total lectures and duration
    let totalLectures = 0;
    let totalDuration = 0;
    parsedCourseData.courseContent.forEach(chapter => {
      if (chapter.chapterContent && Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
        chapter.chapterContent.forEach(lecture => {
          totalDuration += lecture.lectureDuration || 0;
        });
      }
    });

    // Prepare final course data
    const courseToCreate = {
      ...parsedCourseData,
      educator: educatorId,
      courseThumbnail: thumbnailUrl,
      isPublished: "pending",
      enrolledStudents: [],
      courseRatings: [],
      totalLectures,
      totalDuration,
      averageRating: 0,
      totalReviews: 0,
      category: parsedCourseData.category, // Added category
      premiumFeatures: parsedCourseData.courseType === 'premium' ? parsedCourseData.premiumFeatures : null,
      tags: parsedCourseData.tags || [],
      difficulty: parsedCourseData.difficulty || 'beginner',
      language: parsedCourseData.language || 'English',
      requirements: parsedCourseData.requirements || [],
      learningOutcomes: parsedCourseData.learningOutcomes || [],
      completionRate: 0,
      isFeatured: false,
      isApproved: false,
      approvalStatus: 'pending',
      coursePrice: parseFloat(parsedCourseData.coursePrice) || 0,
      discount: parseFloat(discount) || 0
    };

    // Create course
    const newCourse = await Course.create(courseToCreate);

    // Format duration and final price for response
    const formattedDuration = (() => {
      const hours = Math.floor(totalDuration / 60);
      const minutes = totalDuration % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    })();

    const finalPrice = (() => {
      const price = parseFloat(parsedCourseData.coursePrice) || 0;
      const discountValue = parseFloat(discount) || 0;
      return discountValue > 0 ? price - (price * discountValue / 100) : price;
    })();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: {
        id: newCourse._id,
        title: newCourse.courseTitle,
        type: newCourse.courseType,
        category: newCourse.category, // Included in response
        description: newCourse.courseDescription,
        thumbnail: newCourse.courseThumbnail,
        price: newCourse.coursePrice,
        discount: newCourse.discount,
        totalLectures: newCourse.totalLectures,
        totalDuration: newCourse.totalDuration,
        formattedDuration,
        finalPrice,
        isPremium: newCourse.courseType === 'premium',
        premiumFeatures: newCourse.premiumFeatures,
        tags: newCourse.tags,
        difficulty: newCourse.difficulty,
        language: newCourse.language,
        requirements: newCourse.requirements,
        learningOutcomes: newCourse.learningOutcomes,
        educator: newCourse.educator,
        createdAt: newCourse.createdAt,
        updatedAt: newCourse.updatedAt
      }
    });

  } catch (error) {
    console.error('Add course error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Cleanup temp file on error
    if (req.file && req.file.path) {
      try {
        const fs = await import('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to clean up temporary file:', cleanupError);
      }
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Course validation failed",
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A course with this title already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// get Educator Courses
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.auth.userId
    const courses = await Course.find({ educator })
    res.json({ success: true, courses })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// get Educator Dashboard Data ( total Earning Enrolled Students , No. of Courses)

export const educatorDashboardData = async (req, res) => {
  try {
    const educator = req.auth.userId
    const courses = await Course.find({ educator })
    const totalCourses = courses.length;

    const courseIds = courses.map(course => course._id)
    console.log("courseIds", courseIds)
    //Calculate  total earning  from purchase 
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: "completed"
    })

    console.log("purchases", purchases)

    const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

    //  collect unique  enrolled student  IDs with their curse titles
    const enrolledStudentsData = [];
    for (const course of courses) {
      console.log("course", course)
      const students = await User.find({
        _id: { $in: course.enrolledStudents }
      }, "name imageUrl");

      students.forEach(student => {
        enrolledStudentsData.push({
          courseTitle: course.courseTitle,
          student
        })
      })

    }
    res.json({
      success: true, dashboardData: {
        totalEarnings, enrolledStudentsData, totalCourses
      }
    })
  } catch (error) {
    res.json({
      success: false, message: error.message
    })
  }
}


// get Enrolled Student  Data wiht Purchase  Data 

export const getEnrolledStudentsData = async (req, res) => {
  try {

    const educator = req.auth.userId;
    const courses = await Course.find({ educator });
    const courseIds = courses.map(course => course._id);

    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: 'completed'
    }).populate('userId', ' name imageUrl').populate('courseId', 'courseTitle')

    const enrolledStudents = purchases.map(purchase => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt
    }))

    res.json({ success: true, enrolledStudents })

  } catch (error) {
    res.json({
      success: false, message: error.message
    })
  }
}


export const onboardingEducator = async (req, res) => {
  try {
    const auth = await req.auth();
    const userId = auth.userId;
    console.log("userId", userId)
    const imageFile = req.file;

    const {
      fullName,
      tagline,
      languages,
      bio,
      github,
      linkedin,
    } = req.body;

    // Required fields check
    if (!fullName || !tagline || !languages || !bio || !github || !imageFile) {
      return res.json({
        success: false,
        message: "All fields and profile photo are required",
      });
    }

    // Prevent duplicate submission
    const alreadyApplied = await Educator.findOne({ userId });
    if (alreadyApplied) {
      return res.json({
        success: false,
        message: "You have already applied. Waiting for admin approval.",
      });
    }

    // Upload profile image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      folder: "educators/pending",
      width: 500,
      height: 500,
      crop: "fill",
      gravity: "face",
    });

    // Save as PENDING — NOT approved yet
    await Educator.create({
      userId,
      fullName,
      tagline,
      languages,
      bio,
      github,
      linkedin: linkedin || "",
      profileImage: imageUpload.secure_url,
      isApproved: false,        // ← Manual approval required
      appliedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Application submitted! Admin will review soon.",
    });
  } catch (error) {
    console.log("Onboarding error:", error);
    res.json({
      success: false,
      message: "Server error. Try again later.",
    });
  }
};




// Updated Delete Course to delete handouts as well
export const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const educatorId = req.auth.userId;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    // Check ownership
    if (course.educator !== educatorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this course"
      });
    }

    // Delete thumbnail from Cloudinary if exists
    if (course.courseThumbnail) {
      const thumbnailPublicId = course.courseThumbnail.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`course-thumbnails/${thumbnailPublicId}`, { resource_type: 'image' });
    }

    // Delete handouts from Cloudinary if premium course
    if (course.courseType === 'premium' && course.premiumFeatures && course.premiumFeatures.handouts && course.premiumFeatures.handouts.length > 0) {
      for (const handout of course.premiumFeatures.handouts) {
        await cloudinary.uploader.destroy(handout.id, { resource_type: 'raw' });
      }
    }

    await Course.findByIdAndDelete(courseId);


    res.status(200).json({
      success: true,
      message: "Course and related files deleted successfully"
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// Get All Published Courses with Enrollment Status
export const getAllCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const courses = await Course.find({
      educator: userId
    });

    const coursesWithStatus = courses.map(course => ({
      ...course.toObject(),
      isEnrolled: course.enrolledStudents.includes(userId)
    }));

    res.json({ success: true, courses: coursesWithStatus });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};



// ==================== UPDATE COURSE (Main Info + Thumbnail) ====================
export const updateCourseBasic = async (req, res) => {
  try {
    const { courseId } = req.params;
    const educatorId = req.auth.userId;
    const updates = req.body;
    const thumbnailFile = req.file;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (course.educator !== educatorId)
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Allowed fields for basic update
    // In the allowed array, add "courseContent"
    const allowed = [
      "courseTitle",
      "courseDescription",
      "coursePrice",
      "discount",
      "tags",
      "difficulty",
      "language",
      "requirements",
      "learningOutcomes",
      "isPublished",
      "courseContent" // Add this line
    ];
    allowed.forEach(field => {
      if (updates[field] !== undefined) course[field] = updates[field];
    });

    // Update thumbnail if new one uploaded
    if (thumbnailFile) {
      // Delete old thumbnail
      if (course.courseThumbnail) {
        const oldPublicId = course.courseThumbnail.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`course-thumbnails/${oldPublicId}`);
      }

      // Upload new one
      const result = await cloudinary.uploader.upload(thumbnailFile.path, {
        folder: "course-thumbnails",
        transformation: { width: 1280, height: 720, crop: "fill" }
      });
      course.courseThumbnail = result.secure_url;

      // Clean temp file
      const fs = await import("fs");
      fs.unlinkSync(thumbnailFile.path);
    }

    await course.save();

    res.json({
      success: true,
      message: "Course updated successfully",
      course
    });

  } catch (error) {
    console.error("Update course error:", error);
    if (req.file?.path) {
      const fs = await import("fs");
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};




// ==================== UPDATE PREMIUM FEATURES (Social Links, Handouts, Support, etc.) ====================
export const updatePremiumFeatures = async (req, res) => {
  try {
    const { courseId } = req.params;
    const educatorId = req.auth.userId;
    const updates = req.body;
    const handoutFiles = req.files || []; // multiple files allowed

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (course.educator !== educatorId)
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (course.courseType !== "premium")
      return res.status(400).json({ success: false, message: "Only premium courses have premium features" });

    const pf = course.premiumFeatures;

    // Update simple fields
    const simpleFields = [
      "hasInstructorAssistance", "assistanceHours", "assistanceSchedule",
      "hasCommunityAccess", "communityType",
      "hasLiveSessions", "liveSessionSchedule",
      "hasCertificate", "hasStudyGroups", "hasQnASessions", "qnaSchedule", "hasCareerSupport"
    ];
    simpleFields.forEach(f => {
      if (updates[f] !== undefined) pf[f] = updates[f];
    });

    // Update social links
    if (updates.socialLinks) {
      Object.keys(updates.socialLinks).forEach(key => {
        const url = updates.socialLinks[key]?.trim();
        if (url && !url.startsWith("http")) return res.status(400).json({ success: false, message: `Invalid ${key} URL` });
        pf.socialLinks[key] = url || "";
      });
    }

    // Add new handouts
    if (handoutFiles.length > 0) {
      for (const file of handoutFiles) {
        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "course-handouts",
          resource_type: "raw"
        });

        pf.handouts.push({
          id: upload.public_id,
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          url: upload.secure_url,
          uploadedAt: new Date()
        });

        // Clean temp
        const fs = await import("fs");
        fs.unlinkSync(file.path);
      }
    }

    // Replace handouts entirely (if frontend sends full list)
    if (updates.handouts && Array.isArray(updates.handouts)) {
      pf.handouts = updates.handouts.map(h => ({
        id: h.id,
        name: h.name,
        type: h.type || "application/octet-stream",
        size: h.size || 0,
        url: h.url,
        uploadedAt: h.uploadedAt || new Date()
      }));
    }

    await course.save();

    res.json({
      success: true,
      message: "Premium features updated",
      premiumFeatures: course.premiumFeatures
    });

  } catch (error) {
    console.error("Update premium error:", error);
    if (req.files) {
      const fs = await import("fs");
      req.files.forEach(f => fs.unlinkSync(f.path));
    }
    res.status(500).json({ success: false, message: error.message });
  }
};





// Get all certificate requests for courses owned by the current educator
export const getMyCertificateRequests = async (req, res) => {
  try {
    const auth = await req.auth();
    const educatorId = auth.userId;

    // Find all courses owned by this educator
    const myCourses = await Course.find({ educator: educatorId }).select("_id courseTitle");
    if (myCourses.length === 0) {
      return res.json({
        success: true,
        message: "You have no courses yet",
        requests: [],
      });
    }

    const courseIds = myCourses.map(course => course._id);

    // Get all certificate requests for these courses
    const requests = await CertificateRequest.find({
      courseId: { $in: courseIds },
    }).sort({ createdAt: -1 });

    // Manually fetch student info (since userId is string)
    const studentIds = requests.map(r => r.userId);
    const students = await User.find({ _id: { $in: studentIds } }).select("name email imageUrl");

    // Create a map for quick lookup
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));

    // Format the response
    const formattedRequests = requests.map(req => {
      const student = studentMap.get(req.userId) || {};

      return {
        requestId: req._id,
        courseId: req.courseId,
        courseTitle: myCourses.find(c => c._id.toString() === req.courseId.toString())?.courseTitle || "Unknown Course",
        studentId: req.userId,
        studentName: student.name || "Unknown Student",
        studentEmail: student.email || "Not available",
        studentPhone: req.phone,
        studentImage: student.imageUrl || null,
        requestedAt: req.createdAt,
        status: req.status || "pending",
      };
    });

    return res.json({
      success: true,
      total: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("Get My Certificate Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching requests",
    });
  }
};





export const getEducatorWallet = async (req, res) => {
  try {
    const educatorId = req.user?._id;
    if (!educatorId) throw new Error("Educator ID is required");

    // Find wallet
    let wallet = await Wallet.findOne({ userId: educatorId });

    // If wallet doesn't exist, create an empty one
    if (!wallet) {
      wallet = await Wallet.create({
        userId: educatorId,
        balance: 0,
        transactions: [],
      });
      console.log("Created new wallet for educator:", educatorId);
    }

    // Return wallet info
    return res.json({
      balance: wallet.balance,
      transactions: wallet.transactions,
    });

    console.log("Fetched wallet for educator:", educatorId, "Balance:", wallet.balance);
  } catch (error) {
    console.error("Error fetching educator wallet:", error);
    return res.json({ balance: 0, transactions: [] });
  }
};







export const withdrawFromWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("req.user", req.user);

    const { amount, accountNumber, bankCode } = req.body;

    // ---------------- BASIC VALIDATION ----------------
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: "Bank details required",
      });
    }

    // ---------------- WALLET CHECK ----------------
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // ---------------- PAYSTACK REQUEST (BUILT-IN) ----------------
    const paystackRequest = async (url, method, data = {}) => {
      const response = await fetch(`https://api.paystack.co${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify(data) : undefined,
      });

      return response.json();
    };

    // ---------------- CREATE TEMP TRANSFER RECIPIENT ----------------
    const recipientRes = await paystackRequest("/transferrecipient", "POST", {
      type: "nuban",
      name: req.user.name || "Educator",
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    });

    if (!recipientRes.status) {
      return res.status(400).json({
        success: false,
        message: recipientRes.message || "Invalid bank details",
      });
    }

    const recipientCode = recipientRes.data.recipient_code;

    // ---------------- INITIATE TRANSFER ----------------
    const amountInKobo = Math.round(amount * 100);

    const transfer = await paystackRequest("/transfer", "POST", {
      source: "balance",
      amount: amountInKobo,
      recipient: recipientCode,
      reason: "Educator wallet withdrawal",
    });

    if (!transfer.status) {
      return res.status(400).json({
        success: false,
        message: transfer.message || "Transfer failed",
      });
    }

    // ---------------- UPDATE WALLET ----------------
    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
      reference: transfer.data.reference,
      description: "Wallet withdrawal",
      status: "pending",
    });

    await wallet.save();

    return res.json({
      success: true,
      message: "Withdrawal initiated successfully",
    });

  } catch (error) {
    console.error("Withdraw Error:", error);
    return res.status(500).json({
      success: false,
      message: "Withdrawal failed",
    });
  }
};
