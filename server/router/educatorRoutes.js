import express from "express"
import  {addCourse, getEducatorCourses, updateRoleToEducator ,  educatorDashboardData, getEnrolledStudentsData, onboardingEducator, getAllCourses, deleteCourse, updateCourseBasic, updatePremiumFeatures, getMyCertificateRequests, getEducatorWallet, withdrawFromWallet} from "../controllers/educationController.js";
import upload from "../configs/multer.js";
import { protectEducator } from "../middlewares/authMiddleware.js";


const  educatorRouter= express.Router()
// Add Educator Role

educatorRouter.post('/update-role',updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
educatorRouter.post("/onboarding-educator",  upload.single('profileImage'), onboardingEducator)
educatorRouter.get("/getAllCourses",protectEducator, getAllCourses)
educatorRouter.delete("/deleteCourse/:id" ,protectEducator,deleteCourse)
educatorRouter.post("/updateCourseBasic/:courseId", protectEducator, updateCourseBasic)
educatorRouter.post("/updatePremiumFeatures/:courseId", protectEducator, updatePremiumFeatures)
educatorRouter.get("/getMyCertificateRequests",  getMyCertificateRequests)
educatorRouter.get("/getWallet",protectEducator,  getEducatorWallet)
educatorRouter.post("/withdrawFromWallet",protectEducator,withdrawFromWallet)
export default  educatorRouter