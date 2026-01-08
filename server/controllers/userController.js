import User from "../models/User.js"
import Paystack from "paystack-api"; // Import Paystack library
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import { CourseProgress } from "../models/CourseProgress.js";
import { Wallet } from "../models/wallet.js";
import Admin from "../models/Admin.js";
;


export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId
    const user = await User.findById(userId)

    if (!user) {
      return res.json({ success: false, message: "User not Found" })
    }

    res.json({ success: true, user })
  } catch (err) {

    res.json({ success: false, message: err.message })
  }
}


// User  Enrolled Courses Wiht lecture Links 

export const userEnrolledCourse = async (req, res) => {
  try {
    const userId = req.auth.userId
    const userData = await User.findById(userId).populate('enrolledCourses')
    res.json({ success: true, enrolledCourses: userData.enrolledCourses })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}






export const updateUserCourseProgress = async (req, res) => {

  try {
    const userId = req.auth.userId
    const { courseId, lectureId } = req.body
    const progressData = await CourseProgress.findOne({ userId, courseId })

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res.json({
          success: true, message: "Lecture Already  completed"
        })
      }
      progressData.lectureCompleted.push(lectureId)
      await progressData.save()
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId]
      })
    }

    res.json({ success: true, message: "Progress Update" })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}


// get User Course Progress

export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId
    const { courseId, } = req.body
    const progressData = await CourseProgress.findOne({ userId, courseId })

    res.json({ success: true, progressData })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Add  User Ratings to Course 


// controllers/courseController.js or wherever you have it

// Helper to calculate average rating
const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // one decimal place
};

export const addUserRating = async (req, res) => {
  try {
    // FIX: Clerk middleware — req.auth is a function in newer versions
    let userId;
    try {
      const auth = await req.auth(); // this can throw if no token or invalid
      userId = auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No user ID found",
        });
      }
    } catch (authError) {
      console.error("Auth error:", authError);
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const { courseId, rating } = req.body;

    // Validate input
    if (!courseId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Course ID and rating are required",
      });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check enrollment — must be enrolled to rate
    const isEnrolled = user.enrolledCourses.some(
      (enrolled) => enrolled.toString() === courseId.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this course to rate it",
      });
    }

    // Update or add rating
    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId.toString() === userId
    );

    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    await course.save();

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "Thank you! Your rating has been saved",
      rating,
      averageRating: calculateAverageRating(course.courseRatings),
    });

  } catch (error) {
    console.error("Rating Error:", error);

    // Ensure we only send ONE response
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  }
};



