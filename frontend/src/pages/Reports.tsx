import { useState, useRef } from 'react';
import api from '../api';
import { toast } from '../utils/toast';
import * as html2pdfBundle from 'html2pdf.js';
// @ts-ignore
const html2pdf = html2pdfBundle.default || html2pdfBundle;

export default function Reports() {
  const [deptId, setDeptId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [module, setModule] = useState('All');
  
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [summaryData, setSummaryData] = useState({
    total_carbon: "12,450 tCO2e",
    csr_participation: "84% Workforce",
    compliance_score: "98/100"
  });
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deptId) params.append('dept_id', deptId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (module) params.append('module', module);

    api.get('/reports/summary', { params })
      .then(res => setSummaryData(res.data))
      .catch(console.error);
  }, [deptId, startDate, endDate, module]);

  const handleExportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloadingCsv(true);
    try {
      const params = new URLSearchParams();
      if (deptId) params.append('dept_id', deptId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const res = await api.get('/reports/export', {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `esg_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("CSV Report downloaded successfully!", "success");
    } catch (err) {
      toast('Failed to generate CSV report. Please try again.', 'error');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    setDownloadingPdf(true);
    toast("Generating Executive PDF...", "info");
    
    const opt = {
      margin:       0.5,
      filename:     `EcoSphere_Executive_Report_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'function') {
      // Fallback if library fails to load
      toast("PDF generator unavailable, printing instead...", "info");
      window.print();
      setDownloadingPdf(false);
      return;
    }

    try {
      html2pdf().set(opt).from(reportRef.current).save().then(() => {
        toast("PDF Downloaded successfully!", "success");
        setDownloadingPdf(false);
      }).catch(() => {
        toast("Failed to generate PDF.", "error");
        setDownloadingPdf(false);
      });
    } catch (e) {
      console.error(e);
      toast("Error initializing PDF generator.", "error");
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500 mb-2">Custom Report Builder</h1>
        <p className="text-gray-400">Generate and export filtered ESG performance reports for executive review.</p>
      </div>

      <div className="glass-panel border border-white/10 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-[60px] pointer-events-none"></div>
        <form onSubmit={handleExportCSV} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Department</label>
              <div className="relative">
                <select 
                  value={deptId} onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all appearance-none"
                >
                  <option value="">All Departments</option>
                  <option value="1">Global HQ</option>
                  <option value="2">Information Technology</option>
                  <option value="3">Operations</option>
                  <option value="4">Human Resources</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Module</label>
              <div className="relative">
                <select 
                  value={module} onChange={(e) => setModule(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all appearance-none"
                >
                  <option value="All">All ESG</option>
                  <option value="Env">Environmental Only</option>
                  <option value="Soc">Social Only</option>
                  <option value="Gov">Governance Only</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Start Date</label>
              <input 
                type="date"
                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">End Date</label>
              <input 
                type="date"
                value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-6 border-t border-white/5 gap-4">
            <button 
              type="submit"
              disabled={downloadingCsv}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingCsv ? '...' : '📥 Export CSV Data'}
            </button>

            <button 
              type="button"
              onClick={handleExportPDF}
              disabled={downloadingPdf}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"
            >
              {downloadingPdf ? 'Generating...' : '📄 Generate Executive PDF'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Executive Report Preview Area */}
      <div className="bg-white text-gray-900 rounded-xl p-10 max-w-4xl mx-auto shadow-2xl relative" ref={reportRef}>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-t-xl"></div>
        
        <div className="flex justify-between items-end mb-8 border-b pb-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">EcoSphere</h1>
            <h2 className="text-lg text-gray-500 font-medium tracking-widest uppercase mt-1">Executive ESG Summary</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">Filters: {module} Module, Dept: {deptId || 'All'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Total Carbon</p>
            <p className="text-3xl font-black text-green-600">{summaryData.total_carbon.split(' ')[0]} <span className="text-sm font-medium text-gray-400">{summaryData.total_carbon.split(' ')[1]}</span></p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">CSR Participation</p>
            <p className="text-3xl font-black text-blue-600">{summaryData.csr_participation.split(' ')[0]} <span className="text-sm font-medium text-gray-400">{summaryData.csr_participation.split(' ')[1]}</span></p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Compliance Score</p>
            <p className="text-3xl font-black text-purple-600">{summaryData.compliance_score}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Executive Insights (Eco-AI)</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Positive Trend:</strong> Scope 2 emissions have dropped by 12% quarter-over-quarter due to the new renewable energy procurement policy.</li>
              <li><strong>Risk Area:</strong> Governance audit completion is currently lagging in the Logistics department; 3 compliance issues are past due.</li>
              <li><strong>Social Impact:</strong> Employee engagement via Gamification has increased diversity training completion rates by 45%.</li>
            </ul>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-400">
            <p>Generated automatically by EcoSphere Management Platform.</p>
            <p>For internal executive review only.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
