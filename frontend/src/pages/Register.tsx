import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deptId, setDeptId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/master_data/departments')
      .then(res => {
        setDepartments(res.data);
        if (res.data.length > 0) setDeptId(res.data[0].id.toString());
      })
      .catch(err => console.error(err));
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/signup', {
        name,
        email,
        password,
        dept_id: parseInt(deptId)
      });
      
      localStorage.setItem('token', res.data.access_token);
      toast("Registration successful!", 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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
            Join the sustainability movement.
          </h1>
          <p className="text-lg text-gray-300 font-medium">
            EcoSphere brings environmental, social, and governance data into a unified, actionable platform.
          </p>
        </div>
      </div>

      {/* Right Side - Register Box */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[380px] my-auto">
          
          <div className="mb-8 lg:hidden mt-8">
             <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-4">
                <span className="text-xl">🌿</span>
             </div>
             <h1 className="text-2xl font-bold text-white tracking-tight">EcoSphere</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
            <p className="text-sm text-gray-500 mt-1">Get started with EcoSphere today.</p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all sm:text-sm"
                required
              />
            </div>
            
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
              <label className="block text-sm font-medium text-gray-300">Department</label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/30 focus:bg-[#1a1a1a] transition-all appearance-none sm:text-sm"
                required
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Password</label>
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
              {loading ? 'Creating Account...' : 'Sign up'}
            </button>
          </form>
          
          <div className="mt-8 text-center pb-8">
            <p className="text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-white hover:underline transition-colors">Sign in</Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
