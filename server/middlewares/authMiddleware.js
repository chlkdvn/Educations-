import { clerkClient } from "@clerk/express";
import Admin from "../models/Admin.js";
import jwt  from "jsonwebtoken"

// Middleware  ( protect  Educator Routers)

export const protectChatUser = async (req, res, next) => {
  try {
    // FIX 1: Use req.auth() instead of req.auth (new Clerk v5+ way)
    const auth = req.auth?.();
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found",
      });
    }

    // Optional: Get user from Clerk (for name, image, etc.)
    const clerkUser = await clerkClient.users.getUser(userId);

    // Attach to req.user
    req.user = {
      _id: userId, // Matches your User model _id (Clerk ID as string)
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'User',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      imageUrl: clerkUser.imageUrl || '',
      role: clerkUser.publicMetadata?.role || 'student',
    };

    next();
  } catch (error) {
    console.error('Chat auth error:', error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or missing token",
    });
  }
};



export const protectEducator = async (req, res, next) => {
  try {
    // Get user ID from Clerk auth
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user ID found",
      });
    }

    // Fetch Clerk user
    const clerkUser = await clerkClient.users.getUser(userId);

    // Check if the role is educator
    if (clerkUser.publicMetadata?.role !== "educator") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access: Educator only",
      });
    }

    // Attach user info to req
    req.user = {
      _id: userId, // Clerk ID
      name:
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        clerkUser.username ||
        "User",
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      imageUrl: clerkUser.imageUrl || "",
      role: clerkUser.publicMetadata?.role,
    };

    next();
  } catch (error) {
    console.error("protectEducator error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Middleware  ( protect  Admin Routers)
// Check auth status

export const checkAuth = async (req, res) => {
  try {
    // Get token from cookies
    const { admin_token } = req.cookies;

    if (!admin_token) {
      return res.status(401).json({
        success: false,
        error: true,
        message: 'Not authenticated'
      });
    }

    // Verify token
    const decoded = jwt.verify(admin_token, process.env.JWT_SECRET);
    console.log("decoded", decoded);

    // Find admin
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.json({
        success: false,
        error: true,
        message: "Unknown user"
      });
    }

    return res.json({
      success: true,
      error: false,
      admin
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: true,
      message: error.message   // FIX: send only the message, not the whole error object!
    });
  }
};



 export const     AdminAuthentication =  async(req,res,next)=>{
       const { admin_token } = req.cookies;
         if (!admin_token) {
           return next(new ErrorHandler("User is not authenticated.", 400));
         }
       
         const decoded = jwt.verify(admin_token, process.env.JWT_SECRET);
         const admin = await Admin.findById(decoded.id);
   if(!admin){
     return next(new  ErrorHandler('Something happen pls try again', 404))
   }
   
  req.admin = admin; // Attach admin to request for use in subsequent handlers
  next(); // Pass 

    
 }




  export const protectUser = async (req, res, next) => {
    try {
      // FIX 1: Use req.auth() instead of req.auth (new Clerk v5+ way)
      const auth = req.auth?.();
      const userId = auth?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No user ID found",
        });
      }

      // Optional: Get user from Clerk (for name, image, etc.)
      const clerkUser = await clerkClient.users.getUser(userId);

      // Attach to req.user
        req.user = {
          _id: userId, // Matches your User model _id (Clerk ID as string)
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          imageUrl: clerkUser.imageUrl || '',
          role: clerkUser.publicMetadata?.role || 'student',
        };

      next();
    } catch (error) {
      console.error('Chat auth error:', error);
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or missing token",
      });
    }
  };
