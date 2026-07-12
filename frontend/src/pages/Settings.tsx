import { useState, useEffect } from 'react';
import api from '../api';

export default function Settings() {
  const [settings, setSettings] = useState({
    auto_emission_calc: true,
    evidence_required: true,
    w_env: 0.4,
    w_social: 0.3,
    w_gov: 0.3
  });
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data)).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.post('/settings', settings);
      setMsg('Settings saved successfully!');
    } catch (err) {
      setMsg('Failed to save settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Platform Settings</h1>
        <p className="text-gray-400">Manage global business rules and scoring weights.</p>
      </div>
      
      {msg && (
        <div className={`p-4 rounded-lg border ${msg.includes('success') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Core Rules Section */}
        <section className="bg-[#1e1e1e] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Core Rules</h2>
          <div className="space-y-6">
            
            <label className="flex items-start gap-4 cursor-pointer">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name="auto_emission_calc"
                  checked={settings.auto_emission_calc}
                  onChange={handleChange}
                  className="w-5 h-5 bg-[#121212] border-gray-700 rounded text-green-500 focus:ring-green-500 focus:ring-offset-[#1e1e1e]"
                />
              </div>
              <div>
                <p className="font-medium text-white">Auto Emission Calculation</p>
                <p className="text-sm text-gray-400 mt-1">Automatically calculate CO2e from ERP transactions using Emission Factors.</p>
              </div>
            </label>
            
            <label className="flex items-start gap-4 cursor-pointer">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name="evidence_required"
                  checked={settings.evidence_required}
                  onChange={handleChange}
                  className="w-5 h-5 bg-[#121212] border-gray-700 rounded text-green-500 focus:ring-green-500 focus:ring-offset-[#1e1e1e]"
                />
              </div>
              <div>
                <p className="font-medium text-white">Require Proof for CSR Activities</p>
                <p className="text-sm text-gray-400 mt-1">Employees must upload a proof file for a CSR activity to be approved.</p>
              </div>
            </label>
            
          </div>
        </section>

        {/* ESG Weights Section */}
        <section className="bg-[#1e1e1e] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">ESG Score Weights</h2>
          <p className="text-sm text-gray-400 mb-6">Adjust the weighting for the overall company ESG score. Values must sum to 1.0.</p>
          
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                <span>Environmental Weight</span>
                <span>{(settings.w_env * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                name="w_env"
                min="0" max="1" step="0.05"
                value={settings.w_env}
                onChange={handleChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                <span>Social Weight</span>
                <span>{(settings.w_social * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                name="w_social"
                min="0" max="1" step="0.05"
                value={settings.w_social}
                onChange={handleChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-sm font-medium text-gray-300 mb-2">
                <span>Governance Weight</span>
                <span>{(settings.w_gov * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                name="w_gov"
                min="0" max="1" step="0.05"
                value={settings.w_gov}
                onChange={handleChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
