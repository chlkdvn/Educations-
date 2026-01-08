import nodemailer from 'nodemailer';
import Course from '../models/Course.js';
import { CertificateRequest } from '../models/CertificateRequest.js'; // ← THIS WAS MISSING!!!
import User from '../models/User.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const requestCertificate = async (req, res) => {
  try {
    const { courseId, phone, email } = req.body;
    const auth = await req.auth();
    const userId = auth.userId;

    // 1. Fetch course with educator ID and title
    const course = await Course.findById(courseId).select("courseTitle educator");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // 2. Prevent duplicate requests
    const alreadyExists = await CertificateRequest.findOne({ userId, courseId });
    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "You have already requested a certificate for this course",
      });
    }

    // 3. Save the request
    await CertificateRequest.create({
      userId,
      courseId,
      phone,
      email,
    });

    // 4. Find the educator using the educator field (Clerk user ID)
    const educator = await User.findById(course.educator).select("email name");
    console.log("Educator Info:", educator);
    if (!educator || !educator.email) {
      // No educator email → fail loudly
      return res.status(500).json({
        success: false,
        message: "Unable to send request: course educator not found or has no email",
      });
    }

    // 5. Send email to the educator
    await transporter.sendMail({
      from: `"Certificate Request" <${process.env.SMTP_MAIL}>`,
      to: educator.email,
      replyTo: email, // student can reply directly
      subject: `Certificate Request: ${course.courseTitle}`,
      html: `
        <h2>New Certificate Request</h2>
        <p><strong>Course:</strong> ${course.courseTitle}</p>
        <p><strong>Course ID:</strong> ${courseId}</p>
        <p><strong>Student:</strong> ${auth.user?.name || "Student"} (ID: ${userId})</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <hr>
        <p><strong>Action Required:</strong> Please review and issue the certificate to the student.</p>
        <p>You can reply directly to this email or contact the student at <a href="mailto:${email}">${email}</a>.</p>
      `,
    });

    return res.json({
      success: true,
      message: "Certificate request sent successfully to the educator!",
    });
  } catch (error) {
    console.error("Certificate Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Check if already requested
export const checkCertificateRequested = async (req, res) => {
  try {
    const { courseId } = req.body;
    const auth = await req.auth(); // Fixed Clerk deprecation
    const userId = auth.userId;

    if (!courseId) {
      return res.json({ success: false, message: "courseId is required" });
    }

    const existingRequest = await CertificateRequest.findOne({
      userId,
      courseId,
    });

    return res.json({
      success: true,
      alreadyRequested: !!existingRequest,
    });

  } catch (error) {
    console.error("Check Certificate Request Error:", error);
    return res.json({ success: false, message: "Server error" });
  }
};