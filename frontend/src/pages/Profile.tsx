import { useState, useEffect } from 'react';
import { User, Mail, Building, Phone, Save, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '../utils/toast';
import api from '../api';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setProfile(prev => ({
        ...prev,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        department: res.data.department || '',
        phone: res.data.phone || '',
        bio: res.data.bio || ''
      }));
    }).catch(err => console.error("Failed to fetch profile", err));
  }, []);

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      toast("Passwords do not match!", 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const payload: any = {
        name: profile.name,
        phone: profile.phone,
        bio: profile.bio,
      };
      if (passwordData.newPassword) {
        payload.new_password = passwordData.newPassword;
      }
      const res = await api.put('/auth/me', payload);
      setProfile(prev => ({
        ...prev,
        name: res.data.name,
        phone: res.data.phone,
        bio: res.data.bio,
        department: res.data.department,
      }));
      toast("Profile saved successfully!", 'success');
      setIsEditing(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500 mb-2">My Profile</h1>
        <p className="text-gray-400">Manage your personal information and account settings.</p>
      </div>

      <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[60px] pointer-events-none"></div>
        
        {/* Cover Photo Area */}
        <div className="h-32 bg-gradient-to-r from-orange-500/20 to-amber-500/20 w-full relative">
          <button className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 transition-colors">
            <Camera size={18} />
          </button>
        </div>

        <div className="p-8 relative z-10 pt-0">
          <div className="flex justify-between items-end mb-8 -mt-12">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 p-1 shadow-xl shadow-orange-500/20">
                <div className="w-full h-full rounded-[14px] bg-[#18181b] flex items-center justify-center text-3xl font-bold text-orange-400">
                  {profile.name.charAt(0)}
                </div>
              </div>
              <div className="pb-2">
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <p className="text-orange-400 font-medium">{profile.role}</p>
              </div>
            </div>
            
            <div className="pb-2">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setPasswordData({ newPassword: '', confirmPassword: '' });
                    }}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                    ) : (
                      <Save size={16} />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-200 border-b border-white/5 pb-2">Personal Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <User size={16} />
                    </div>
                    <input 
                      type="text" 
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 p-3 text-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Mail size={16} />
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 p-3 text-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Phone size={16} />
                    </div>
                    <input 
                      type="text" 
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 p-3 text-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-200 border-b border-white/5 pb-2">Professional Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Building size={16} />
                    </div>
                    <input 
                      type="text" 
                      name="department"
                      value={profile.department}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 p-3 text-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Bio / Sustainability Goals</label>
                  <textarea 
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section (Visible only when editing) */}
          {isEditing && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="text-lg font-semibold text-gray-200 border-b border-white/5 pb-2 mb-6">Security & Authentication</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Lock size={16} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Leave blank to keep current"
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-10 p-3 text-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
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

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <Lock size={16} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-10 p-3 text-gray-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl w-full">
                    <h4 className="text-sm font-semibold text-blue-400 mb-1">Password Requirements</h4>
                    <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                      <li>Minimum 8 characters long</li>
                      <li>At least one uppercase character</li>
                      <li>At least one number or special character</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
