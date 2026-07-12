export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex space-x-1 border-b border-gray-800 bg-[#1e1e1e] rounded-t-md overflow-hidden text-sm">
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Dashboard</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Environmental</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Social</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Governance</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Gamification</div>
        <div className="px-6 py-2 bg-gray-800 text-white font-medium border-t-2 border-gray-400">Reports</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Settings</div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-xs border-b border-gray-800 pb-2">
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Environmental</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Social</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Governance</div>
        <div className="px-4 py-1.5 bg-gray-300 text-gray-900 rounded font-medium cursor-pointer w-40 text-center">ESG Summary</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-40 text-center">Custom Builder</div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 flex flex-col justify-between h-32">
          <div>
            <h3 className="font-medium text-gray-200 flex items-center gap-2 text-sm">
              <span className="text-green-500">🌱</span> Environmental Report
            </h3>
            <p className="text-xs text-gray-400 mt-2">Emissions, goals, vendor & product breakdown</p>
          </div>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 py-1 px-4 rounded text-sm self-start transition-colors">Generate</button>
        </div>

        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 flex flex-col justify-between h-32">
          <div>
            <h3 className="font-medium text-gray-200 flex items-center gap-2 text-sm">
              <span className="text-blue-500">👥</span> Social Report
            </h3>
            <p className="text-xs text-gray-400 mt-2">Diversity, CSR participation, training completion</p>
          </div>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 py-1 px-4 rounded text-sm self-start transition-colors">Generate</button>
        </div>

        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 flex flex-col justify-between h-32">
          <div>
            <h3 className="font-medium text-gray-200 flex items-center gap-2 text-sm">
              <span className="text-purple-500">⚖️</span> Governance Report
            </h3>
            <p className="text-xs text-gray-400 mt-2">Policies, audits, compliance & risk summary</p>
          </div>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 py-1 px-4 rounded text-sm self-start transition-colors">Generate</button>
        </div>

        <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 flex flex-col justify-between h-32">
          <div>
            <h3 className="font-medium text-gray-200 flex items-center gap-2 text-sm">
              <span className="text-gray-400">📊</span> ESG Summary
            </h3>
            <p className="text-xs text-gray-400 mt-2">Executive overview: all 4 scores + dept comparison</p>
          </div>
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 py-1 px-4 rounded text-sm self-start transition-colors">Generate</button>
        </div>
      </div>

      {/* Custom Report Builder */}
      <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mt-4">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          🛠 Custom Report Builder <span className="text-gray-500 font-normal ml-2">Filters</span>
        </h3>
        <div className="flex space-x-2 mb-4 text-sm">
          <div className="px-3 py-1.5 border border-gray-700 rounded text-gray-300 w-32 flex justify-between items-center cursor-pointer">Date Range <span className="text-gray-500">▾</span></div>
          <div className="px-3 py-1.5 border border-gray-700 rounded text-gray-300 w-32 flex justify-between items-center cursor-pointer">Department <span className="text-gray-500">▾</span></div>
          <div className="px-3 py-1.5 border border-gray-700 rounded text-gray-300 w-32 flex justify-between items-center cursor-pointer">Module <span className="text-gray-500">▾</span></div>
          <div className="px-3 py-1.5 border border-gray-700 rounded text-gray-300 w-32 flex justify-between items-center cursor-pointer">Employee <span className="text-gray-500">▾</span></div>
          <div className="px-3 py-1.5 border border-gray-700 rounded text-gray-300 w-32 flex justify-between items-center cursor-pointer">Challenge <span className="text-gray-500">▾</span></div>
          <div className="px-3 py-1.5 border border-gray-700 rounded text-gray-300 w-32 flex justify-between items-center cursor-pointer">ESG Category <span className="text-gray-500">▾</span></div>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded flex items-center gap-2 text-sm">
            ▶ Run Report
          </button>
          <button className="border border-gray-600 hover:bg-gray-800 text-gray-300 px-4 py-1.5 rounded text-sm">Export PDF</button>
          <button className="border border-gray-600 hover:bg-gray-800 text-gray-300 px-4 py-1.5 rounded text-sm">Export Excel</button>
          <button className="border border-gray-600 hover:bg-gray-800 text-gray-300 px-4 py-1.5 rounded text-sm">Export CSV</button>
        </div>
      </div>
    </div>
  );
}
