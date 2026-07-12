import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function CarbonDNA() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [dnaData, setDnaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State to track expanded departments and sources
  const [expandedDepts, setExpandedDepts] = useState<Record<number, boolean>>({});
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const fetchDNA = async () => {
    setLoading(true);
    try {
      const params = selectedDept === 'All' ? {} : { dept_id: parseInt(selectedDept) };
      const response = await api.get('/environmental/carbon-dna', { params });
      setDnaData(response.data);
      
      // Auto expand the first department by default if single selection
      if (selectedDept !== 'All' && response.data.departments.length > 0) {
        setExpandedDepts({ [response.data.departments[0].dept_id]: true });
      }
    } catch (err) {
      toast("Failed to load Carbon DNA trace", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch departments for filter dropdown
    api.get('/master_data/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error("Error departments:", err));
  }, []);

  useEffect(() => {
    fetchDNA();
  }, [selectedDept]);

  const toggleDept = (deptId: number) => {
    setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const toggleSource = (key: string) => {
    setExpandedSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            🧬 Carbon DNA — End-to-End Emission Traceability
          </h1>
          <p className="text-gray-400">
            Trace emissions from organizational totals all the way to the specific vehicle or asset transaction.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-400">Filter Scope:</label>
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl p-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-green-500/50 appearance-none cursor-pointer"
          >
            <option value="All" className="bg-[#18181b]">Entire Organization</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id} className="bg-[#18181b]">{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Core Platform Promise Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[30px] pointer-events-none"></div>
        <div className="text-2xl">🛡️</div>
        <div>
          <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">Audit & Compliance Promise</p>
          <p className="text-sm text-gray-200 font-semibold mt-0.5">
            "EcoSphere does not just report emissions. It proves where they came from."
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-gray-400 border border-white/5 bg-white/5 animate-pulse rounded-2xl">
          Loading Carbon DNA Trace...
        </div>
      ) : dnaData ? (
        <div className="space-y-6">
          
          {/* Top Organization Summary Node */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/5 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none"></div>
            <div>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span> Organization Emissions Base Node
              </h2>
              <p className="text-3xl font-black text-white mt-2">
                {dnaData.org_total_co2e.toLocaleString()} <span className="text-sm text-gray-400 font-medium">kg CO2e</span>
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-gray-400">
              Trace Lineage Root: <span className="text-green-400">Verified Database Records</span>
            </div>
          </div>

          {/* Lineage Tree Explorer */}
          <div className="space-y-4">
            {dnaData.departments.map((dept: any) => {
              const isDeptExpanded = expandedDepts[dept.dept_id];
              return (
                <div key={dept.dept_id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all bg-white/5">
                  
                  {/* Department Node Header */}
                  <div 
                    onClick={() => toggleDept(dept.dept_id)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors select-none"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg transition-transform duration-200 inline-block">
                        {isDeptExpanded ? "▼" : "▶"}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-gray-200 flex items-center gap-2">
                          {dept.dept_name} <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400 uppercase font-mono">{dept.dept_code}</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Department contribution to organizational carbon total</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-base font-extrabold text-white">{dept.total_co2e.toLocaleString()} kg</p>
                      <p className="text-xs text-green-400 font-bold mt-0.5">{dept.contribution_pct}% of total</p>
                    </div>
                  </div>

                  {/* Department Contents */}
                  {isDeptExpanded && (
                    <div className="border-t border-white/5 bg-black/20 p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {dept.sources.length > 0 ? (
                        dept.sources.map((source: any) => {
                          const sourceKey = `${dept.dept_id}-${source.source_type}`;
                          const isSourceExpanded = expandedSources[sourceKey];
                          
                          return (
                            <div key={source.source_type} className="border border-white/5 rounded-xl bg-black/30 overflow-hidden">
                              
                              {/* Operational Source Header */}
                              <div 
                                onClick={() => toggleSource(sourceKey)}
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors select-none"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm transition-transform duration-200 inline-block">
                                    {isSourceExpanded ? "▼" : "▶"}
                                  </span>
                                  <h4 className="text-sm font-bold text-gray-300">
                                    ⚙️ {source.source_type} Operations
                                  </h4>
                                </div>
                                <span className="text-sm font-semibold text-gray-300">
                                  {source.total_co2e.toLocaleString()} kg CO2e
                                </span>
                              </div>

                              {/* Transaction Drill-down Table */}
                              {isSourceExpanded && (
                                <div className="border-t border-white/5 overflow-x-auto bg-black/40">
                                  <table className="w-full text-left text-xs text-gray-400">
                                    <thead className="bg-white/5 text-gray-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                                      <tr>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold">Asset/Ref ID</th>
                                        <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                                        <th className="px-4 py-3 font-semibold text-right">EF Rate</th>
                                        <th className="px-4 py-3 font-semibold text-right">Calculated CO2e</th>
                                        <th className="px-4 py-3 font-semibold text-center">Type</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {source.transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                          <td className="px-4 py-3 font-medium text-gray-400">{tx.date}</td>
                                          <td className="px-4 py-3 font-bold text-gray-200">{tx.source_ref}</td>
                                          <td className="px-4 py-3 text-right">{tx.quantity.toLocaleString()} {tx.unit}</td>
                                          <td className="px-4 py-3 text-right font-mono">{tx.ef_rate} kg/unit</td>
                                          <td className="px-4 py-3 text-right font-bold text-white">{tx.co2e.toLocaleString()} kg</td>
                                          <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${tx.auto_calculated ? 'bg-green-500/20 text-green-400 border border-green-500/10' : 'bg-orange-500/20 text-orange-400 border border-orange-500/10'}`}>
                                              {tx.auto_calculated ? "Auto" : "Manual"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-4">No emissions recorded for this department.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center text-gray-500 border border-white/5 bg-white/5 rounded-2xl">
          No trace data could be generated. Ensure carbon transactions exist.
        </div>
      )}
    </div>
  );
}
