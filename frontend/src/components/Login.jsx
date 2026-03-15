import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle, ArrowRight, Users, BookOpen, Shield } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await authAPI.login(formData);
      await login(res.data.token, res.data.user);
      toast.success('Login successful');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      console.error('Error:', error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Welcome Back to EduCloud
                </h1>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Access your personalized dashboard and unlock AI-powered educational tools
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <Users className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">50,000+</div>
                <div className="text-blue-100">Educators</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <BookOpen className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">1M+</div>
                <div className="text-blue-100">Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <Sparkles className="h-8 w-8 text-white mx-auto mb-3" />
                <div className="text-2xl font-bold text-white">AI-Powered</div>
                <div className="text-blue-100">Learning</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="max-w-lg mx-auto -mt-16 relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur-md border-0 shadow-2xl rounded-3xl overflow-hidden hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02]">
          <div className="relative">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white text-sm font-medium mb-4 animate-pulse">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Secure Login Portal
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In to Your Account</h2>
                <p className="text-gray-600">Enter your credentials to access EduCloud</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Mail size={18} className="mr-2 text-blue-500 group-focus-within:text-blue-600 transition-colors" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-400 bg-white hover:border-blue-300"
                    placeholder="Enter your email address"
                    aria-label="Email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-2 flex items-center animate-slide-in"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.email}</p>}
                </div>

                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Lock size={18} className="mr-2 text-blue-500 group-focus-within:text-blue-600 transition-colors" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full p-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-400 bg-white hover:border-blue-300"
                      placeholder="Enter your password"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors hover:scale-110"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-2 flex items-center animate-slide-in"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center group hover:scale-105"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="text-center mt-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">New to EduCloud?</span>
                  </div>
                </div>

                <p className="text-gray-600">
                  Create your account to get started with AI-powered education
                </p>

                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 font-semibold text-gray-700 hover:text-blue-600 group hover:scale-105"
                >
                  <span>Create Account</span>
                  <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Link>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-500">
                  By signing in, you agree to our{' '}
                  <Link to="/terms" className="text-blue-500 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
