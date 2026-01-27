import { clerkClient } from "@clerk/express"
import { json } from "express"
import Course from "../models/Course.js"
import { v2 as cloudinary } from 'cloudinary'
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import Educator from "../models/EducatorVerification.js"
import { CertificateRequest } from '../models/CertificateRequest.js';
import { Wallet } from "../models/wallet.js"
import { Readable } from 'stream'; // Node built-in
import streamifier from 'streamifier'


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
  '3D Design', 'Arts & Humanities', 'Graphic Design', 'Web Development', 'Marketing',
  'App Development', 'Frontend Development', 'Backend Engineering', 'Data Science',
  'AI & Machine Learning', 'Cybersecurity', 'Cloud Computing', 'Mobile Development',
  'UI/UX Design', 'Software Engineering'
];

export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body;
    const imageFile = req.file;
    const educatorId = req.auth.userId; // Clerk

    /* ---------- basic checks ---------- */
    if (!imageFile) return res.status(400).json({ success: false, message: 'Course thumbnail is required' });
    if (!courseData) return res.status(400).json({ success: false, message: 'Course data is required' });

    let data;
    try { data = JSON.parse(courseData); } catch {
      return res.status(400).json({ success: false, message: 'Invalid course data format' });
    }

    const required = ['courseTitle', 'courseDescription', 'coursePrice', 'courseType', 'category'];
    const missing = required.filter(f => !data[f]);
    if (missing.length) return res.status(400).json({ success: false, message: `Missing: ${missing.join(', ')}` });
    if (!categories.includes(data.category)) return res.status(400).json({ success: false, message: `Category must be one of: ${categories.join(', ')}` });

    /* ---- NEW: promoUrl ---- */
    if (data.promoUrl) {
      try { new URL(data.promoUrl); }
      catch { return res.status(400).json({ success: false, message: 'Invalid promo video URL' }); }
    }

    /* ---- price / discount / type / content ---- */
    if (data.coursePrice < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
    const discount = Math.min(100, Math.max(0, Number(data.discount || 0)));
    if (!['basic', 'premium'].includes(data.courseType)) return res.status(400).json({ success: false, message: "courseType must be 'basic' or 'premium'" });
    if (!Array.isArray(data.courseContent) || !data.courseContent.length) return res.status(400).json({ success: false, message: 'At least one chapter is required' });

    /* ---- MEMORY → Cloudinary upload ---- */
    let thumbnailUrl;
    try {
      const stream = Readable.from(imageFile.buffer); // buffer → stream
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'course-thumbnails',
            resource_type: 'image',
            transformation: [{ width: 1280, height: 720, crop: 'fill' }, { quality: 'auto:good' }]
          },
          (err, callResult) => {
            if (err) return reject(err);
            resolve(callResult);
          }
        ).end(imageFile.buffer); // pipe buffer into Cloudinary
      });
      thumbnailUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ success: false, message: 'Thumbnail upload failed' });
    }

    /* ---- totals ---- */
    let totalLectures = 0, totalDuration = 0;
    data.courseContent.forEach(ch => {
      totalLectures += (ch.chapterContent?.length || 0);
      ch.chapterContent?.forEach(l => totalDuration += (l.lectureDuration || 0));
    });

    /* ---- create document ---- */
    const doc = await Course.create({
      ...data,
      educator: educatorId,
      courseThumbnail: thumbnailUrl,
      isPublished: 'pending',
      enrolledStudents: [],
      courseRatings: [],
      totalLectures,
      totalDuration,
      averageRating: 0,
      totalReviews: 0,
      completionRate: 0,
      isFeatured: false,
      isApproved: false,
      approvalStatus: 'pending',
      discount,
      promoUrl: data.promoUrl || '', // <-- NEW
      premiumFeatures: data.courseType === 'premium' ? data.premiumFeatures : null,
      tags: data.tags || [],
      difficulty: data.difficulty || 'beginner',
      language: data.language || 'English',
      requirements: data.requirements || [],
      learningOutcomes: data.learningOutcomes || [],
      submissionDate: new Date()
    });

    /* ---- response ---- */
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: {
        id: doc._id,
        title: doc.courseTitle,
        type: doc.courseType,
        category: doc.category,
        promoUrl: doc.promoUrl, // <-- NEW
        thumbnail: doc.courseThumbnail,
        price: doc.coursePrice,
        discount: doc.discount,
        totalLectures: doc.totalLectures,
        totalDuration: doc.totalDuration,
        formattedDuration: doc.formattedDuration,
        finalPrice: doc.finalPrice,
        isPremium: doc.courseType === 'premium',
        premiumFeatures: doc.premiumFeatures,
        tags: doc.tags,
        difficulty: doc.difficulty,
        language: doc.language,
        requirements: doc.requirements,
        learningOutcomes: doc.learningOutcomes,
        educator: doc.educator,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: msgs });
    }
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'A course with this title already exists' });
    res.status(500).json({ success: false, message: 'Failed to create course', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
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
    console.log("userId", userId);
    const imageFile = req.file;
    console.log("imageFile", imageFile);

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

    // Upload profile image to Cloudinary using stream (buffer upload)
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "educators/pending",
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const imageUpload = await streamUpload(imageFile.buffer);

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
      isApproved: false,
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
