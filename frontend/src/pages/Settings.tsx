export default function Settings() {
  const depts = [
    { name: 'Manufacturing', code: 'MFG', head: 'S. Nair', parent: '—', employees: 134, status: 'Active' },
    { name: 'Logistics', code: 'LOG', head: 'R. Iyer', parent: 'Manufacturing', employees: 58, status: 'Active' },
    { name: 'Corporate', code: 'CORP', head: 'A. Mehta', parent: '—', employees: 41, status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex space-x-1 border-b border-gray-800 bg-[#1e1e1e] rounded-t-md overflow-hidden text-sm">
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Dashboard</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Environmental</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Social</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Governance</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Gamification</div>
        <div className="px-6 py-2 text-gray-500 hover:text-gray-300 cursor-pointer">Reports</div>
        <div className="px-6 py-2 bg-gray-800 text-white font-medium border-t-2 border-gray-400">Settings</div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 text-xs border-b border-gray-800 pb-2">
        <div className="px-4 py-1.5 bg-gray-300 text-gray-900 rounded font-medium cursor-pointer w-48 text-center">Departments</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">Categories</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">ESG Configuration</div>
        <div className="px-4 py-1.5 border border-gray-700 rounded text-gray-400 hover:text-gray-200 cursor-pointer w-48 text-center">Notification Settings</div>
      </div>

      <div className="flex space-x-2">
        <button className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-1.5 rounded text-sm font-medium transition-colors">+ New Department</button>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded text-sm transition-colors">Edit</button>
        <button className="bg-red-400 hover:bg-red-500 text-white px-4 py-1.5 rounded text-sm transition-colors">Delete</button>
      </div>

      {/* Departments Table */}
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-800/50 text-gray-400 border-b border-gray-800 text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Head</th>
              <th className="px-4 py-3 font-medium">Parent Dept</th>
              <th className="px-4 py-3 font-medium">Employees</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {depts.map((d, i) => (
              <tr key={i} className="hover:bg-gray-800/30">
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3">{d.code}</td>
                <td className="px-4 py-3">{d.head}</td>
                <td className="px-4 py-3">{d.parent}</td>
                <td className="px-4 py-3">{d.employees}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 rounded-full border border-green-500 text-green-500 text-xs bg-[#121212]">
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ESG Configuration & Notifications Toggle Section */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-300 mb-4">ESG Configuration & Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-4"></div>
            </div>
            <span className="text-sm text-gray-300">Enable auto emission calculation</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-4"></div>
            </div>
            <span className="text-sm text-gray-300">Require evidence for all CSR activities</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-4"></div>
            </div>
            <span className="text-sm text-gray-300">Auto-award badges on challenge completion</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" className="sr-only" defaultChecked />
              <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
              <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform translate-x-4"></div>
            </div>
            <span className="text-sm text-gray-300">Email alerts for new compliance issues</span>
          </label>
        </div>
      </div>

    </div>
  );
}
