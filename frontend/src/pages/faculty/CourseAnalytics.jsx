import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { facultyService } from '../../services/api.js';
import { 
  ChevronLeft, BarChart4, Award, TrendingUp, 
  HelpCircle, RefreshCw, AlertCircle, Loader, Trophy 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const CourseAnalytics = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSubjectId = searchParams.get('subjectId') || '';

  const [assignedCourses, setAssignedCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId);
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAssigned = async () => {
    try {
      const res = await facultyService.getDashboard();
      if (res.success && res.data.courses) {
        setAssignedCourses(res.data.courses);
        if (!initialClassId && res.data.courses.length > 0) {
          setSelectedClass(res.data.courses[0].class_id);
          setSelectedSubject(res.data.courses[0].subject_id);
        }
      }
    } catch (err) {
      setError('Failed to fetch assigned workloads.');
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    setError('');
    try {
      const res = await facultyService.getCourseAnalytics(selectedClass, selectedSubject);
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedClass, selectedSubject]);

  if (loading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyber-accent border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING CHART GRAPHICS...</span>
      </div>
    );
  }

  const { toppers = [], grades = [], summary = { avg_score: 0, max_score: 0, min_score: 0 } } = analytics || {};

  // Sort grades order S, A, B, C, D, E, F
  const gradeOrder = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
  const chartData = gradeOrder.map(g => {
    const matched = grades.find(item => item.grade === g);
    return {
      grade: g,
      count: matched ? matched.count : 0
    };
  });

  const stats = [
    { label: 'MAX SCORE', value: summary.max_score ? parseFloat(summary.max_score).toFixed(1) : '0.0', color: 'text-cyber-success' },
    { label: 'CLASS AVERAGE', value: summary.avg_score ? parseFloat(summary.avg_score).toFixed(1) : '0.0', color: 'text-cyber-primary' },
    { label: 'MIN SCORE', value: summary.min_score ? parseFloat(summary.min_score).toFixed(1) : '0.0', color: 'text-cyber-danger' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-cyber-border/20 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/faculty')}
            className="p-2 rounded-lg border border-cyber-border/30 hover:border-cyber-primary bg-slate-900/60 text-cyber-muted hover:text-cyber-primary transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white uppercase">COURSE PERFORMANCE CHARTS</h1>
            <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
              Class scoring aggregations, grade distributions, and topper statistics
            </p>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="glass-panel p-4 flex flex-wrap gap-4 items-center border-cyber-border/10">
        <div>
          <label className="text-[8px] font-cyber text-cyber-primary tracking-widest block mb-1">WORKLOAD SELECTION</label>
          <select 
            value={`${selectedClass}-${selectedSubject}`} 
            onChange={(e) => {
              const [cId, sId] = e.target.value.split('-');
              setSelectedClass(cId);
              setSelectedSubject(sId);
            }}
            className="bg-slate-900 border border-cyber-border/30 rounded-lg px-3 py-2 text-xs font-cyber text-cyber-text"
          >
            {assignedCourses.map(c => (
              <option key={`${c.class_id}-${c.subject_id}`} value={`${c.class_id}-${c.subject_id}`}>
                {c.subject_name} ({c.class_name})
              </option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={fetchAnalytics}
          className="p-2.5 rounded-lg border border-cyber-border/40 hover:border-cyber-accent bg-slate-900/60 text-cyber-accent cursor-pointer ml-auto transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger">
          Error: {error}
        </div>
      )}

      {analytics && (
        <div className="space-y-6">
          {/* Summary KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((item, i) => (
              <div key={i} className="glass-panel p-5 border-cyber-border/10 text-center hover:scale-[1.01]">
                <span className="text-[9px] font-cyber text-cyber-muted tracking-widest uppercase font-bold block mb-2">{item.label}</span>
                <span className={`text-3xl font-bold font-outfit ${item.color} tracking-tight block leading-none`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grade distribution Recharts bar chart */}
            <div className="glass-panel p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-accent uppercase mb-1">
                  GRADE WEIGHT DISTRIBUTION
                </h3>
                <p className="text-[9px] text-cyber-muted tracking-wider uppercase font-mono mb-6">
                  Quantity of student nodes allocated to each letter grade
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="grade" stroke="#9ca3af" fontSize={10} fontFamily="Orbitron" tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} fontFamily="Outfit" tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px' }}
                      labelStyle={{ color: '#ec4899', fontFamily: 'Orbitron', fontSize: 10 }}
                      itemStyle={{ color: '#fff', fontSize: 10 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.grade === 'F' ? '#ef4444' : '#ec4899'} 
                          style={{ filter: 'drop-shadow(0px 0px 5px rgba(236, 72, 153, 0.4))' }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Toppers list */}
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-warning uppercase mb-1 flex items-center gap-1.5">
                  <Trophy size={14} className="text-cyber-warning animate-float" />
                  <span>TOP PERFORMERS</span>
                </h3>
                <p className="text-[9px] text-cyber-muted tracking-wider uppercase font-mono mb-6">
                  Highest scoring student profiles in this subject module
                </p>
              </div>

              <div className="space-y-4 flex-1">
                {toppers.length === 0 ? (
                  <div className="text-center p-8 text-cyber-muted text-[10px] font-cyber uppercase tracking-wider">No topper listings.</div>
                ) : (
                  toppers.map((t, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border border-cyber-border/5 bg-slate-900/40 hover:border-cyber-warning/20 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full text-[10px] font-cyber flex items-center justify-center font-bold border ${
                          index === 0 
                            ? 'border-cyber-warning bg-cyber-warning/15 text-cyber-warning shadow-glow-purple'
                            : index === 1
                              ? 'border-cyber-primary bg-cyber-primary/15 text-cyber-primary'
                              : 'border-cyber-muted bg-slate-800 text-cyber-muted'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-cyber font-bold capitalize text-cyber-text">{t.name}</span>
                          <span className="text-[9px] text-cyber-muted font-mono">{t.roll_number}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-white block">{parseFloat(t.total_marks).toFixed(1)}</span>
                        <span className="text-[8px] font-cyber text-cyber-success uppercase font-semibold">GRADE {t.grade}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseAnalytics;