export const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id; // Clerk ID

    // 1️⃣ Get completed purchases
    const purchases = await Purchase.find({
      userId,
      status: "completed",
    }).sort({ createdAt: -1 });

    if (!purchases.length) {
      return res.status(200).json({
        success: true,
        total: 0,
        transactions: [],
      });
    }

    // 2️⃣ Extract course IDs
    const courseIds = purchases.map(p => p.courseId);

    // 3️⃣ Fetch courses
    const courses = await Course.find({
      _id: { $in: courseIds },
    }).select(
      "courseTitle courseThumbnail coursePrice discount courseType difficulty"
    );

    // 4️⃣ Map courses for fast lookup
    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id.toString()] = course;
    });

    // 5️⃣ Format response
    const transactions = purchases.map(purchase => {
      const course = courseMap[purchase.courseId.toString()];

      return {
        purchaseId: purchase._id,
        amount: purchase.amount,
        status: purchase.status,
        purchasedAt: purchase.createdAt,

        course: course
          ? {
            id: course._id,
            title: course.courseTitle,
            thumbnail: course.courseThumbnail,
            price: course.coursePrice,
            discount: course.discount,
            finalPrice:
              course.discount > 0
                ? course.coursePrice -
                (course.coursePrice * course.discount) / 100
                : course.coursePrice,
            type: course.courseType,
            difficulty: course.difficulty,
          }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      total: transactions.length,
      transactions,
    });


    console.log("transactions:", transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};






// controllers/paymentController.js
export const initializeCoursePayment = async (req, res) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  console.log("PAYSTACK_SECRET_KEY loaded:", !!PAYSTACK_SECRET_KEY);

  if (!PAYSTACK_SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error: Paystack key missing",
    });
  }

  const paystackRequest = async (url, method, data = {}) => {
    try {
      const res = await fetch(`https://api.paystack.co${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify(data) : undefined,
      });
      const result = await res.json();
      return result;
    } catch (err) {
      console.error("PAYSTACK ERROR:", err.message || err);
      throw err;
    }
  };

  try {
    const { courseId } = req.body;
    const userId = req.user?._id;
    const userinfo = req.user;

    if (!userId) return res.status(401).json({ success: false, message: "User not authenticated" });
    if (!courseId) return res.status(400).json({ success: false, message: "Course ID is required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const user = await User.findOne({ _id: userId });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.enrolledCourses?.includes(courseId)) {
      return res.json({ success: true, alreadyEnrolled: true, message: "You are already enrolled in this course!" });
    }

    // ---------------- CALCULATE AMOUNT ----------------
    const discount = course.discount || 0;
    const finalAmount = course.coursePrice - (discount * course.coursePrice) / 100;

    // Add Paystack charge fee: 1.5% + 100 NGN
    const paystackFee = Math.round(finalAmount * 0.015 + 100);
    const totalAmount = finalAmount + paystackFee;

    const amountInKobo = Math.round(totalAmount * 100);

    console.log("Course price:", finalAmount);
    console.log("Paystack fee:", paystackFee);
    console.log("Total amount (user pays):", totalAmount);

    const reference = `course_${courseId}_${userId}_${Date.now()}`;

    await Purchase.create({
      courseId,
      userId,
      amount: totalAmount, // include fee here
      status: "pending",
      paymentReference: reference,
      paymentMethod: "paystack",
      paystackFee
    });

    const payload = {
      email: user.email,
      amount: amountInKobo,
      currency: "NGN",
      reference,
      callback_url: `${process.env.BACKEND_DOMAIN}/api/user/verify-course-payment`,
      metadata: { userId, courseId: courseId.toString(), type: "course_purchase" },
    };

    const response = await paystackRequest("/transaction/initialize", "POST", payload);

    if (!response?.data?.authorization_url) {
      return res.status(500).json({ success: false, message: "Failed to initialize payment with Paystack" });
    }

    return res.json({
      success: true,
      authorization_url: response.data.authorization_url,
      reference,
      amount: totalAmount, // include fee in frontend display
      courseTitle: course.courseTitle,
      paystackFee
    });

  } catch (error) {
    console.error("Initialize Payment Error:", error);
    return res.status(500).json({ success: false, message: "Payment initialization failed. Please try again." });
  }
};


// Verify Course Payment

export const verifyCoursePayment = async (req, res) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    console.error("Paystack secret key missing!");
    return res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=failed`);
  }

  const paystackRequest = async (url, method, data = {}) => {
    try {
      const response = await fetch(`https://api.paystack.co${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify(data) : undefined,
      });
      const result = await response.json();
      return result;
    } catch (err) {
      console.error("PAYSTACK ERROR:", err.message || err);
      throw err;
    }
  };

  try {
    const { reference } = req.query;
    if (!reference) {
      console.error("No payment reference provided");
      return res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=failed`);
    }

    // ---------------- VERIFY PAYMENT ----------------
    const verify = await paystackRequest(`/transaction/verify/${reference}`, "GET");
    if (!verify?.data || verify.data.status !== "success") {
      console.error("Payment verification failed!", verify);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=failed&ref=${reference}`);
    }

    const { metadata, amount } = verify.data;
    const { userId, courseId } = metadata;

    // ---------------- FIND PENDING PURCHASE ----------------
    const purchase = await Purchase.findOne({
      paymentReference: reference,
      status: "pending",
      userId,
      courseId,
    });

    if (!purchase) {
      console.error("Pending purchase not found!");
      return res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=failed`);
    }

    // ---------------- COMPLETE PURCHASE ----------------
    purchase.status = "completed";
    purchase.transactionId = verify.data.id;
    purchase.metadata = verify.data;
    await purchase.save();
    console.log("Purchase marked as completed.");

    // ---------------- ENROLL USER ----------------
    await User.findOneAndUpdate(
      { _id: userId },
      { $addToSet: { enrolledCourses: courseId } }
    );
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrolledStudents: userId },
    });
    console.log("User enrolled and course updated");

    // ---------------- FETCH COURSE ----------------
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found after payment");

    console.log("Course details:", course.courseTitle);

    // ---------------- CALCULATE COURSE PRICE ----------------
    const discount = course.discount || 0;
    const coursePrice = parseFloat((course.coursePrice * (1 - discount / 100)).toFixed(2));
    console.log("Course price after discount:", coursePrice);

    // ---------------- FETCH ADMIN & EDUCATORS ----------------
    const educatorId = course.educator;
    const admin = await Admin.findOne();

    // ---------------- CREATE WALLET IF NOT EXIST ----------------
    let educatorWallet = await Wallet.findOne({ userId: educatorId });
    if (!educatorWallet) {
      educatorWallet = await Wallet.create({ userId: educatorId, balance: 0, transactions: [] });
      console.log("Created new educator wallet");
    }

    let adminWallet = await Wallet.findOne({ userId: admin._id.toString() });
    if (!adminWallet) {
      adminWallet = await Wallet.create({ userId: admin._id.toString(), balance: 0, transactions: [] });
      console.log("Created new admin wallet");
    }

    // ---------------- SPLIT COURSE PRICE ONLY ----------------
    const adminShare = parseFloat((coursePrice * 0.3).toFixed(2));
    const educatorShare = parseFloat((coursePrice * 0.7).toFixed(2));
    console.log("Admin share (30% of course price):", adminShare);
    console.log("Educator share (70% of course price):", educatorShare);

    // Update educator wallet
    educatorWallet.balance += educatorShare;
    educatorWallet.transactions.push({
      type: "credit",
      amount: educatorShare,
      reference,
      description: `Course sale: ${course.courseTitle}`,
      status: "completed",
    });
    await educatorWallet.save();
    console.log("Educator wallet updated:", educatorWallet.balance);

    // Update admin wallet
    adminWallet.balance += adminShare;
    adminWallet.transactions.push({
      type: "credit",
      amount: adminShare,
      reference,
      description: `Admin commission from course: ${course.courseTitle}`,
      status: "completed",
    });
    await adminWallet.save();
    console.log("Admin wallet updated:", adminWallet.balance);

    console.log("Payment process completed successfully!");
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment-status?status=success&courseId=${courseId}&amount=${coursePrice}`
    );

  } catch (error) {
    console.error("Verify Payment Error:", error);
    return res.redirect(`${process.env.FRONTEND_URL}/payment-status?status=failed`);
  }
};






