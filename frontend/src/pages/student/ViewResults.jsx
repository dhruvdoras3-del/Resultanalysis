import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/api.js';
import { 
  FileText, Download, Award, ShieldCheck, 
  HelpCircle, RefreshCw, ServerOff, CheckCircle 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ViewResults = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studentService.getDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync results registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const downloadPDF = () => {
    if (!data) return;
    const { profile, results, stats } = data;

    const doc = new jsPDF();

    // Design Header Theme color (Cyber Blue tone)
    doc.setFillColor(3, 7, 18); // Dark BG
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(56, 189, 248); // Cyan
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("UNIVERSITY ACADEMIC REPORT CARD", 14, 20);

    doc.setTextColor(156, 163, 175); // Gray-400
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("NEXUS EDUCATION ANALYTICS SYSTEMS DAEMON", 14, 28);

    // Profile Details
    doc.setTextColor(31, 41, 55); // Dark text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("STUDENT INFO:", 14, 52);

    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${profile.name}`, 14, 58);
    doc.text(`Roll Number: ${profile.rollNumber}`, 14, 64);
    doc.text(`Department: ${profile.department}`, 14, 70);
    doc.text(`Semester: ${profile.semester} (${profile.class})`, 14, 76);

    doc.setFont("helvetica", "bold");
    doc.text("PERFORMANCE SUMMARY:", 120, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`Cumulative CGPA: ${stats.cgpa}`, 120, 58);
    doc.text(`Overall Attendance: ${stats.overallAttendance}%`, 120, 64);
    doc.text(`Total Credits Checked: ${stats.totalCredits}`, 120, 70);
    doc.text(`Pass Count: ${stats.passCount} / Fail Count: ${stats.failCount}`, 120, 76);

    // Results Table
    const tableHeaders = [['Code', 'Subject Module Name', 'Credits', 'Internals (40)', 'Externals (60)', 'Total (100)', 'Grade', 'Result']];
    const tableBody = results.map(r => [
      r.subject_code,
      r.subject_name,
      r.credits,
      parseFloat(r.internal_marks).toFixed(1),
      parseFloat(r.external_marks).toFixed(1),
      parseFloat(r.total_marks).toFixed(1),
      r.grade,
      r.status.toUpperCase()
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableBody,
      startY: 85,
      theme: 'grid',
      headStyles: { fillColor: [3, 7, 18], textColor: [56, 189, 248], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3.5 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        6: { fontStyle: 'bold' },
        7: { fontStyle: 'bold' }
      }
    });

    // Signature Block
    const finalY = doc.previousAutoTable.finalY + 30;
    doc.setFontSize(9);
    doc.text("_________________________", 14, finalY);
    doc.text("Controller of Examinations", 14, finalY + 6);

    doc.text("_________________________", 135, finalY);
    doc.text("Academic Registrar Stamp", 135, finalY + 6);

    // Save
    doc.save(`ReportCard_${profile.rollNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING RESULT SHEET...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-6 border-cyber-danger/30 bg-cyber-danger/5 text-center max-w-lg mx-auto mt-20">
        <ServerOff size={40} className="text-cyber-danger mx-auto mb-3 animate-bounce" />
        <h3 className="font-cyber font-bold text-cyber-danger text-sm mb-2">RESULTS SYNC OFFLINE</h3>
        <p className="text-xs text-cyber-muted mb-4">{error || 'Could not fetch marksheet.'}</p>
        <button onClick={fetchResults} className="btn-cyber-secondary px-4 py-2 text-[10px]">
          RE-ESTABLISH LINK
        </button>
      </div>
    );
  }

  const { results = [], stats, profile } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-cyber-border/20 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">ACADEMIC REPORT CARD</h1>
          <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
            Official semester results transcripts and marksheet distributions
          </p>
        </div>
        <button 
          onClick={downloadPDF}
          className="btn-cyber-primary flex items-center gap-2 cursor-pointer shadow-glow-cyan"
        >
          <Download size={14} />
          <span>DOWNLOAD OFFICIAL PDF</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 border-cyber-border/10 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-cyber text-cyber-muted tracking-widest uppercase font-bold">SEMESTER CGPA</span>
            <span className="text-2xl font-bold font-outfit text-white leading-none mt-1.5">{stats.cgpa}</span>
          </div>
          <Award className="text-cyber-primary" size={24} />
        </div>

        <div className="glass-panel p-5 border-cyber-border/10 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-cyber text-cyber-muted tracking-widest uppercase font-bold">EXAMS PASSED</span>
            <span className="text-2xl font-bold font-outfit text-cyber-success leading-none mt-1.5">
              {stats.passCount} <span className="text-xs text-cyber-muted font-cyber font-medium">/ {results.length} MODULES</span>
            </span>
          </div>
          <CheckCircle className="text-cyber-success" size={24} />
        </div>

        <div className="glass-panel p-5 border-cyber-border/10 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-cyber text-cyber-muted tracking-widest uppercase font-bold">TOTAL CREDITS MET</span>
            <span className="text-2xl font-bold font-outfit text-cyber-warning leading-none mt-1.5">{stats.totalCredits}</span>
          </div>
          <FileText className="text-cyber-warning" size={24} />
        </div>
      </div>

      {/* Results grid list */}
      <div className="glass-panel overflow-hidden border-cyber-border/10">
        <div className="p-4 bg-slate-900/30 border-b border-cyber-border/10">
          <h3 className="text-xs font-cyber font-bold tracking-wider text-white uppercase">GRADE SHEET SUMMARY</h3>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-cyber-muted font-cyber text-xs uppercase tracking-wider">
            No exams evaluations recorded for this semester.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyber-border/15 bg-slate-900/30">
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">CODE</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">SUBJECT MODULE</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">CREDITS</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">INTERNALS (40)</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">EXTERNALS (60)</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">TOTAL (100)</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">GRADE</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-center">RESULT</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-cyber-border/5 hover:bg-slate-900/10 transition-colors">
                    <td className="p-4 text-xs font-mono text-cyber-muted font-bold tracking-wider">
                      {r.subject_code}
                    </td>
                    <td className="p-4 text-xs font-cyber font-bold text-cyber-text capitalize">
                      {r.subject_name}
                    </td>
                    <td className="p-4 text-center text-xs font-mono text-white">
                      {r.credits}
                    </td>
                    <td className="p-4 text-center text-xs font-mono text-cyber-muted">
                      {parseFloat(r.internal_marks).toFixed(1)}
                    </td>
                    <td className="p-4 text-center text-xs font-mono text-cyber-muted">
                      {parseFloat(r.external_marks).toFixed(1)}
                    </td>
                    <td className="p-4 text-center text-xs font-mono font-bold text-white">
                      {parseFloat(r.total_marks).toFixed(1)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold border ${
                        r.grade === 'F'
                          ? 'border-cyber-danger/30 bg-cyber-danger/5 text-cyber-danger'
                          : 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                      }`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-cyber font-bold border uppercase tracking-wider ${
                        r.status === 'pass'
                          ? 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                          : 'border-cyber-danger/30 bg-cyber-danger/5 text-cyber-danger'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewResults;
