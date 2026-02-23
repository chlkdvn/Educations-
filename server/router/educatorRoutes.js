import express from "express"
import  {addCourse, getEducatorCourses, updateRoleToEducator ,  educatorDashboardData, getEnrolledStudentsData, onboardingEducator, getAllCourses, deleteCourse, updateCourseBasic, updatePremiumFeatures, getMyCertificateRequests, getEducatorWallet, withdrawFromWallet} from "../controllers/educationController.js";
import upload from "../configs/multer.js";
import { AuthUser } from "../middlewares/authMiddleware.js";


const  educatorRouter= express.Router()
// Add Educator Role

// educatorRouter.post('/update-role',updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), AuthUser, addCourse)
educatorRouter.get('/courses',AuthUser,  getEducatorCourses)
educatorRouter.get('/dashboard', AuthUser,  educatorDashboardData)
educatorRouter.get('/enrolled-students', AuthUser, getEnrolledStudentsData)
educatorRouter.post("/onboarding-educator",  upload.single('profileImage'),  AuthUser,  onboardingEducator)
educatorRouter.get("/getAllCourses", AuthUser,  getAllCourses)
educatorRouter.delete("/deleteCourse/:id" ,  AuthUser,  deleteCourse)
educatorRouter.post("/updateCourseBasic/:courseId",AuthUser,   updateCourseBasic)
educatorRouter.post("/updatePremiumFeatures/:courseId",AuthUser, updatePremiumFeatures)
educatorRouter.get("/getMyCertificateRequests",AuthUser,  getMyCertificateRequests)
educatorRouter.get("/getWallet", AuthUser,   getEducatorWallet)
educatorRouter.post("/withdrawFromWallet",  AuthUser, withdrawFromWallet)
export default  educatorRouter