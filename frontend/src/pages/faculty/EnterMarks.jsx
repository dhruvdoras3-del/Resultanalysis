import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { facultyService } from '../../services/api.js';
import { 
  FileText, Upload, Save, ChevronLeft, Plus, 
  HelpCircle, CheckCircle, AlertCircle, Info, Loader 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const EnterMarks = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSubjectId = searchParams.get('subjectId') || '';

  const [assignedCourses, setAssignedCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId);
  const [students, setStudents] = useState([]);
  
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' or 'upload'
  const [excelFile, setExcelFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch faculty assigned courses
  const fetchAssigned = async () => {
    try {
      const res = await facultyService.getDashboard();
      if (res.success && res.data.courses) {
        setAssignedCourses(res.data.courses);
        
        // If query parameters not set, default to first course
        if (!initialClassId && res.data.courses.length > 0) {
          setSelectedClass(res.data.courses[0].class_id);
          setSelectedSubject(res.data.courses[0].subject_id);
        }
      }
    } catch (err) {
      setError('Failed to fetch assigned workloads.');
    }
  };

  // Fetch students list for marks
  const fetchStudentsList = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await facultyService.getStudentsForMarks(selectedClass, selectedSubject);
      if (res.success) {
        // Map marks to strings for clean input manipulation
        const mapped = res.data.map(s => ({
          ...s,
          internal_marks: s.internal_marks !== null ? s.internal_marks.toString() : '',
          external_marks: s.external_marks !== null ? s.external_marks.toString() : ''
        }));
        setStudents(mapped);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync class student list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  useEffect(() => {
    fetchStudentsList();
  }, [selectedClass, selectedSubject]);

  // Realtime Grade & Status Calculator inside React
  const computeGradeStatus = (internalStr, externalStr) => {
    const internal = parseFloat(internalStr || 0);
    const external = parseFloat(externalStr || 0);
    const total = internal + external;
    
    let grade = 'F';
    let status = 'fail';
    
    if (total >= 90) { grade = 'S'; status = 'pass'; }
    else if (total >= 80) { grade = 'A'; status = 'pass'; }
    else if (total >= 70) { grade = 'B'; status = 'pass'; }
    else if (total >= 60) { grade = 'C'; status = 'pass'; }
    else if (total >= 50) { grade = 'D'; status = 'pass'; }
    else if (total >= 40) { grade = 'E'; status = 'pass'; }

    return { total: total.toFixed(1), grade, status };
  };

  // Handlers for marks input change
  const handleMarkChange = (studentId, type, value) => {
    // Validate bounds: internals max 40, externals max 60
    const valFloat = parseFloat(value);
    if (type === 'internal_marks' && valFloat > 40) return;
    if (type === 'external_marks' && valFloat > 60) return;

    setStudents(prev => 
      prev.map(s => {
        if (s.student_id === studentId) {
          const updated = { ...s, [type]: value };
          // Recalculate computed fields
          const computed = computeGradeStatus(
            type === 'internal_marks' ? value : s.internal_marks,
            type === 'external_marks' ? value : s.external_marks
          );
          return {
            ...updated,
            total_marks: computed.total,
            grade: computed.grade,
            status: computed.status
          };
        }
        return s;
      })
    );
  };

  // Save manual grid marks
  const handleGridSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const marksData = students.map(s => ({
      studentId: s.student_id,
      internalMarks: s.internal_marks ? parseFloat(s.internal_marks) : 0,
      externalMarks: s.external_marks ? parseFloat(s.external_marks) : 0
    }));

    try {
      const res = await facultyService.saveMarks(selectedClass, selectedSubject, marksData);
      if (res.success) {
        setSuccess('All student evaluation marks synced successfully!');
        confetti({ particleCount: 50, spread: 30 });
        fetchStudentsList();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit marks to database.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Excel Sheet Import
  const handleExcelUpload = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setError('Please select an Excel sheet first.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await facultyService.uploadMarksExcel(selectedClass, selectedSubject, excelFile);
      if (res.success) {
        setSuccess(res.message);
        confetti({ particleCount: 50, spread: 30 });
        setExcelFile(null);
        fetchStudentsList();
      }
    } catch (err) {
      setError(err.message || 'File upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header and Go back */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-cyber-border/20 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/faculty')}
            className="p-2 rounded-lg border border-cyber-border/30 hover:border-cyber-primary bg-slate-900/60 text-cyber-muted hover:text-cyber-primary transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white uppercase">GRADES MANAGER</h1>
            <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
              Enter test evaluations or upload grading excel sheets
            </p>
          </div>
        </div>
      </div>

      {/* Selector controls */}
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

        <div className="flex rounded-lg border border-cyber-border/30 overflow-hidden ml-auto">
          <button 
            onClick={() => setActiveTab('grid')}
            className={`px-4 py-2 text-[10px] font-cyber tracking-widest cursor-pointer transition-all ${
              activeTab === 'grid' ? 'bg-cyber-primary/10 text-cyber-primary font-bold' : 'bg-transparent text-cyber-muted'
            }`}
          >
            MANUAL ENTRY
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-[10px] font-cyber tracking-widest cursor-pointer transition-all ${
              activeTab === 'upload' ? 'bg-cyber-secondary/10 text-cyber-secondary font-bold' : 'bg-transparent text-cyber-muted'
            }`}
          >
            EXCEL LOADER
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg border border-cyber-success/30 bg-cyber-success/10 text-xs text-cyber-success flex items-center gap-2">
          <CheckCircle size={14} />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Tab */}
      {activeTab === 'grid' ? (
        <div className="glass-panel overflow-hidden border-cyber-border/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-3 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[9px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING STUDENT CELLS...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-cyber-muted font-cyber text-xs uppercase tracking-wider">
              No students found registered for this class.
            </div>
          ) : (
            <form onSubmit={handleGridSave}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-border/15 bg-slate-900/30">
                      <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">ROLL NUMBER</th>
                      <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">STUDENT IDENTIFIER</th>
                      <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">INTERNALS (MAX 40)</th>
                      <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">EXTERNALS (MAX 60)</th>
                      <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">TOTAL MARKS</th>
                      <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">GRADE</th>
                      <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => (
                      <tr key={stu.student_id} className="border-b border-cyber-border/5 hover:bg-slate-900/10 transition-colors">
                        <td className="p-4 text-xs font-mono text-white tracking-wider font-semibold">
                          {stu.roll_number}
                        </td>
                        <td className="p-4 text-xs font-cyber font-bold capitalize text-cyber-text">
                          {stu.name}
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="40"
                            step="0.5"
                            placeholder="0"
                            value={stu.internal_marks}
                            onChange={(e) => handleMarkChange(stu.student_id, 'internal_marks', e.target.value)}
                            className="w-20 bg-slate-900 border border-cyber-border/20 rounded-md px-2 py-1 text-center font-mono text-xs focus:outline-none focus:border-cyber-primary"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            step="0.5"
                            placeholder="0"
                            value={stu.external_marks}
                            onChange={(e) => handleMarkChange(stu.student_id, 'external_marks', e.target.value)}
                            className="w-20 bg-slate-900 border border-cyber-border/20 rounded-md px-2 py-1 text-center font-mono text-xs focus:outline-none focus:border-cyber-primary"
                          />
                        </td>
                        <td className="p-4 text-center text-xs font-mono font-bold text-white">
                          {stu.total_marks || '0.0'}
                        </td>
                        <td className="p-4 text-center text-xs font-cyber">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            stu.grade === 'F' 
                              ? 'border-cyber-danger/30 bg-cyber-danger/5 text-cyber-danger'
                              : 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                          }`}>
                            {stu.grade || 'F'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-cyber font-bold border uppercase ${
                            stu.status === 'pass'
                              ? 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                              : 'border-cyber-danger/30 bg-cyber-danger/5 text-cyber-danger'
                          }`}>
                            {stu.status || 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-900/30 border-t border-cyber-border/10 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-cyber-primary py-2.5 px-6 flex items-center gap-2 cursor-pointer shadow-glow-cyan"
                >
                  {submitting ? (
                    <>
                      <Loader size={12} className="animate-spin" />
                      <span>SAVING GRADES...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>SAVE MARKS SHEET</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Excel Upload Tab */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="glass-panel p-6 border-cyber-secondary/20 md:col-span-2">
            <h3 className="text-xs font-cyber font-bold tracking-wider text-white mb-6 uppercase">
              EXCEL GRADES SHEET INGESTION
            </h3>

            <form onSubmit={handleExcelUpload} className="space-y-6">
              <div className="border-2 border-dashed border-cyber-border/30 hover:border-cyber-secondary/60 rounded-xl p-8 text-center transition-all duration-300 relative bg-slate-950/20">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload size={36} className="text-cyber-muted mx-auto mb-3 animate-bounce" />
                {excelFile ? (
                  <div>
                    <span className="text-xs font-cyber text-cyber-success font-semibold block truncate max-w-xs mx-auto">
                      {excelFile.name}
                    </span>
                    <span className="text-[9px] font-mono text-cyber-muted mt-1 block">
                      {(excelFile.size / 1024).toFixed(1)} KB (Spreadsheet loaded)
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-cyber text-cyber-text font-bold block">
                      Drag Excel file here or click to browse
                    </span>
                    <span className="text-[9px] font-mono text-cyber-muted mt-1 block">
                      Supports Excel spreadsheet formats (.xlsx, .xls)
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-cyber-secondary w-full py-3 flex items-center justify-center gap-2 cursor-pointer shadow-glow-purple"
              >
                {submitting ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>PARSING SHEET ENGINES...</span>
                  </>
                ) : (
                  <span>DECRYPT & INGEST SHEET</span>
                )}
              </button>
            </form>
          </div>

          {/* Guide Card */}
          <div className="glass-panel p-5 space-y-6">
            <div className="flex items-center gap-2 border-b border-cyber-border/10 pb-2">
              <HelpCircle size={14} className="text-cyber-secondary" />
              <h4 className="text-[10px] font-cyber font-bold tracking-widest text-white uppercase">SPREADSHEET SCHEME</h4>
            </div>

            <div className="space-y-4 text-[11px] leading-relaxed text-cyber-muted">
              <p>Structure your sheet with the exact header columns below:</p>
              
              <div className="space-y-2 font-mono bg-slate-950/50 p-3 rounded-lg border border-cyber-border/10 text-[9px] text-cyber-secondary">
                <p>rollNumber, internalMarks, externalMarks</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-1.5">
                  <ChevronLeft size={12} className="rotate-180 text-cyber-secondary mt-0.5 flex-shrink-0" />
                  <span><strong>rollNumber</strong> must exist in class.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ChevronLeft size={12} className="rotate-180 text-cyber-secondary mt-0.5 flex-shrink-0" />
                  <span><strong>internalMarks</strong>: max weight 40.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ChevronLeft size={12} className="rotate-180 text-cyber-secondary mt-0.5 flex-shrink-0" />
                  <span><strong>externalMarks</strong>: max weight 60.</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-cyber-warning/20 bg-cyber-warning/5 flex gap-2">
              <Info size={14} className="text-cyber-warning flex-shrink-0" />
              <p className="text-[10px] leading-relaxed text-cyber-warning/80">
                Note: Saving or uploading marks triggers dynamic recalculations of student CGPA, GPA, weak subjects, and AI forecasts immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterMarks;
