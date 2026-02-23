import { clerkClient } from "@clerk/express";
import Admin from "../models/Admin.js";
import jwt  from "jsonwebtoken"
import User from "../models/User.js";

// Middleware  ( protect  Educator Routers)



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
           return  res.json("User is not authenticated.")
         }
       
         const decoded = jwt.verify(admin_token, process.env.JWT_SECRET);
         const admin = await Admin.findById(decoded.id);
   if(!admin){
     return  res.json('Something happen pls try again')
   }
   
  req.admin = admin; // Attach admin to request for use in subsequent handlers
  next(); // Pass 

    
 }









export const AuthUser = async (req, res, next) => {
  try {
    // Get token from cookies
    const { token } = req.cookies;

    if (!token) {
      return res.status(400).json({
        message: "User not authenticated",
        success: false,
        error: true,
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach to req
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    // Also attach userId separately for convenience
    req.userId = decoded.userId;

    next();
    
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
      success: false,
      error: true,
    });
  }
};