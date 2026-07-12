import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api';
import { toast } from '../utils/toast';

export default function Login() {
  const [email, setEmail] = useState('alice@eco.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const res = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      toast("Authenticating with Google...", 'info');
      try {
        const res = await api.post('/auth/google', {
          token: tokenResponse.access_token
        });
        
        localStorage.setItem('token', res.data.access_token);
        toast("Successfully signed in with Google", 'success');
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Google Login failed.');
        toast("Google Login failed", 'error');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast("Google Login popup closed or failed", 'error');
    }
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex font-sans text-gray-200">
      
      {/* Left Side - Branding & Image */}
      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2727&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10"></div>
        
        <div className="relative z-20 max-w-lg p-12">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-2xl">
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight leading-tight mb-4">
            Manage your ESG impact in real-time.
          </h1>
          <p className="text-lg text-gray-300 font-medium">
            EcoSphere brings environmental, social, and governance data into a unified, actionable platform.
          </p>
        </div>
      </div>

      {/* Right Side - Login Box */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative">
        <div className="w-full max-w-[380px]">
          
          <div className="mb-8 lg:hidden">
             <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-4">
                <span className="text-xl">🌿</span>
             </div>
             <h1 className="text-2xl font-bold text-white tracking-tight">EcoSphere</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Please enter your details to sign in.</p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all sm:text-sm"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all sm:text-sm"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-2.5 rounded-lg transition-all text-sm mt-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 text-white font-medium py-2.5 rounded-lg transition-all text-sm"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign in with Google
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account? <Link to="/register" className="text-white hover:underline transition-colors">Sign up</Link>
            </p>
          </div>

          <div className="mt-12 p-4 bg-[#141414] rounded-lg border border-white/5 text-xs text-gray-500">
            <p className="font-semibold text-gray-400 mb-2">Hackathon Demo Accounts</p>
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span>Admin</span>
              <span>admin@eco.com / admin123</span>
            </div>
            <div className="flex justify-between">
              <span>Employee</span>
              <span>alice@eco.com / emp123</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
