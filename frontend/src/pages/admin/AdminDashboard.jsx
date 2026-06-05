import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api.js';
import { 
  GraduationCap, Users, School, Percent, Award, 
  Terminal, ShieldCheck, RefreshCw, ServerOff 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch terminal data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING TERMINAL DATA...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-panel p-6 border-cyber-danger/30 bg-cyber-danger/5 text-center max-w-lg mx-auto mt-20">
        <ServerOff size={40} className="text-cyber-danger mx-auto mb-3 animate-bounce" />
        <h3 className="font-cyber font-bold text-cyber-danger text-sm mb-2">SYSTEM LINK OFFLINE</h3>
        <p className="text-xs text-cyber-muted mb-4">{error || 'Could not fetch diagnostics.'}</p>
        <button onClick={fetchStats} className="btn-cyber-secondary px-4 py-2 text-[10px]">
          RE-ESTABLISH LINK
        </button>
      </div>
    );
  }

  const { counts, gpa, passPercentage, recentLogs, deptDistribution } = stats;

  const cardData = [
    { title: 'TOTAL STUDENTS', value: counts.students, icon: GraduationCap, color: 'text-cyber-primary', border: 'border-cyber-primary/20' },
    { title: 'FACULTY NODES', value: counts.faculty, icon: Users, color: 'text-cyber-secondary', border: 'border-cyber-secondary/20' },
    { title: 'DEPARTMENTS', value: counts.departments, icon: School, color: 'text-cyber-accent', border: 'border-cyber-accent/20' },
    { title: 'PASS RATIO', value: `${passPercentage}%`, icon: Percent, color: 'text-cyber-success', border: 'border-cyber-success/20' },
    { title: 'SYSTEM AVERAGE GPA', value: gpa, icon: Award, color: 'text-cyber-warning', border: 'border-cyber-warning/20' }
  ];

  // Pie chart data for pass/fail
  const passedCount = Math.round((parseFloat(passPercentage) / 100) * 100) || 85;
  const failedCount = 100 - passedCount;
  const pieData = [
    { name: 'Passed', value: passedCount, color: '#10b981' },
    { name: 'Failed', value: failedCount, color: '#ef4444' }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Dashboard Top Header */}
      <div className="flex justify-between items-center border-b border-cyber-border/20 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">COMMAND TERMINAL</h1>
          <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
            Realtime College Metrics & Audit Diagnostic Controls
          </p>
        </div>
        <button 
          onClick={fetchStats}
          className="p-2.5 rounded-lg border border-cyber-border/40 hover:border-cyber-primary bg-slate-900/60 text-cyber-primary shadow-sm transition-all duration-300 cursor-pointer"
        >
          <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cardData.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`glass-panel p-5 ${card.border} flex flex-col justify-between hover:scale-[1.02]`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-cyber text-cyber-muted tracking-widest font-bold uppercase">{card.title}</span>
                <Icon size={16} className={card.color} />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-white tracking-tight leading-none mt-2">
                {card.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department bar chart */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-primary uppercase mb-1">
              DEPARTMENT REGISTRY DISTRIBUTION
            </h3>
            <p className="text-[9px] text-cyber-muted tracking-wider uppercase font-mono mb-6">
              Number of registered students per academic cell
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="code" stroke="#9ca3af" fontSize={9} fontFamily="Orbitron" tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={9} fontFamily="Outfit" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}
                  labelStyle={{ color: '#38bdf8', fontFamily: 'Orbitron', fontSize: 10 }}
                  itemStyle={{ color: '#fff', fontSize: 10 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {deptDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index % 2 === 0 ? '#38bdf8' : '#a855f7'} 
                      style={{ filter: 'drop-shadow(0px 0px 5px rgba(56, 189, 248, 0.4))' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass / Fail Pie chart */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-secondary uppercase mb-1">
              PASS FAIL GRADIENT
            </h3>
            <p className="text-[9px] text-cyber-muted tracking-wider uppercase font-mono mb-6">
              Exams success ratios across all registered grades
            </p>
          </div>
          
          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute text-center">
              <span className="text-[9px] font-cyber text-cyber-muted block tracking-widest">SUCCESS</span>
              <span className="text-xl font-bold font-outfit text-cyber-success">{passPercentage}%</span>
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-cyber-success"></span>
              <span className="text-[10px] font-cyber text-cyber-muted uppercase">PASS: {passedCount}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-cyber-danger"></span>
              <span className="text-[10px] font-cyber text-cyber-muted uppercase">FAIL: {failedCount}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Audit Preview */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6 border-b border-cyber-border/10 pb-3">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-cyber-primary" />
            <h3 className="text-xs font-cyber font-bold tracking-wider text-white uppercase">SYSTEM LOG PREVIEW</h3>
          </div>
          <span className="text-[8px] font-mono text-cyber-muted px-2 py-0.5 rounded border border-cyber-border/15 bg-slate-900">
            AUDIT DAEMON VERIFIED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyber-border/10">
                <th className="py-2.5 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">TIMESTAMP</th>
                <th className="py-2.5 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">OPERATOR</th>
                <th className="py-2.5 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">ACTION ID</th>
                <th className="py-2.5 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">DETAILS DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id} className="border-b border-cyber-border/5 hover:bg-slate-900/20 transition-colors">
                  <td className="py-3 text-[10px] font-mono text-cyber-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 text-[10px] font-cyber font-semibold text-cyber-text capitalize">
                    {log.username || 'System Daemon'}
                  </td>
                  <td className="py-3 text-[10px] font-mono">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                      log.action.includes('DELETE')
                        ? 'border-cyber-danger/30 bg-cyber-danger/5 text-cyber-danger'
                        : log.action.includes('ADD') || log.action.includes('IMPORT')
                          ? 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                          : 'border-cyber-primary/30 bg-cyber-primary/5 text-cyber-primary'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-[10px] text-cyber-text/80 font-sans truncate max-w-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
