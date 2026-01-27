import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import { Upload, User, Loader2 } from 'lucide-react';

const OnboardingEducator = () => {
  const navigate = useNavigate();
  const { backendUrl, getToken } = useContext(AppContext);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(assets.user_icon);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    tagline: '',
    languages: 'JavaScript, React, Node.js',
    bio: '',
    github: '',
    linkedin: '',
    twitter: '',
    portfolio: '',
  });

  const validateForm = () => {
    const newErrors = {};
    if (!image) newErrors.image = 'Profile picture is required';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.tagline.trim()) newErrors.tagline = 'Tagline is required';
    if (!formData.languages.trim()) newErrors.languages = 'Languages are required';
    if (!formData.bio.trim() || formData.bio.length < 50)
      newErrors.bio = 'Bio must be at least 50 characters';
    if (!formData.github.trim()) newErrors.github = 'GitHub profile is required';
    if (formData.github && !/^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+/.test(formData.github))
      newErrors.github = 'Enter a valid GitHub URL';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix all errors');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const data = new FormData();

      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) { // Only append if value exists
          data.append(key, formData[key]);
        }
      });

      // Append the file. 
      // IMPORTANT: The key 'profileImage' must match upload.single('profileImage') in the backend
      data.append('profileImage', image);

      const response = await axios.post(
        `${backendUrl}/api/educator/onboarding-educator`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
            // DO NOT SET 'Content-Type': 'multipart/form-data' here
            // Axios will set it automatically with the correct boundary
          }
        }
      );

      if (response.data.success) {
        toast.success('Application submitted successfully!');
        toast.info('We’ll review your profile within 24–48 hours. You’ll be notified by email.');
        navigate('/');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Submission error:", error);
      const msg = error.response?.data?.message || error.message || 'Submission failed';
      toast.error(msg);
      if (msg.includes('already')) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">Coding Instructor</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Apply to teach programming. We manually review every application.
          </p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-8 py-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Instructor Application</h2>
            <p className="text-gray-600 mt-1">Approval takes 24–48 hours</p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Profile Picture */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Profile Picture *
              </label>
              <label htmlFor="profileImage" className="group cursor-pointer inline-block">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-4 ring-cyan-100">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover group-hover:scale-110 transition"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-white mb-1" />
                    <span className="text-white text-sm font-medium">Change</span>
                  </div>
                </div>
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImage}
                className="hidden"
              />
              {errors.image && <p className="mt-2 text-sm text-red-600">{errors.image}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? 'border-red-300' : 'border-gray-300'} focus:border-cyan-500 outline-none`}
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tagline *</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.tagline ? 'border-red-300' : 'border-gray-300'} focus:border-cyan-500 outline-none`}
                  placeholder="React Expert & Mentor"
                />
                {errors.tagline && <p className="mt-1 text-sm text-red-600">{errors.tagline}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Technologies You Teach *</label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.languages ? 'border-red-300' : 'border-gray-300'} focus:border-cyan-500 outline-none`}
                placeholder="JavaScript, Python, React, Next.js"
              />
              {errors.languages && <p className="mt-1 text-sm text-red-600">{errors.languages}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Profile * <span className="text-xs text-gray-500">(We check this)</span>
              </label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.github ? 'border-red-300' : 'border-gray-300'} focus:border-cyan-500 outline-none`}
                placeholder="https://github.com/yourusername"
              />
              {errors.github && <p className="mt-1 text-sm text-red-600">{errors.github}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio * ({formData.bio.length}/500)</label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                maxLength={500}
                className={`w-full px-4 py-3 rounded-lg border ${errors.bio ? 'border-red-300' : 'border-gray-300'} focus:border-cyan-500 outline-none resize-none`}
                placeholder="Tell us about your coding journey and teaching experience..."
              />
              {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
            </div>

            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-lg font-bold text-white transition-all ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Application for Review'
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>We manually review every application to ensure high-quality instructors.</p>
          <p className="mt-2 font-medium">You’ll be notified by email once approved.</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingEducator;