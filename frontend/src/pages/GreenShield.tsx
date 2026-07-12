import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, FileText, HelpCircle, Activity, TrendingDown, ClipboardList } from 'lucide-react';

interface ClaimResult {
  id?: number;
  claim_text: string;
  category: string;
  claim_type: string;
  claimed_value: string;
  verified_value: string;
  evidence_coverage: number;
  confidence_score: number;
  risk_level: string;
  status: string;
  recommendation: string;
  evidence_used: string[] | string;
  missing_evidence: string[] | string;
}

export default function GreenShield() {
  const [claimText, setClaimText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const claimTemplates = [
    "We reduced logistics emissions by 30%.",
    "We achieved 50% CSR participation across the workforce.",
    "We logged 20 volunteer hours in our local reserves.",
    "We achieved 90% compliance rating across audits.",
    "We accomplished 100% compliance with corporate ESG policies."
  ];

  const fetchHistory = async () => {
    try {
      const response = await api.get('/greenshield/history');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to fetch claim history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleVerify = async (textToVerify: string) => {
    const claim = textToVerify.trim();
    if (!claim) {
      toast("Please enter a valid ESG claim", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/greenshield/verify', { claim_text: claim });
      setResult(response.data);
      toast("ESG claim verified successfully!", "success");
      fetchHistory(); // Refresh history table
    } catch (err) {
      toast("Failed to run GreenShield verification engine", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper for risk badge colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'border-green-500 bg-green-500/10 text-green-400';
      case 'Medium':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      case 'High':
        return 'border-orange-500 bg-orange-500/10 text-orange-400';
      case 'Critical':
        return 'border-red-600 bg-red-600/10 text-red-400';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-400';
    }
  };

  // Helper for status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Fully Supported':
        return <CheckCircle className="text-green-400 w-5 h-5 shrink-0" />;
      case 'Partially Supported':
        return <AlertTriangle className="text-yellow-400 w-5 h-5 shrink-0" />;
      case 'Unsupported':
        return <ShieldAlert className="text-red-400 w-5 h-5 shrink-0" />;
      default:
        return <HelpCircle className="text-gray-400 w-5 h-5 shrink-0" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2 flex items-center gap-3">
          <ShieldCheck className="text-green-400 w-9 h-9" /> GreenShield AI — Greenwashing Detection Engine
        </h1>
        <p className="text-gray-400">
          Verify corporate ESG claims against actual operational records to identify discrepancies and compute evidence trust ratings.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Templates Sidebar */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-white/5 bg-white/5 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Claim Templates</h3>
          <div className="space-y-2.5">
            {claimTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setClaimText(template);
                  handleVerify(template);
                }}
                disabled={loading}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl p-3.5 text-xs text-gray-300 font-semibold leading-relaxed transition-all cursor-pointer hover:scale-[1.01]"
              >
                "{template}"
              </button>
            ))}
          </div>
          <div className="pt-6 border-t border-white/5 text-[10px] text-gray-500 font-semibold uppercase tracking-wider space-y-2.5">
            <p>📋 Verification Scope</p>
            <p className="normal-case leading-relaxed font-normal">
              GreenShield resolves keywords to check carbon logs, CSR activities, volunteer logs, training status, audits, and policy signs.
            </p>
          </div>
        </div>

        {/* Input & Output Workspace */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Claim Submission Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-[30px] pointer-events-none"></div>
            <h2 className="text-lg font-bold text-white">Enter Public ESG Claim</h2>
            
            <div className="space-y-3">
              <textarea
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="Example: We reduced logistics emissions by 30%..."
                className="w-full h-24 bg-black/35 border border-white/10 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-green-500/50 resize-none font-medium placeholder-gray-600"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Supports percentage targets, volunteer hours, audit ratings and compliance rates.</span>
                <button
                  onClick={() => handleVerify(claimText)}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-tr from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-green-500/25 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Evaluating...' : 'Analyze Claim'}
                </button>
              </div>
            </div>
          </div>

          {/* Verification Results Panel */}
          {result && (
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 relative">
              
              {/* Header result info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Evaluation Result</div>
                  <h3 className="text-lg font-extrabold text-white mt-1">"{result.claim_text}"</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold tracking-wider uppercase ${getRiskColor(result.risk_level)}`}>
                    {result.risk_level} Risk
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {result.status}
                  </div>
                </div>
              </div>

              {/* Verified stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Activity size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Claimed Target</span>
                    <p className="text-lg font-black text-white">{result.claimed_value}</p>
                  </div>
                </div>

                <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Verified Metric</span>
                    <p className="text-lg font-black text-white">{result.verified_value}</p>
                  </div>
                </div>

                <div className="bg-black/20 border border-white/5 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Confidence Level</span>
                    <p className="text-lg font-black text-white">{result.confidence_score}%</p>
                  </div>
                </div>

              </div>

              {/* Progress bars: Confidence and Coverage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/10 border border-white/5 p-5 rounded-xl">
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">Evidence Coverage</span>
                    <span className="text-white">{result.evidence_coverage}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)] transition-all duration-500" 
                      style={{ width: `${result.evidence_coverage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">Proportion of expected data streams actively logging metrics.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-400">Verification Confidence</span>
                    <span className="text-white">{result.confidence_score}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-500" 
                      style={{ width: `${result.confidence_score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">Grounded trust score discount based on pending verification backlogs.</p>
                </div>

              </div>

              {/* Evidence details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="text-green-500 w-3.5 h-3.5" /> Evidence Grounding (Used)
                  </h4>
                  <ul className="space-y-2 bg-black/10 p-4 rounded-xl border border-white/5 min-h-[100px]">
                    {Array.isArray(result.evidence_used) && result.evidence_used.length > 0 ? (
                      result.evidence_used.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic p-2">No supporting database traces found.</p>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertTriangle className="text-yellow-500 w-3.5 h-3.5" /> Gaps & Missing Evidence
                  </h4>
                  <ul className="space-y-2 bg-black/10 p-4 rounded-xl border border-white/5 min-h-[100px]">
                    {Array.isArray(result.missing_evidence) && result.missing_evidence.length > 0 && result.missing_evidence[0] !== "None" ? (
                      result.missing_evidence.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-yellow-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-xs text-green-500 font-semibold p-2 flex items-center gap-2">✓ No missing evidence or compliance gaps found.</p>
                    )}
                  </ul>
                </div>

              </div>

              {/* Recommendation section */}
              <div className="glass-panel p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
                <p className="text-xs text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} /> Actionable Recommendation
                </p>
                <p className="text-xs text-gray-200 leading-relaxed mt-1">
                  {result.recommendation}
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Historical Claims Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="text-gray-400" /> Historical Verifications Log
        </h2>
        
        {history.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-black/30 text-gray-400 border-b border-white/5">
                  <th className="p-4 font-bold">Claim Text</th>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Claimed Target</th>
                  <th className="p-4 font-bold">Verified Metric</th>
                  <th className="p-4 font-bold">Confidence</th>
                  <th className="p-4 font-bold">Risk Level</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((h, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors text-gray-300">
                    <td className="p-4 font-semibold text-white max-w-xs truncate">{h.claim_text}</td>
                    <td className="p-4">{h.category}</td>
                    <td className="p-4 text-orange-400 font-bold">{h.claimed_value}</td>
                    <td className="p-4 text-green-400 font-bold">{h.verified_value}</td>
                    <td className="p-4">{h.confidence_score}%</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getRiskColor(h.risk_level)}`}>
                        {h.risk_level}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{h.status}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(h.verified_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500 italic">No verification history available. Submit a claim above to start.</div>
        )}
      </div>

    </div>
  );
}
