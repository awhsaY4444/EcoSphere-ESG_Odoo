import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    auto_emission_calc: true,
    evidence_required: true,
    badge_auto_award: true,
    w_env: 0.4,
    w_social: 0.3,
    w_gov: 0.3
  });
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res.data))
      .catch(console.error);
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
    
    // Strict weight summation check (margin for float precision errors)
    const sum = settings.w_env + settings.w_social + settings.w_gov;
    if (Math.abs(sum - 1.0) > 0.001) {
      toast(`ESG Weights must sum to exactly 100%! Current sum: ${Math.round(sum * 100)}%`, 'error');
      return;
    }

    setSaving(true);
    setMsg('');
    try {
      await api.post('/settings', settings);
      setMsg('Settings saved successfully!');
      toast('Configuration saved successfully!', 'success');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to save settings.';
      setMsg(errorMsg);
      toast(errorMsg, 'error');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const sumOfWeights = Math.round((settings.w_env + settings.w_social + settings.w_gov) * 100);
  const isWeightInvalid = sumOfWeights !== 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Platform Settings & Administration</h1>
        <p className="text-gray-400">Configure global business rules, automatic badge triggers, and scoring weights.</p>
      </div>
      
      {msg && (
        <div className={`p-4 rounded-xl border ${msg.includes('successfully') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Core Rules Section */}
        <section className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Platform Business Rules
          </h2>
          
          <div className="space-y-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name="auto_emission_calc"
                  checked={settings.auto_emission_calc}
                  onChange={handleChange}
                  className="w-5 h-5 bg-black/40 border-white/10 rounded text-green-500 focus:ring-green-550"
                />
              </div>
              <div>
                <p className="font-semibold text-white group-hover:text-green-450 transition-colors">Auto Emission Calculation</p>
                <p className="text-xs text-gray-400 mt-1">Automatically calculate CO2e from ledger activities using matching Emission Factors.</p>
              </div>
            </label>
            
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name="evidence_required"
                  checked={settings.evidence_required}
                  onChange={handleChange}
                  className="w-5 h-5 bg-black/40 border-white/10 rounded text-green-500 focus:ring-green-555"
                />
              </div>
              <div>
                <p className="font-semibold text-white group-hover:text-green-455 transition-colors">Require Proof for Activities</p>
                <p className="text-xs text-gray-400 mt-1">Employees must provide proof links or descriptions for CSR/Challenge completions to be reviewed.</p>
              </div>
            </label>

            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name="badge_auto_award"
                  checked={settings.badge_auto_award}
                  onChange={handleChange}
                  className="w-5 h-5 bg-black/40 border-white/10 rounded text-green-500 focus:ring-green-555"
                />
              </div>
              <div>
                <p className="font-semibold text-white group-hover:text-green-455 transition-colors">Automatic Badge Evaluation</p>
                <p className="text-xs text-gray-400 mt-1">Award achievements and trophies instantly when employee XP, challenges, or impact metrics cross rules thresholds.</p>
              </div>
            </label>
          </div>
        </section>

        {/* ESG Weights Section */}
        <section className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📊</span> ESG Score Weights Configuration
            </h2>
            <div className={`px-4 py-1.5 rounded-full text-xs font-black border ${
              isWeightInvalid 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-green-500/20 text-green-400 border-green-500/30'
            }`}>
              Total Weight: {sumOfWeights}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Adjust the percentage multiplier for environmental, social, and governance departments. Values must sum exactly to 100% (1.0).
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                <span>Environmental (E) Weight</span>
                <span className="text-green-400 font-mono">{(settings.w_env * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                name="w_env"
                min="0" max="1" step="0.05"
                value={settings.w_env}
                onChange={handleChange}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                <span>Social (S) Weight</span>
                <span className="text-blue-400 font-mono">{(settings.w_social * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                name="w_social"
                min="0" max="1" step="0.05"
                value={settings.w_social}
                onChange={handleChange}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            
            <div>
              <label className="flex justify-between text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                <span>Governance (G) Weight</span>
                <span className="text-purple-400 font-mono">{(settings.w_gov * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                name="w_gov"
                min="0" max="1" step="0.05"
                value={settings.w_gov}
                onChange={handleChange}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {isWeightInvalid && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold flex items-center gap-2 animate-pulse">
              <span>⚠️</span> Environmental, Social, and Governance weights must sum to exactly 100%. Adjust ranges to enable saving.
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || isWeightInvalid}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? 'Saving Config...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
