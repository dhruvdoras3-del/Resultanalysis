import React, { useState, useEffect } from 'react';
import { adminService, facultyService } from '../../services/api.js';
import { 
  FileSpreadsheet, Upload, CheckCircle, AlertCircle, 
  HelpCircle, ChevronRight, Info, Layers, BookOpen, Loader 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const ImportData = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [file, setFile] = useState(null);
  const [academics, setAcademics] = useState({ classes: [], subjects: [] });
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const fetchAcademics = async () => {
    try {
      const res = await adminService.getAcademics();
      if (res.success) {
        setAcademics(res.data);
        if (res.data.classes.length > 0 && res.data.subjects.length > 0) {
          setSelectedClass(res.data.classes[0].id);
          setSelectedSubject(res.data.subjects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to sync dropdown directories:', err.message);
    }
  };

  useEffect(() => {
    fetchAcademics();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please drag or browse a spreadsheet file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      if (activeTab === 'students') {
        const res = await adminService.importStudents(formData);
        if (res.success) {
          setResult({
            success: true,
            message: res.message,
            errors: res.errors || []
          });
          confetti({ particleCount: 60, spread: 50 });
        }
      } else {
        // Marks import
        if (!selectedClass || !selectedSubject) {
          throw new Error('Class and Subject selections are mandatory for marks mapping.');
        }
        const res = await facultyService.uploadMarksExcel(selectedClass, selectedSubject, file);
        if (res.success) {
          setResult({
            success: true,
            message: res.message,
            errors: res.errors || []
          });
          confetti({ particleCount: 60, spread: 50 });
        }
      }
      setFile(null);
    } catch (err) {
      setError(err.message || 'Spreadsheet parsing sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-cyber-border/20 pb-4">
        <h1 className="text-xl font-bold tracking-wider text-white uppercase">INGEST BULK SHEETS</h1>
        <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
          Upload Excel or CSV formatted files to populate databases
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyber-border/10 mb-6">
        <button
          onClick={() => { setActiveTab('students'); setFile(null); setResult(null); setError(''); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-cyber tracking-widest border-b-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'students' ? 'border-cyber-primary text-cyber-primary font-bold' : 'border-transparent text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>STUDENT REGISTRY</span>
        </button>
        <button
          onClick={() => { setActiveTab('marks'); setFile(null); setResult(null); setError(''); }}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-cyber tracking-widest border-b-2 transition-all duration-300 cursor-pointer ${
            activeTab === 'marks' ? 'border-cyber-secondary text-cyber-secondary font-bold' : 'border-transparent text-cyber-muted hover:text-cyber-text'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>EXAM GRADES SHEET</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger flex items-center gap-2 animate-pulse">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Side: Upload zone */}
        <div className="glass-panel p-6 border-cyber-primary/20 md:col-span-2">
          <h3 className="text-xs font-cyber font-bold tracking-wider text-white mb-6 uppercase">
            {activeTab === 'students' ? 'BULK STUDENT INGESTION' : 'BULK GRADES INGESTION'}
          </h3>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* If tab is Marks, show Class & Subject selectors */}
            {activeTab === 'marks' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-cyber-border/10 bg-slate-900/40">
                <div>
                  <label className="text-[9px] font-cyber text-cyber-primary block mb-1">TARGET CLASS SECTION</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-3 text-cyber-muted" size={12} />
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="cyber-input pl-9 text-xs font-cyber"
                    >
                      {academics.classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-cyber text-cyber-primary block mb-1">TARGET SUBJECT MODULE</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 text-cyber-muted" size={12} />
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="cyber-input pl-9 text-xs font-cyber"
                    >
                      {academics.subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Drop Uploader border */}
            <div className="border-2 border-dashed border-cyber-border/30 hover:border-cyber-primary/60 rounded-xl p-8 text-center transition-all duration-300 relative bg-slate-950/20">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={36} className="text-cyber-muted mx-auto mb-3 animate-bounce" />
              {file ? (
                <div>
                  <span className="text-xs font-cyber text-cyber-success font-semibold block truncate max-w-xs mx-auto">
                    {file.name}
                  </span>
                  <span className="text-[9px] font-mono text-cyber-muted mt-1 block">
                    {(file.size / 1024).toFixed(1)} KB (Spreadsheet loaded)
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-cyber text-cyber-text font-bold block">
                    Drag spreadsheet here or click to browse
                  </span>
                  <span className="text-[9px] font-mono text-cyber-muted mt-1 block">
                    Supports Excel (.xlsx, .xls) and CSV files
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'students' ? 'btn-cyber-primary' : 'btn-cyber-secondary'
              }`}
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>PARSING SHEET ENGINES...</span>
                </>
              ) : (
                <span>DECRYPT & INGEST SHEET</span>
              )}
            </button>
          </form>

          {/* Results Summary Box */}
          {result && (
            <div className="mt-8 p-4 rounded-xl border border-cyber-border/20 bg-slate-950/45 space-y-3">
              <div className="flex items-center gap-2 text-cyber-success text-xs font-cyber font-bold">
                <CheckCircle size={16} />
                <span>{result.message}</span>
              </div>
              {result.errors.length > 0 && (
                <div className="pt-2 border-t border-cyber-border/10">
                  <span className="text-[9px] font-cyber text-cyber-danger block mb-2 uppercase font-bold">Ingestion Exceptions logs ({result.errors.length}):</span>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-[10px] text-cyber-danger font-mono bg-cyber-danger/5 p-1 rounded border border-cyber-danger/10">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Guide Info */}
        <div className="glass-panel p-5 space-y-6">
          <div className="flex items-center gap-2 border-b border-cyber-border/10 pb-2">
            <HelpCircle size={14} className="text-cyber-primary" />
            <h4 className="text-[10px] font-cyber font-bold tracking-widest text-white uppercase">INGESTION RULES</h4>
          </div>

          {activeTab === 'students' ? (
            <div className="space-y-4 text-[11px] leading-relaxed text-cyber-muted">
              <p>To batch-load student profiles, structure your sheet with the exact header columns below:</p>
              
              <div className="space-y-2 font-mono bg-slate-950/50 p-3 rounded-lg border border-cyber-border/10 text-[9px] text-cyber-primary">
                <p>username, email, rollNumber, departmentCode, className, semesterName, academicYear, phone, dob</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-1.5">
                  <ChevronRight size={12} className="text-cyber-primary mt-0.5 flex-shrink-0" />
                  <span><strong>departmentCode</strong> must match existing code (e.g. CSE, ECE).</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ChevronRight size={12} className="text-cyber-primary mt-0.5 flex-shrink-0" />
                  <span><strong>rollNumber</strong> must be unique keys.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ChevronRight size={12} className="text-cyber-primary mt-0.5 flex-shrink-0" />
                  <span>Default password set to: <strong className="text-white">student123</strong>.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-[11px] leading-relaxed text-cyber-muted">
              <p>To batch-grade course marks, structure your sheet with the exact header columns below:</p>
              
              <div className="space-y-2 font-mono bg-slate-950/50 p-3 rounded-lg border border-cyber-border/10 text-[9px] text-cyber-secondary">
                <p>rollNumber, internalMarks, externalMarks</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-1.5">
                  <ChevronRight size={12} className="text-cyber-secondary mt-0.5 flex-shrink-0" />
                  <span><strong>rollNumber</strong> must exist in registry.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ChevronRight size={12} className="text-cyber-secondary mt-0.5 flex-shrink-0" />
                  <span><strong>internalMarks</strong>: max 40 weight.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ChevronRight size={12} className="text-cyber-secondary mt-0.5 flex-shrink-0" />
                  <span><strong>externalMarks</strong>: max 60 weight.</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg border border-cyber-warning/20 bg-cyber-warning/5 flex gap-2">
            <Info size={14} className="text-cyber-warning flex-shrink-0" />
            <p className="text-[10px] leading-relaxed text-cyber-warning/80">
              Note: Database indices check roll codes and username constraints dynamically. Duplicate records cause failure warning logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
