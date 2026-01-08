import mongoose from 'mongoose';

const educatorSchema = new mongoose.Schema({
  // Link to Clerk user (very important!)
  userId: {
    type: String,
    required: true,
    unique: true, // One educator per user only
  },

  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  tagline: {
    type: String,
    required: true,
    trim: true,
  },

  languages: {
    type: String,
    required: true,
    trim: true,
    // Example: "JavaScript, React, Node.js, Python"
  },

  bio: {
    type: String,
    required: true,
    trim: true,
    minlength: 50,
    maxlength: 500,
  },

  github: {
    type: String,
    required: true,
    trim: true,
  },

  linkedin: {
    type: String,
    trim: true,
  },

  profileImage: {
    type: String, // Cloudinary URL or local path
    required: true,
  },

  isApproved: {
    type: Boolean,
    default: false, // You can approve manually or auto-approve
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster search by userId
educatorSchema.index({ userId: 1 });

const Educator = mongoose.model('Educator', educatorSchema);

export default Educator;