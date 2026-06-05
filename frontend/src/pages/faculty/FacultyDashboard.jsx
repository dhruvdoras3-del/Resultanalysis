import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { facultyService } from '../../services/api.js';
import { 
  BookOpen, Users, Percent, Award, FileText, 
  CalendarCheck, BarChart4, RefreshCw, ServerOff 
} from 'lucide-react';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await facultyService.getDashboard();
      if (res.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync instructor cells.');
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
        <div className="w-10 h-10 border-4 border-cyber-secondary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING WORKLOAD CELL...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 border-cyber-danger/30 bg-cyber-danger/5 text-center max-w-lg mx-auto mt-20">
        <ServerOff size={40} className="text-cyber-danger mx-auto mb-3 animate-bounce" />
        <h3 className="font-cyber font-bold text-cyber-danger text-sm mb-2">INSTRUCTOR SYNC OFFLINE</h3>
        <p className="text-xs text-cyber-muted mb-4">{error}</p>
        <button onClick={fetchDashboard} className="btn-cyber-secondary px-4 py-2 text-[10px]">
          RE-ESTABLISH LINK
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-cyber-border/20 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">INSTRUCTOR DASHBOARD</h1>
          <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
            Manage student scores, logs, and subject performance metrics
          </p>
        </div>
        <button 
          onClick={fetchDashboard}
          className="p-2 rounded-lg border border-cyber-border/40 hover:border-cyber-secondary bg-slate-900/60 text-cyber-secondary cursor-pointer transition-all duration-300"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Courses Workload Grid */}
      <h3 className="text-[11px] font-cyber text-cyber-primary tracking-widest uppercase mb-4">ASSIGNED MODULES:</h3>
      
      {courses.length === 0 ? (
        <div className="glass-panel p-12 text-center text-cyber-muted font-cyber text-xs uppercase tracking-wider">
          No active course allocations assigned to your profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c) => (
            <div key={c.id} className="glass-panel p-6 border-cyber-border/10 flex flex-col justify-between hover:scale-[1.01]">
              <div className="border-b border-cyber-border/10 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <h2 className="text-sm font-cyber font-bold text-white tracking-wider truncate max-w-[75%]">
                    {c.subject_name}
                  </h2>
                  <span className="text-[9px] font-cyber px-2.5 py-0.5 rounded bg-cyber-primary/5 border border-cyber-primary/20 text-cyber-primary uppercase font-bold">
                    {c.class_name}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-cyber-muted tracking-widest block mt-1">
                  MODULE ID: {c.subject_code} • {c.credits} CREDITS
                </span>
              </div>

              {/* Statistics row */}
              <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                <div className="p-3 rounded-lg bg-slate-900/40 border border-cyber-border/5">
                  <div className="flex justify-center mb-1 text-cyber-muted">
                    <Users size={12} />
                  </div>
                  <span className="text-[8px] font-cyber text-cyber-muted block tracking-wider uppercase">STUDENTS</span>
                  <span className="text-sm font-bold font-outfit text-white leading-none mt-1.5 block">
                    {c.totalStudents}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-cyber-border/5">
                  <div className="flex justify-center mb-1 text-cyber-muted">
                    <Award size={12} />
                  </div>
                  <span className="text-[8px] font-cyber text-cyber-muted block tracking-wider uppercase">CLASS AVG</span>
                  <span className="text-sm font-bold font-outfit text-cyber-warning leading-none mt-1.5 block">
                    {c.averageMarks}/100
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-cyber-border/5">
                  <div className="flex justify-center mb-1 text-cyber-muted">
                    <Percent size={12} />
                  </div>
                  <span className="text-[8px] font-cyber text-cyber-muted block tracking-wider uppercase">PASS RATE</span>
                  <span className="text-sm font-bold font-outfit text-cyber-success leading-none mt-1.5 block">
                    {c.passRate}%
                  </span>
                </div>
              </div>

              {/* Command Actions */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-cyber-border/5">
                <button
                  onClick={() => navigate(`/faculty/marks?classId=${c.class_id}&subjectId=${c.subject_id}`)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-cyber-primary/20 hover:border-cyber-primary text-[10px] font-cyber text-cyber-primary hover:bg-cyber-primary/5 transition-all cursor-pointer"
                >
                  <FileText size={12} />
                  <span>GRADES</span>
                </button>
                <button
                  onClick={() => navigate(`/faculty/attendance?classId=${c.class_id}&subjectId=${c.subject_id}`)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-cyber-secondary/20 hover:border-cyber-secondary text-[10px] font-cyber text-cyber-secondary hover:bg-cyber-secondary/5 transition-all cursor-pointer"
                >
                  <CalendarCheck size={12} />
                  <span>ATTENDANCE</span>
                </button>
                <button
                  onClick={() => navigate(`/faculty/analytics?classId=${c.class_id}&subjectId=${c.subject_id}`)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-cyber-accent/20 hover:border-cyber-accent text-[10px] font-cyber text-cyber-accent hover:bg-cyber-accent/5 transition-all cursor-pointer"
                >
                  <BarChart4 size={12} />
                  <span>CHARTS</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
