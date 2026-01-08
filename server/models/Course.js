import mongoose from "mongoose";

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

const socialLinksSchema = new mongoose.Schema({
  facebook: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  telegram: { type: String, default: '' },
  discord: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  twitter: { type: String, default: '' }
}, { _id: false });

const handoutSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const premiumFeaturesSchema = new mongoose.Schema({
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  hasInstructorAssistance: { type: Boolean, default: false },
  assistanceHours: { type: Number, default: 5 },
  assistanceSchedule: { type: String, default: '' },
  hasCommunityAccess: { type: Boolean, default: false },
  communityType: { 
    type: String, 
    default: 'discord', 
    enum: ['discord', 'telegram', 'slack', 'whatsapp'] 
  },
  hasLiveSessions: { type: Boolean, default: false },
  liveSessionSchedule: { type: String, default: '' },
  hasCertificate: { type: Boolean, default: false },
  handouts: { type: [handoutSchema], default: [] },
  hasStudyGroups: { type: Boolean, default: false },
  hasQnASessions: { type: Boolean, default: false },
  qnaSchedule: { type: String, default: '' },
  hasCareerSupport: { type: Boolean, default: false }
}, { _id: false });

const lectureSchema = new mongoose.Schema({
  lectureId: { type: String, required: true },
  lectureTitle: { type: String, required: true },
  lectureDuration: { type: Number, required: true }, // in minutes
  lectureUrl: { type: String, required: true },
  isPreviewFree: { type: Boolean, default: false },
  lectureOrder: { type: Number, required: true }
}, { _id: false });

const chapterSchema = new mongoose.Schema({
  chapterId: { type: String, required: true },
  chapterOrder: { type: Number, required: true },
  chapterTitle: { type: String, required: true },
  chapterContent: { type: [lectureSchema], default: [] }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true, trim: true },
  courseDescription: { type: String, required: true },
  courseThumbnail: { type: String, required: true },
  coursePrice: { type: Number, required: true, min: 0 },
  courseType: {
    type: String,
    required: true,
    enum: ['basic', 'premium'],
    default: 'basic'
  },
  category: {
    type: String,
    required: true,
    enum: categories
  },
  premiumFeatures: {
    type: premiumFeaturesSchema,
    default: null // Only set for premium courses
  },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  courseContent: { type: [chapterSchema], default: [] },
  courseRatings: [{
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
  }],
  educator: {
    type: String, // Clerk user ID
    required: true
  },
  enrolledStudents: [{ type: String }], // Array of Clerk user IDs
  totalLectures: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // in minutes
  tags: [{ type: String }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  language: { type: String, default: 'English' },
  requirements: [{ type: String }],
  learningOutcomes: [{ type: String }],
  completionRate: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isPublished: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String, default: '' },
  clerkUserId: { type: String }, // Redundant but kept for indexing if needed
  educatorInfo: {
    name: { type: String },
    email: { type: String },
    profileImage: { type: String }
  },
  reviewedAt: { type: Date },
  reviewedBy: { type: String }, // Admin Clerk ID
  submissionDate: { type: Date, default: Date.now }
}, {
  timestamps: true,
  minimize: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
courseSchema.virtual('totalDurationMinutes').get(function () {
  if (!this.courseContent?.length) return 0;
  return this.courseContent.reduce((total, chapter) => {
    return total + (chapter.chapterContent?.reduce((sum, lecture) => 
      sum + (lecture.lectureDuration || 0), 0) || 0);
  }, 0);
});

courseSchema.virtual('formattedDuration').get(function () {
  const totalMinutes = this.totalDurationMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

courseSchema.virtual('totalLecturesCount').get(function () {
  if (!this.courseContent?.length) return 0;
  return this.courseContent.reduce((total, chapter) => 
    total + (chapter.chapterContent?.length || 0), 0);
});

courseSchema.virtual('finalPrice').get(function () {
  if (this.discount > 0) {
    return this.coursePrice - (this.coursePrice * this.discount / 100);
  }
  return this.coursePrice;
});

courseSchema.virtual('status').get(function () {
  return this.isPublished;
});

// Pre-save middleware
courseSchema.pre('save', function (next) {
  this.totalLectures = this.totalLecturesCount;
  this.totalDuration = this.totalDurationMinutes;

  // Update average rating
  if (this.courseRatings?.length > 0) {
    const sum = this.courseRatings.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = Number((sum / this.courseRatings.length).toFixed(1));
    this.totalReviews = this.courseRatings.length;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }

  // Set clerkUserId
  if (this.educator?.startsWith('user_')) {
    this.clerkUserId = this.educator;
  }

  // Set reviewedAt when status changes from pending
  if (this.isModified('isPublished') && this.isPublished !== 'pending') {
    this.reviewedAt = new Date();
  }

  next();
});

// Static Methods
courseSchema.statics.findByDifficulty = function (difficulty) {
  return this.find({ difficulty, isPublished: 'approved' });
};

courseSchema.statics.findPremiumCourses = function () {
  return this.find({ courseType: 'premium', isPublished: 'approved' });
};

courseSchema.statics.findFeaturedCourses = function () {
  return this.find({ isFeatured: true, isPublished: 'approved' });
};

courseSchema.statics.search = function (searchTerm) {
  return this.find({
    $or: [
      { courseTitle: { $regex: searchTerm, $options: 'i' } },
      { courseDescription: { $regex: searchTerm, $options: 'i' } },
      { tags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
      { category: { $regex: searchTerm, $options: 'i' } }
    ],
    isPublished: 'approved'
  });
};

courseSchema.statics.findByEducator = function (educatorId) {
  return this.find({ educator: educatorId });
};

courseSchema.statics.findPendingCourses = function () {
  return this.find({ isPublished: 'pending' });
};

courseSchema.statics.findApprovedCourses = function () {
  return this.find({ isPublished: 'approved' });
};

courseSchema.statics.findRejectedCourses = function () {
  return this.find({ isPublished: 'rejected' });
};

// Instance Methods
courseSchema.methods.isUserEnrolled = function (userId) {
  return this.enrolledStudents?.includes(userId);
};

courseSchema.methods.addRating = function (userId, rating) {
  this.courseRatings = this.courseRatings.filter(r => r.userId !== userId);
  this.courseRatings.push({ userId, rating });
  return this.save();
};

courseSchema.methods.enrollStudent = function (userId) {
  if (!this.isUserEnrolled(userId)) {
    this.enrolledStudents.push(userId);
  }
  return this.save();
};

courseSchema.methods.approveCourse = function (adminId) {
  this.isPublished = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = '';
  return this.save();
};

courseSchema.methods.rejectCourse = function (adminId, reason) {
  this.isPublished = 'rejected';
  this.rejectionReason = reason || '';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  return this.save();
};

courseSchema.methods.getUserProgress = function () {
  // Placeholder — implement with separate Progress model in production
  return {
    completedLectures: 0,
    totalLectures: this.totalLectures,
    progressPercentage: 0
  };
};

const Course = mongoose.model('Course', courseSchema);

export default Course;