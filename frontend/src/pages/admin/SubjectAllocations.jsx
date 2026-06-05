import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api.js';
import { BookOpen, User, Layers, Plus, Trash2, X, AlertCircle, Loader } from 'lucide-react';

const SubjectAllocations = () => {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [academics, setAcademics] = useState({ subjects: [], classes: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    facultyId: '',
    classId: '',
    subjectId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const assignRes = await adminService.getAssignments();
      if (assignRes.success) setAssignments(assignRes.data);

      const facRes = await adminService.getFaculty();
      if (facRes.success) setFaculty(facRes.data);

      const acadRes = await adminService.getAcademics();
      if (acadRes.success) {
        setAcademics(acadRes.data);
        
        // Setup initial form select states
        if (facRes.data.length > 0 && acadRes.data.classes.length > 0 && acadRes.data.subjects.length > 0) {
          setFormData({
            facultyId: facRes.data[0].id,
            classId: acadRes.data.classes[0].id,
            subjectId: acadRes.data.subjects[0].id
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to sync allocation registries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await adminService.assignSubjectFaculty(formData);
      if (res.success) {
        setSuccess('ALLOCATION MAP CREATED successfully!');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Allocation request rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, subject, faculty, cls) => {
    if (window.confirm(`Revoke allocation: Prof ${faculty} teaching ${subject} in ${cls}?`)) {
      try {
        const res = await adminService.deleteAssignment(id);
        if (res.success) {
          fetchData();
        }
      } catch (err) {
        setError(err.message || 'Revocation sequence failed.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING MAPPING MODULES...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b border-cyber-border/20 pb-4">
        <h1 className="text-xl font-bold tracking-wider text-white uppercase">FACULTY ALLOCATIONS</h1>
        <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
          Map academic subject workloads to faculty instructional cells
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger">
          Error: {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg border border-cyber-success/30 bg-cyber-success/10 text-xs text-cyber-success">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Form: Map assignment */}
        <div className="glass-panel p-6 border-cyber-primary/20">
          <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-primary mb-6 uppercase">
            ESTABLISH COURSE ALLOCATION
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[9px] font-cyber text-cyber-primary block mb-1">SELECT FACULTY WORKER</label>
              <div className="relative">
                <select
                  name="facultyId"
                  required
                  value={formData.facultyId}
                  onChange={handleInputChange}
                  className="cyber-input text-xs font-cyber"
                >
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.username} ({f.designation})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-cyber text-cyber-primary block mb-1">SELECT CLASS SECTION</label>
              <select
                name="classId"
                required
                value={formData.classId}
                onChange={handleInputChange}
                className="cyber-input text-xs font-cyber"
              >
                {academics.classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-cyber text-cyber-primary block mb-1">SELECT SUBJECT MODULE</label>
              <select
                name="subjectId"
                required
                value={formData.subjectId}
                onChange={handleInputChange}
                className="cyber-input text-xs font-cyber"
              >
                {academics.subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={submitting} className="btn-cyber-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer">
              {submitting ? (
                <>
                  <Loader size={12} className="animate-spin" />
                  <span>MAPPING PROTOCOL...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>CONFIRM WORKLOAD</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right List: Display registry list */}
        <div className="glass-panel p-6 lg:col-span-2 overflow-hidden">
          <h3 className="text-xs font-cyber font-bold tracking-wider text-cyber-muted mb-6 uppercase">
            CURRENT ALLOCATIONS DIRECTORY
          </h3>

          <div className="max-h-[55vh] overflow-y-auto custom-scrollbar">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-cyber-muted font-cyber text-xs uppercase tracking-wider">
                No course workload allocations recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-cyber-border/10 bg-slate-900/40 flex justify-between items-center hover:border-cyber-primary/30 transition-all duration-300">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-cyber text-white font-bold capitalize">
                          Prof. {item.faculty_name}
                        </span>
                        <span className="text-[9px] font-cyber font-semibold px-2 py-0.5 rounded bg-cyber-secondary/5 border border-cyber-secondary/20 text-cyber-secondary">
                          {item.class_name}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyber-muted font-sans flex items-center gap-1">
                        <BookOpen size={10} className="text-cyber-primary" />
                        <span>{item.subject_name} ({item.subject_code})</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(item.id, item.subject_name, item.faculty_name, item.class_name)}
                      className="p-1.5 rounded border border-cyber-danger/20 hover:border-cyber-danger text-cyber-danger hover:bg-cyber-danger/10 transition-all cursor-pointer"
                      title="Revoke Mapping"
                    >
                      <Trash2 size={12} />
                    </button>
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

export default SubjectAllocations;
