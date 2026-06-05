import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../../services/api.js';
import { 
  Award, Calendar, ShieldAlert, Sparkles, MessageSquareCode, 
  ArrowRight, RefreshCw, ServerOff, Percent, FileText 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studentService.getDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to Student Diagnostics terminal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING ACADEMIC RECORDS...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="glass-panel p-6 border-cyber-danger/30 bg-cyber-danger/5 text-center max-w-lg mx-auto mt-20">
        <ServerOff size={40} className="text-cyber-danger mx-auto mb-3 animate-bounce" />
        <h3 className="font-cyber font-bold text-cyber-danger text-sm mb-2">DIAGNOSTICS NODE OFFLINE</h3>
        <p className="text-xs text-cyber-muted mb-4">{error || 'Could not fetch student records.'}</p>
        <button onClick={fetchDashboard} className="btn-cyber-secondary px-4 py-2 text-[10px]">
          RE-ESTABLISH LINK
        </button>
      </div>
    );
  }

  const { profile, stats, results = [], attendance = [], classAverages = [], aiInsights = {} } = dashboardData;

  // Prepare data for Student Marks vs Class Average Chart
  const marksComparisonData = results.map(r => {
    const classAvgRes = classAverages.find(avg => avg.subject_id === r.subject_id);
    return {
      subject: r.subject_code,
      'My Score': parseFloat(r.total_marks),
      'Class Average': classAvgRes ? parseFloat(parseFloat(classAvgRes.class_average).toFixed(1)) : 65.0
    };
  });

  // Prepare data for Attendance chart
  const attendanceChartData = attendance.map(a => ({
    subject: a.subject_code,
    percentage: parseFloat(a.percentage)
  }));

  const weakSubjectsList = aiInsights.weak_subjects ? JSON.parse(aiInsights.weak_subjects) : [];

  const kpiData = [
    { label: 'CUMULATIVE CGPA', value: stats.cgpa, icon: Award, color: 'text-cyber-primary', border: 'border-cyber-primary/20' },
    { label: 'ATTENDED CLASSES', value: `${stats.overallAttendance}%`, icon: Percent, color: 'text-cyber-success', border: 'border-cyber-success/20' },
    { label: 'PROJECTED GPA', value: aiInsights.predicted_gpa || '0.00', icon: Sparkles, color: 'text-cyber-secondary', border: 'border-cyber-secondary/20' },
    { label: 'ACADEMIC RISK', value: (aiInsights.risk_level || 'low').toUpperCase(), icon: ShieldAlert, color: aiInsights.risk_level === 'high' ? 'text-cyber-danger' : aiInsights.risk_level === 'medium' ? 'text-cyber-warning' : 'text-cyber-success', border: 'border-cyber-border/10' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header Profile summary */}
      <div className="glass-panel p-6 border-cyber-primary/25 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-primary to-transparent"></div>
        <div>
          <span className="text-[9px] font-mono text-cyber-primary tracking-widest block mb-1">STUDENT PROFILE SYNCHRONIZED</span>
          <h1 className="text-xl font-bold tracking-wider text-white uppercase capitalize">{profile.name}</h1>
          <p className="text-[10px] text-cyber-muted font-mono tracking-widest uppercase mt-1">
            Roll No: {profile.rollNumber} • {profile.department} ({profile.class})
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/student/results')}
            className="btn-cyber-primary py-2 px-4 text-[10px] flex items-center gap-2 cursor-pointer shadow-glow-cyan"
          >
            <FileText size={12} />
            <span>REPORT CARD</span>
          </button>
          <button 
            onClick={fetchDashboard}
            className="p-2.5 rounded-lg border border-cyber-border/40 hover:border-cyber-primary bg-slate-900/60 text-cyber-primary cursor-pointer transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`glass-panel p-5 ${item.border} flex flex-col justify-between hover:scale-[1.02]`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[8px] font-cyber text-cyber-muted tracking-widest font-bold uppercase">{item.label}</span>
                <Icon size={16} className={item.color} />
              </div>
              <h2 className="text-2xl font-bold font-outfit text-white tracking-tight leading-none">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Marks comparison chart */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-primary uppercase mb-1">
              SCORE COMPARISON MATRIX
            </h3>
            <p className="text-[9px] text-cyber-muted tracking-wider uppercase font-mono mb-6">
              My subject scores contrasted with class section averages
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marksComparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="subject" stroke="#9ca3af" fontSize={9} fontFamily="Orbitron" tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={9} fontFamily="Outfit" tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px' }}
                  labelStyle={{ color: '#38bdf8', fontFamily: 'Orbitron', fontSize: 10 }}
                  itemStyle={{ color: '#fff', fontSize: 10 }}
                />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'Orbitron', paddingTop: 10 }} />
                <Bar dataKey="My Score" fill="#38bdf8" radius={[4, 4, 0, 0]} style={{ filter: 'drop-shadow(0px 0px 4px rgba(56, 189, 248, 0.3))' }} />
                <Bar dataKey="Class Average" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Area Chart */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-success uppercase mb-1">
              ATTENDANCE MONITOR
            </h3>
            <p className="text-[9px] text-cyber-muted tracking-wider uppercase font-mono mb-6">
              Subject class lecture attendance percentages
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="subject" stroke="#9ca3af" fontSize={9} fontFamily="Orbitron" tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={9} fontFamily="Outfit" tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}
                  labelStyle={{ color: '#10b981', fontFamily: 'Orbitron', fontSize: 10 }}
                  itemStyle={{ color: '#fff', fontSize: 10 }}
                />
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="percentage" stroke="#10b981" fillOpacity={1} fill="url(#colorAtt)" strokeWidth={2} style={{ filter: 'drop-shadow(0px 0px 4px rgba(16, 185, 129, 0.3))' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Suggestions Board */}
      <div className="glass-panel p-6 border-cyber-secondary/20 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded bg-cyber-secondary/10 border border-cyber-secondary/30">
              <Sparkles className="text-cyber-secondary" size={14} />
            </div>
            <h3 className="text-xs font-cyber font-bold tracking-wider text-white uppercase">NEURAL ENGINE RECOMMENDATIONS</h3>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs text-cyber-muted leading-relaxed">
              Advisor analysis finds your primary focus subjects should be: <strong className="text-cyber-secondary font-bold">{weakSubjectsList.length > 0 ? weakSubjectsList.join(', ') : 'None (Ideal State)'}</strong>. 
            </p>
            <p className="text-[10px] text-cyber-text/80 leading-relaxed font-sans bg-slate-900/50 p-3 rounded-lg border border-cyber-border/10">
              {aiInsights.study_plan ? aiInsights.study_plan.replace(/### AI Recommended Study Plan for .*\n/, '').split('\n')[0] : 'Generating insights...'}
            </p>
          </div>
        </div>

        <div className="text-center md:border-l md:border-cyber-border/15 md:pl-6">
          <span className="text-[8px] font-cyber text-cyber-muted tracking-widest block uppercase mb-3">ENGAGE ADVISOR SYSTEM</span>
          <button 
            onClick={() => navigate('/student/chatbot')}
            className="btn-cyber-secondary py-2.5 px-5 flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-glow-purple"
          >
            <MessageSquareCode size={14} className="animate-pulse" />
            <span>OPEN AI COACH</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
