
import express from 'express';
import { AdminAuthentication, checkAuth } from '../middlewares/authMiddleware.js';
import { adminLogin, adminLogout, adminSignup, adminWithdraw, approveCourse, approveEducator, findallCourseandeducator, findAllEducators, findAllPurchases, fineEducatorandcourse, getAdminWallet, getAllEducatorApplications, getallusers, getCourseDetailsForVerification, getCoursesForVerification, getPendingCourseCount, getVerificationStats, rejectCourse } from '../controllers/AdminController.js';
const AdminRouter = express.Router();


AdminRouter.post('/signup', adminSignup);
AdminRouter.post('/login', adminLogin);
AdminRouter.post('/logout', adminLogout);
AdminRouter.get('/check-auth', checkAuth);
AdminRouter.get("/getallusers", AdminAuthentication, getallusers)
AdminRouter.get("/findallCourseandeducator", AdminAuthentication, findallCourseandeducator)
AdminRouter.get("/findAllPurchases", AdminAuthentication, findAllPurchases)
AdminRouter.get("/findAllEducators", AdminAuthentication, fineEducatorandcourse)
AdminRouter.get("/getAllEducatorApplications", AdminAuthentication, getAllEducatorApplications)
AdminRouter.post("/approveEducator", AdminAuthentication, approveEducator)
AdminRouter.get("/getCoursesForVerification", AdminAuthentication, getCoursesForVerification)


AdminRouter.get("/getVerificationStats", AdminAuthentication, getVerificationStats)
AdminRouter.post("/approveCourse", AdminAuthentication, approveCourse)
AdminRouter.post("/rejectCourse", AdminAuthentication, rejectCourse)



AdminRouter.get("/getCourseDetailsForVerification/:courseId", AdminAuthentication, getCourseDetailsForVerification)
AdminRouter.get("/getPendingCourseCount", AdminAuthentication, getPendingCourseCount)
AdminRouter.get("/getAdminWallet", AdminAuthentication,  getAdminWallet)   
AdminRouter.post('/adminWithdraw',AdminAuthentication, adminWithdraw)

export default AdminRouter