import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { facultyService } from '../../services/api.js';
import { 
  CalendarCheck, Save, ChevronLeft, AlertCircle, CheckCircle, 
  Layers, BookOpen, Loader, Percent 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AttendanceManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';
  const initialSubjectId = searchParams.get('subjectId') || '';

  const [assignedCourses, setAssignedCourses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId);
  const [students, setStudents] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk edit states
  const [bulkTotal, setBulkTotal] = useState('60');

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

  const fetchStudentsList = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await facultyService.getStudentsForMarks(selectedClass, selectedSubject);
      if (res.success) {
        const mapped = res.data.map(s => ({
          ...s,
          total_classes: s.total_classes !== null ? s.total_classes.toString() : '60',
          attended_classes: s.attended_classes !== null ? s.attended_classes.toString() : ''
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

  const handleAttendanceChange = (studentId, type, value) => {
    setStudents(prev => 
      prev.map(s => {
        if (s.student_id === studentId) {
          const updated = { ...s, [type]: value };
          
          const total = parseInt(type === 'total_classes' ? value : s.total_classes) || 0;
          const attended = parseInt(type === 'attended_classes' ? value : s.attended_classes) || 0;
          
          // Guard: attended classes cannot exceed total classes
          if (type === 'attended_classes' && attended > total) return s;
          if (type === 'total_classes' && attended > total) {
            updated.attended_classes = value; // Sync attended to match if total drops below
          }

          const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : '0.00';
          return {
            ...updated,
            attendance_percentage: percentage
          };
        }
        return s;
      })
    );
  };

  // Bulk apply total classes to all students
  const applyBulkTotal = () => {
    const total = parseInt(bulkTotal) || 0;
    if (total <= 0) return;

    setStudents(prev => 
      prev.map(s => {
        const attended = parseInt(s.attended_classes) || 0;
        const finalAttended = attended > total ? total : attended;
        const percentage = total > 0 ? ((finalAttended / total) * 100).toFixed(2) : '0.00';
        return {
          ...s,
          total_classes: total.toString(),
          attended_classes: finalAttended.toString(),
          attendance_percentage: percentage
        };
      })
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Check if any student attended_classes is blank
    const blankCheck = students.some(s => s.attended_classes === '');
    if (blankCheck) {
      setError('Please populate attended class counts for all students.');
      setSubmitting(false);
      return;
    }

    const attendanceData = students.map(s => ({
      studentId: s.student_id,
      totalClasses: parseInt(s.total_classes) || 0,
      attendedClasses: parseInt(s.attended_classes) || 0
    }));

    try {
      const res = await facultyService.saveAttendance(selectedClass, selectedSubject, attendanceData);
      if (res.success) {
        setSuccess('Attendance logs synced successfully!');
        confetti({ particleCount: 50, spread: 30 });
        fetchStudentsList();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit attendance logs to database.');
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
            <h1 className="text-xl font-bold tracking-wider text-white uppercase">ATTENDANCE LOGS</h1>
            <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
              Enter class metrics and track student lecture ratios
            </p>
          </div>
        </div>
      </div>

      {/* Selectors and Bulk update controls */}
      <div className="glass-panel p-4 flex flex-wrap gap-4 items-end border-cyber-border/10">
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

        {/* Bulk set total */}
        <div className="flex items-end gap-2 ml-0 sm:ml-6">
          <div>
            <label className="text-[8px] font-cyber text-cyber-secondary tracking-widest block mb-1">BULK SET HELD CLASSES</label>
            <input
              type="number"
              min="1"
              value={bulkTotal}
              onChange={(e) => setBulkTotal(e.target.value)}
              className="bg-slate-900 border border-cyber-border/30 rounded-lg px-3 py-1.5 text-xs font-mono text-center text-white w-20 focus:outline-none"
            />
          </div>
          <button 
            type="button" 
            onClick={applyBulkTotal}
            className="btn-cyber-secondary py-2 px-3 text-[10px]"
          >
            APPLY ALL
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

      {/* Grid */}
      <div className="glass-panel overflow-hidden border-cyber-border/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 border-3 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[9px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING ATTENDANCE CELLS...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-cyber-muted font-cyber text-xs uppercase tracking-wider">
            No students found registered for this class.
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border/15 bg-slate-900/30">
                    <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">ROLL NUMBER</th>
                    <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">STUDENT IDENTIFIER</th>
                    <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">TOTAL CLASSES HELD</th>
                    <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">ATTENDED CLASSES</th>
                    <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">RATIO SUMMARY</th>
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
                          min="1"
                          value={stu.total_classes}
                          onChange={(e) => handleAttendanceChange(stu.student_id, 'total_classes', e.target.value)}
                          className="w-20 bg-slate-900 border border-cyber-border/20 rounded-md px-2 py-1 text-center font-mono text-xs focus:outline-none focus:border-cyber-primary"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={stu.attended_classes}
                          onChange={(e) => handleAttendanceChange(stu.student_id, 'attended_classes', e.target.value)}
                          className="w-20 bg-slate-900 border border-cyber-border/20 rounded-md px-2 py-1 text-center font-mono text-xs focus:outline-none focus:border-cyber-primary"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-cyber-border/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                parseFloat(stu.attendance_percentage) < 75 
                                  ? 'bg-cyber-danger' 
                                  : parseFloat(stu.attendance_percentage) < 85 
                                    ? 'bg-cyber-warning' 
                                    : 'bg-cyber-success'
                              }`}
                              style={{ width: `${Math.min(parseFloat(stu.attendance_percentage || 0), 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-mono font-bold w-12 text-right ${
                            parseFloat(stu.attendance_percentage) < 75 
                              ? 'text-cyber-danger' 
                              : parseFloat(stu.attendance_percentage) < 85 
                                ? 'text-cyber-warning' 
                                : 'text-cyber-success'
                          }`}>
                            {parseFloat(stu.attendance_percentage || 0).toFixed(1)}%
                          </span>
                        </div>
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
                className="btn-cyber-secondary py-2.5 px-6 flex items-center gap-2 cursor-pointer shadow-glow-purple"
              >
                {submitting ? (
                  <>
                    <Loader size={12} className="animate-spin" />
                    <span>SAVING LOGS...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>SAVE ATTENDANCE LOG</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AttendanceManager;
