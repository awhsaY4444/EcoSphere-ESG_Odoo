import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

export default function Environmental() {
  const [activeTab, setActiveTab] = useState('Environmental Goals');
  // Data lists
  const [goals, setGoals] = useState<any[]>([]);
  const [factors, setFactors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>({ auto_emission_calc: true });
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Modal toggle states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isFactorModalOpen, setIsFactorModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Edit target IDs (null for create)
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [editFactorId, setEditFactorId] = useState<number | null>(null);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editTxId, setEditTxId] = useState<number | null>(null);

  // Form states - Goals
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetValue, setGoalTargetValue] = useState('');
  const [goalTargetMetric, setGoalTargetMetric] = useState('kg CO2e');
  const [goalDeadline, setGoalDeadline] = useState('2026-12-31');
  const [goalDeptId, setGoalDeptId] = useState('');

  // Form states - Emission Factors
  const [efActivityType, setEfActivityType] = useState('');
  const [efUnit, setEfUnit] = useState('kWh');
  const [efCo2ePerUnit, setEfCo2ePerUnit] = useState('');
  const [efStatus, setEfStatus] = useState('Active');

  // Form states - Product ESG Profiles
  const [prodName, setProdName] = useState('');
  const [prodCarbonFootprint, setProdCarbonFootprint] = useState('');
  const [prodRating, setProdRating] = useState('A');
  const [prodStatus, setProdStatus] = useState('Active');

  // Form states - Carbon Transactions
  const [txDeptId, setTxDeptId] = useState('');
  const [txSourceType, setTxSourceType] = useState('Purchase');
  const [txSourceRefId, setTxSourceRefId] = useState('');
  const [txQuantity, setTxQuantity] = useState('');
  const [txEfId, setTxEfId] = useState('');
  const [txCo2eCalculated, setTxCo2eCalculated] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch functions
  const fetchGoals = async () => {
    try {
      const res = await api.get('/environmental/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFactors = async () => {
    try {
      const res = await api.get('/master_data/emission-factors');
      setFactors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/master_data/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/environmental/carbon-transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/master_data/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setAppSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchGoals(),
      fetchFactors(),
      fetchProducts(),
      fetchTransactions(),
      fetchDepartments(),
      fetchSettings()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail.tab);
    };
    window.addEventListener('change-tab', handleTabChange);
    return () => window.removeEventListener('change-tab', handleTabChange);
  }, []);

  // CRUD handlers - Goals
  const openGoalModal = (goal: any = null) => {
    if (goal) {
      setEditGoalId(goal.id);
      setGoalTitle(goal.name);
      setGoalTargetValue(goal.target.split(' ')[0]);
      setGoalTargetMetric(goal.target.split(' ')[1] || 'kg CO2e');
      setGoalDeadline(goal.deadline);
      setGoalDeptId(goal.dept_id ? goal.dept_id.toString() : '');
    } else {
      setEditGoalId(null);
      setGoalTitle('');
      setGoalTargetValue('');
      setGoalTargetMetric('kg CO2e');
      setGoalDeadline('2026-12-31');
      setGoalDeptId(departments[0]?.id.toString() || '');
    }
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: goalTitle,
      target_metric: goalTargetMetric,
      target_value: parseFloat(goalTargetValue),
      current_value: editGoalId ? parseFloat(goals.find(g => g.id === editGoalId)?.current.split(' ')[0] || '0.0') : 0.0,
      deadline: goalDeadline,
      dept_id: goalDeptId === '' || goalDeptId === 'All' ? null : parseInt(goalDeptId)
    };

    try {
      if (editGoalId) {
        await api.put(`/environmental/goals/${editGoalId}`, payload);
        toast("Goal updated successfully!", "success");
      } else {
        await api.post('/environmental/goals', payload);
        toast("Goal created successfully!", "success");
      }
      setIsGoalModalOpen(false);
      fetchGoals();
    } catch (err) {
      toast("Failed to save goal", "error");
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        await api.delete(`/environmental/goals/${id}`);
        toast("Goal deleted successfully!", "success");
        fetchGoals();
      } catch (err) {
        toast("Failed to delete goal", "error");
      }
    }
  };

  // CRUD handlers - Emission Factors
  const openFactorModal = (ef: any = null) => {
    if (ef) {
      setEditFactorId(ef.id);
      setEfActivityType(ef.activity_type);
      setEfUnit(ef.unit);
      setEfCo2ePerUnit(ef.co2e_per_unit.toString());
      setEfStatus(ef.status);
    } else {
      setEditFactorId(null);
      setEfActivityType('');
      setEfUnit('kWh');
      setEfCo2ePerUnit('');
      setEfStatus('Active');
    }
    setIsFactorModalOpen(true);
  };

  const handleSaveFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      activity_type: efActivityType,
      unit: efUnit,
      co2e_per_unit: parseFloat(efCo2ePerUnit),
      status: efStatus
    };

    try {
      if (editFactorId) {
        await api.put(`/master_data/emission-factors/${editFactorId}`, payload);
        toast("Emission factor updated!", "success");
      } else {
        await api.post('/master_data/emission-factors', payload);
        toast("Emission factor created!", "success");
      }
      setIsFactorModalOpen(false);
      fetchFactors();
    } catch (err) {
      toast("Failed to save emission factor", "error");
    }
  };

  const handleDeleteFactor = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this emission factor?")) {
      try {
        await api.delete(`/master_data/emission-factors/${id}`);
        toast("Emission factor deleted!", "success");
        fetchFactors();
      } catch (err) {
        toast("Failed to delete emission factor", "error");
      }
    }
  };

  // CRUD handlers - Products
  const openProductModal = (prod: any = null) => {
    if (prod) {
      setEditProductId(prod.id);
      setProdName(prod.name);
      setProdCarbonFootprint(prod.carbon_footprint_per_unit.toString());
      setProdRating(prod.sustainability_rating);
      setProdStatus(prod.status);
    } else {
      setEditProductId(null);
      setProdName('');
      setProdCarbonFootprint('');
      setProdRating('A');
      setProdStatus('Active');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      carbon_footprint_per_unit: parseFloat(prodCarbonFootprint),
      sustainability_rating: prodRating,
      status: prodStatus
    };

    try {
      if (editProductId) {
        await api.put(`/master_data/products/${editProductId}`, payload);
        toast("Product profile updated!", "success");
      } else {
        await api.post('/master_data/products', payload);
        toast("Product profile created!", "success");
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast("Failed to save product profile", "error");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product profile?")) {
      try {
        await api.delete(`/master_data/products/${id}`);
        toast("Product profile deleted!", "success");
        fetchProducts();
      } catch (err) {
        toast("Failed to delete product profile", "error");
      }
    }
  };

  // CRUD handlers - Carbon Transactions
  const openTxModal = (tx: any = null) => {
    if (tx) {
      setEditTxId(tx.id);
      setTxDeptId(tx.dept_id.toString());
      setTxSourceType(tx.source_type);
      setTxSourceRefId(tx.source_ref_id);
      setTxQuantity(tx.quantity.toString());
      setTxEfId(tx.emission_factor_id.toString());
      setTxCo2eCalculated(tx.co2e_calculated.toString());
      setTxDate(tx.date.slice(0, 10));
    } else {
      setEditTxId(null);
      setTxDeptId(departments[0]?.id.toString() || '');
      setTxSourceType('Purchase');
      setTxSourceRefId('');
      setTxQuantity('');
      setTxEfId(factors[0]?.id.toString() || '');
      setTxCo2eCalculated('');
      setTxDate(new Date().toISOString().slice(0, 10));
    }
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      dept_id: parseInt(txDeptId),
      source_type: txSourceType,
      source_ref_id: txSourceRefId,
      quantity: parseFloat(txQuantity),
      emission_factor_id: parseInt(txEfId),
      co2e_calculated: appSettings.auto_emission_calc ? 0.0 : parseFloat(txCo2eCalculated),
      date: txDate + "T00:00:00"
    };

    try {
      if (editTxId) {
        await api.put(`/environmental/carbon-transactions/${editTxId}`, payload);
        toast("Carbon transaction updated!", "success");
      } else {
        await api.post('/environmental/carbon-transactions', payload);
        toast("Carbon transaction logged!", "success");
      }
      setIsTxModalOpen(false);
      fetchTransactions();
      fetchGoals(); // goals recalculate from transactions
    } catch (err) {
      toast("Failed to save transaction", "error");
    }
  };

  const handleDeleteTx = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction record?")) {
      try {
        await api.delete(`/environmental/carbon-transactions/${id}`);
        toast("Carbon transaction deleted!", "success");
        fetchTransactions();
        fetchGoals();
      } catch (err) {
        toast("Failed to delete transaction", "error");
      }
    }
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'Environmental Goals') {
      csvContent += "ID,Name,Department,Target,Current,Progress,Deadline,Status\n"
        + goals.map(g => `${g.id},${g.name},${g.dept},${g.target},${g.current},${g.progress},${g.deadline},${g.status}`).join("\n");
    } else if (activeTab === 'Emission Factors') {
      csvContent += "ID,Activity Type,Unit,CO2e per Unit,Status\n"
        + factors.map(f => `${f.id},${f.activity_type},${f.unit},${f.co2e_per_unit},${f.status}`).join("\n");
    } else if (activeTab === 'Product ESG Profiles') {
      csvContent += "ID,Product Name,Carbon Footprint per Unit,Sustainability Rating,Status\n"
        + products.map(p => `${p.id},${p.name},${p.carbon_footprint_per_unit},${p.sustainability_rating},${p.status}`).join("\n");
    } else if (activeTab === 'Carbon Transactions') {
      csvContent += "ID,Dept ID,Source Type,Ref ID,Quantity,CO2e Calculated,Date,Auto Calculated\n"
        + transactions.map(t => `${t.id},${t.dept_id},${t.source_type},${t.source_ref_id},${t.quantity},${t.co2e_calculated},${t.date.slice(0,10)},${t.auto_calculated}`).join("\n");
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab.toLowerCase().replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper resolvers
  const getDeptName = (id: number) => {
    const d = departments.find(dept => dept.id === id);
    return d ? `${d.name} (${d.code})` : `Dept ID: ${id}`;
  };

  const getEfLabel = (id: number) => {
    const f = factors.find(ef => ef.id === id);
    return f ? `${f.activity_type} (${f.co2e_per_unit} kg CO2e / ${f.unit})` : `Factor ID: ${id}`;
  };

  // Filter lists based on search
  const filteredGoals = goals.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFactors = factors.filter(f => 
    f.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sustainability_rating.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => 
    t.source_ref_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.source_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getDeptName(t.dept_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
          🌱 Environmental Module
        </h1>
        <p className="text-gray-400">
          Configure emission factors, document operational carbon footprints, trace transaction lists, and drive environmental scores.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-sm bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
        {['Emission Factors', 'Product ESG Profiles', 'Carbon Transactions', 'Environmental Goals'].map(tab => (
          <div 
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchQuery('');
            }}
            className={`px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition-all duration-200 ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#18181b] p-4 rounded-2xl border border-white/5">
        <div className="flex space-x-3 w-full sm:w-auto">
          {activeTab === 'Environmental Goals' && (
            <button onClick={() => openGoalModal()} className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
              <span>+</span> New Goal
            </button>
          )}
          {activeTab === 'Emission Factors' && (
            <button onClick={() => openFactorModal()} className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
              <span>+</span> New Factor
            </button>
          )}
          {activeTab === 'Product ESG Profiles' && (
            <button onClick={() => openProductModal()} className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
              <span>+</span> New Product Profile
            </button>
          )}
          {activeTab === 'Carbon Transactions' && (
            <button onClick={() => openTxModal()} className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
              <span>+</span> Log Transaction
            </button>
          )}
          <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
            Export <span>▼</span>
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-3 text-gray-500">🔍</span>
          <input 
            type="text" 
            placeholder={`Search ${activeTab.toLowerCase()}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all" 
          />
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-16 text-center text-gray-400 border border-white/5 bg-white/5 rounded-2xl animate-pulse font-medium">
          Fetching live ledger entries...
        </div>
      ) : (
        <>
          {/* TAB: ENVIRONMENTAL GOALS */}
          {activeTab === 'Environmental Goals' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Goal Name</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold">Target</th>
                    <th className="px-6 py-4 font-semibold">Current</th>
                    <th className="px-6 py-4 font-semibold w-48">Progress</th>
                    <th className="px-6 py-4 font-semibold">Deadline</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredGoals.map(goal => (
                    <tr key={goal.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-200">{goal.name}</td>
                      <td className="px-6 py-4 text-gray-400">{goal.dept}</td>
                      <td className="px-6 py-4 font-mono font-semibold">{goal.target}</td>
                      <td className="px-6 py-4 font-mono font-semibold">{goal.current}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold w-9 text-right text-green-400">{goal.progress}%</span>
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-white/5">
                            <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full relative" style={{ width: `${goal.progress}%` }}>
                              <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-mono">{goal.deadline}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          goal.status === 'Completed' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                          goal.status === 'Active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 
                          'bg-gray-500/20 text-gray-400 border border-gray-500/20'
                        }`}>
                          {goal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openGoalModal(goal)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                            ✏️
                          </button>
                          <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGoals.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                        <div className="text-4xl mb-3">🌱</div>
                        <p>No environmental goals match your search scope.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: EMISSION FACTORS */}
          {activeTab === 'Emission Factors' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Activity Type</th>
                    <th className="px-6 py-4 font-semibold">Measurement Unit</th>
                    <th className="px-6 py-4 font-semibold text-right">CO2e per Unit (kg)</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFactors.map(ef => (
                    <tr key={ef.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-200">{ef.activity_type}</td>
                      <td className="px-6 py-4 text-gray-400 font-mono">{ef.unit}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-green-400">{ef.co2e_per_unit.toFixed(3)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          ef.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                          'bg-red-500/20 text-red-400 border border-red-500/20'
                        }`}>
                          {ef.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openFactorModal(ef)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                            ✏️
                          </button>
                          <button onClick={() => handleDeleteFactor(ef.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFactors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                        <div className="text-4xl mb-3">⚙️</div>
                        <p>No emission factors found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: PRODUCT ESG PROFILES */}
          {activeTab === 'Product ESG Profiles' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Product Name</th>
                    <th className="px-6 py-4 font-semibold text-right">Carbon Footprint / Unit (kg)</th>
                    <th className="px-6 py-4 font-semibold text-center">Sustainability Rating</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-200">{p.name}</td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-gray-400">{p.carbon_footprint_per_unit.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          p.sustainability_rating === 'A' || p.sustainability_rating === 'B' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/25' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/25'
                        }`}>
                          ★ {p.sustainability_rating}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          p.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 
                          'bg-red-500/20 text-red-400 border border-red-500/20'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openProductModal(p)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                            ✏️
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                        <div className="text-4xl mb-3">📦</div>
                        <p>No product profiles found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: CARBON TRANSACTIONS */}
          {activeTab === 'Carbon Transactions' && (
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-white/5">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 border-b border-white/5 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold">Operational Source</th>
                    <th className="px-6 py-4 font-semibold">Asset Ref ID</th>
                    <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                    <th className="px-6 py-4 font-semibold text-right">CO2e Calculated</th>
                    <th className="px-6 py-4 font-semibold text-center">Type</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-gray-400 font-mono">{tx.date.slice(0, 10)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-200">{getDeptName(tx.dept_id)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-300">
                        <span className="capitalize">{tx.source_type}</span> ({getEfLabel(tx.emission_factor_id).split(' (')[0]})
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400">{tx.source_ref_id}</td>
                      <td className="px-6 py-4 text-right font-mono font-medium">{tx.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono font-extrabold text-white">{tx.co2e_calculated.toLocaleString()} kg</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.auto_calculated 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/10' 
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/10'
                        }`}>
                          {tx.auto_calculated ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openTxModal(tx)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                            ✏️
                          </button>
                          <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                        <div className="text-4xl mb-3">📊</div>
                        <p>No carbon ledger transactions recorded.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 bg-black/20 p-3.5 rounded-xl border border-white/5 w-fit mx-auto mt-6">
            <span className="text-green-400 font-bold">ℹ️ Info:</span> Calculations follow the verified ESG framework: 
            <code className="text-green-400 font-mono ml-1 font-bold">CO2e = Activity Quantity × Emission Factor</code>.
          </div>
        </>
      )}

      {/* GOAL DIALOG MODAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">{editGoalId ? 'Edit Environmental Goal' : 'Create New Environmental Goal'}</h3>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Goal Title</label>
                <input required type="text" placeholder="e.g. Reduce Fleet Diesel Usage" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Target Metric Value</label>
                  <input required type="number" step="any" placeholder="e.g. 5000" value={goalTargetValue} onChange={e => setGoalTargetValue(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Metric Unit</label>
                  <select value={goalTargetMetric} onChange={e => setGoalTargetMetric(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                    <option value="kg CO2e">kg CO2e</option>
                    <option value="MT CO2e">MT CO2e</option>
                    <option value="liter">liters</option>
                    <option value="kWh">kWh</option>
                    <option value="km">km</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Department</label>
                  <select value={goalDeptId} onChange={e => setGoalDeptId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                    <option value="">All Departments</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Deadline</label>
                  <input required type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsGoalModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-sm font-semibold transition-all">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACTOR DIALOG MODAL */}
      {isFactorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">{editFactorId ? 'Edit Emission Factor' : 'Add New Emission Factor'}</h3>
            <form onSubmit={handleSaveFactor} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Activity Operational Type</label>
                <input required type="text" placeholder="e.g. Diesel Fuel, Office Electricity" value={efActivityType} onChange={e => setEfActivityType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Emission Rate (kg CO2e / unit)</label>
                  <input required type="number" step="any" placeholder="e.g. 2.68" value={efCo2ePerUnit} onChange={e => setEfCo2ePerUnit(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Unit of Measurement</label>
                  <input required type="text" placeholder="e.g. liter, kWh, km" value={efUnit} onChange={e => setEfUnit(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Status</label>
                <select value={efStatus} onChange={e => setEfStatus(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsFactorModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-sm font-semibold transition-all">Save Factor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DIALOG MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">{editProductId ? 'Edit Product ESG Profile' : 'Add New Product ESG Profile'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Product Name</label>
                <input required type="text" placeholder="e.g. Eco-Friendly Paper Notebook" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Carbon Footprint / Unit (kg)</label>
                  <input required type="number" step="any" placeholder="e.g. 1.25" value={prodCarbonFootprint} onChange={e => setProdCarbonFootprint(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Sustainability Grade Rating</label>
                  <select value={prodRating} onChange={e => setProdRating(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                    <option value="A">Grade A (Excellent)</option>
                    <option value="B">Grade B (Good)</option>
                    <option value="C">Grade C (Standard)</option>
                    <option value="D">Grade D (Substandard)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Status</label>
                <select value={prodStatus} onChange={e => setProdStatus(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-sm font-semibold transition-all">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION DIALOG MODAL */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl p-6 bg-[#18181b] space-y-6">
            <h3 className="text-lg font-bold text-white">{editTxId ? 'Edit Carbon Transaction' : 'Log Carbon Transaction'}</h3>
            <form onSubmit={handleSaveTx} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Target Department</label>
                  <select value={txDeptId} onChange={e => setTxDeptId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Operational Category Source</label>
                  <select value={txSourceType} onChange={e => setTxSourceType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                    <option value="Purchase">Purchase</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Expense">Expense</option>
                    <option value="Fleet">Fleet</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Asset/Vehicle/Ref ID</label>
                  <input required type="text" placeholder="e.g. Server-IT3, Truck-OPS4" value={txSourceRefId} onChange={e => setTxSourceRefId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Activity Quantity</label>
                  <input required type="number" step="any" placeholder="e.g. 1200" value={txQuantity} onChange={e => setTxQuantity(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase">Matching Emission Factor</label>
                <select value={txEfId} onChange={e => setTxEfId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50">
                  {factors.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.activity_type} ({f.co2e_per_unit} kg/{f.unit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Log Date</label>
                  <input required type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Emissions (kg CO2e)</label>
                  {appSettings.auto_emission_calc ? (
                    <div className="w-full bg-[#18181b]/50 border border-white/5 rounded-xl p-3 text-sm text-green-400 font-bold font-mono">
                      [Auto Calculated]
                    </div>
                  ) : (
                    <input required type="number" step="any" placeholder="Manual CO2e input" value={txCo2eCalculated} onChange={e => setTxCo2eCalculated(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50" />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsTxModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-sm font-semibold transition-all">Log transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
