import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api.js';
import { 
  School, Calendar, BookOpen, Layers, Plus, 
  Trash2, Award, ClipboardCheck, ArrowRight, Loader 
} from 'lucide-react';

const ManageAcademics = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState({ departments: [], classes: [], subjects: [], semesters: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [classForm, setClassForm] = useState({ name: '', departmentId: '', semesterId: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', departmentId: '', credits: 3 });
  const [semesterForm, setSemesterForm] = useState({ name: '', academicYear: '', status: 'inactive' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAcademics();
      if (res.success) {
        setData(res.data);
        
        // Setup initial dropdown states
        const depts = res.data.departments;
        const sems = res.data.semesters;
        
        if (depts.length > 0) {
          setClassForm(prev => ({ ...prev, departmentId: depts[0].id }));
          setSubjectForm(prev => ({ ...prev, departmentId: depts[0].id }));
        }
        if (sems.length > 0) {
          setClassForm(prev => ({ ...prev, semesterId: sems[0].id }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to sync academic directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminService.addDepartment(deptForm);
      if (res.success) {
        setDeptForm({ name: '', code: '' });
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminService.addClass(classForm);
      if (res.success) {
        setClassForm(prev => ({ ...prev, name: '' }));
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminService.addSubject(subjectForm);
      if (res.success) {
        setSubjectForm(prev => ({ ...prev, name: '', code: '', credits: 3 }));
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSemesterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminService.addSemester(semesterForm);
      if (res.success) {
        setSemesterForm({ name: '', academicYear: '', status: 'inactive' });
        fetchData();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'departments', label: 'DEPARTMENTS', icon: School },
    { id: 'classes', label: 'CLASSES', icon: Layers },
    { id: 'subjects', label: 'SUBJECTS', icon: BookOpen },
    { id: 'semesters', label: 'SEMESTERS', icon: Calendar }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING CONFIG MODULES...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-cyber-border/20 pb-4">
        <h1 className="text-xl font-bold tracking-wider text-white uppercase">ACADEMICS SETTINGS</h1>
        <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
          Configure departments, class sections, subjects, and semesters
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyber-border/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); }}
              className={`
                flex items-center gap-2 px-5 py-3.5 text-xs font-cyber tracking-widest border-b-2 transition-all duration-300 cursor-pointer
                ${activeTab === tab.id 
                  ? 'border-cyber-primary text-cyber-primary font-bold shadow-sm' 
                  : 'border-transparent text-cyber-muted hover:text-cyber-text'
                }
              `}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger">
          Error: {error}
        </div>
      )}

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Form: Add entity */}
        <div className="glass-panel p-6 border-cyber-primary/20">
          <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-primary mb-6 uppercase">
            ADD NEW ENTRY
          </h3>

          {activeTab === 'departments' && (
            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">DEPARTMENT CODE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, ECE"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">DEPARTMENT FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-cyber-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer">
                <Plus size={14} />
                <span>CONFIRM ADD</span>
              </button>
            </form>
          )}

          {activeTab === 'classes' && (
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">CLASS SECTION NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-A, ECE-B"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">DEPARTMENT CELL</label>
                <select
                  required
                  value={classForm.departmentId}
                  onChange={(e) => setClassForm({ ...classForm, departmentId: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                >
                  {data.departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">SEMESTER CELL</label>
                <select
                  required
                  value={classForm.semesterId}
                  onChange={(e) => setClassForm({ ...classForm, semesterId: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                >
                  {data.semesters.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="btn-cyber-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer">
                <Plus size={14} />
                <span>CONFIRM ADD</span>
              </button>
            </form>
          )}

          {activeTab === 'subjects' && (
            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">SUBJECT CODE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE201"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">SUBJECT NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">DEPARTMENT CELL</label>
                <select
                  required
                  value={subjectForm.departmentId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                >
                  {data.departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">CREDIT WEIGHT (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={subjectForm.credits}
                  onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-cyber-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer">
                <Plus size={14} />
                <span>CONFIRM ADD</span>
              </button>
            </form>
          )}

          {activeTab === 'semesters' && (
            <form onSubmit={handleSemesterSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">SEMESTER NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Semester 1, Semester 2"
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">ACADEMIC YEAR</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2025-2026"
                  value={semesterForm.academicYear}
                  onChange={(e) => setSemesterForm({ ...semesterForm, academicYear: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                />
              </div>
              <div>
                <label className="text-[9px] font-cyber text-cyber-primary block mb-1">INITIAL STATUS</label>
                <select
                  value={semesterForm.status}
                  onChange={(e) => setSemesterForm({ ...semesterForm, status: e.target.value })}
                  className="cyber-input text-xs font-cyber"
                >
                  <option value="inactive">INACTIVE (STANDBY)</option>
                  <option value="active">ACTIVE (CURRENT)</option>
                </select>
              </div>
              <button type="submit" disabled={submitting} className="btn-cyber-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer">
                <Plus size={14} />
                <span>CONFIRM ADD</span>
              </button>
            </form>
          )}
        </div>

        {/* Right List: Display registry list */}
        <div className="glass-panel p-6 lg:col-span-2 overflow-hidden">
          <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-muted mb-6 uppercase">
            REGISTRY LIST
          </h3>

          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
            {activeTab === 'departments' && (
              <div className="space-y-3">
                {data.departments.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-cyber-border/10 bg-slate-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-cyber text-cyber-primary font-bold tracking-wider px-2 py-0.5 rounded bg-cyber-primary/5 border border-cyber-primary/25 mr-3">
                        {d.code}
                      </span>
                      <span className="text-xs font-cyber text-white font-bold">{d.name}</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyber-muted">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'classes' && (
              <div className="space-y-3">
                {data.classes.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-cyber-border/10 bg-slate-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-cyber text-white font-bold mr-3">{c.name}</span>
                      <span className="text-[10px] font-cyber text-cyber-muted uppercase font-semibold">{c.department_name}</span>
                    </div>
                    <span className="text-[9px] font-cyber text-cyber-primary font-bold px-2 py-0.5 rounded bg-cyber-primary/5 border border-cyber-primary/20">
                      {c.semester_name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="space-y-3">
                {data.subjects.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-cyber-border/10 bg-slate-900/40 flex justify-between items-center">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-cyber text-white font-bold">{s.name}</span>
                        <span className="text-[9px] text-cyber-secondary font-mono">{s.code}</span>
                      </div>
                      <span className="text-[9px] font-cyber text-cyber-muted uppercase mt-0.5">{s.department_name}</span>
                    </div>
                    <span className="text-[10px] font-cyber font-bold text-cyber-warning px-2.5 py-0.5 rounded border border-cyber-warning/20 bg-cyber-warning/5">
                      {s.credits} CREDITS
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'semesters' && (
              <div className="space-y-3">
                {data.semesters.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-cyber-border/10 bg-slate-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-cyber text-white font-bold mr-2">{s.name}</span>
                      <span className="text-[10px] font-mono text-cyber-muted">({s.academic_year})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-cyber font-bold border ${
                      s.status === 'active'
                        ? 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                        : 'border-cyber-muted/30 bg-slate-900 text-cyber-muted'
                    }`}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAcademics;
