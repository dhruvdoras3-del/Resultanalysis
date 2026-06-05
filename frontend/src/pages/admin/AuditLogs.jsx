import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api.js';
import { Terminal, Shield, Search, RefreshCw, AlertOctagon } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAuditLogs();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync audit daemon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const search = searchQuery.toLowerCase();
    return (
      (log.username?.toLowerCase() || '').includes(search) ||
      (log.action?.toLowerCase() || '').includes(search) ||
      (log.details?.toLowerCase() || '').includes(search) ||
      (log.role?.toLowerCase() || '').includes(search)
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-cyber-border/20 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">SECURITY AUDIT DAEMON</h1>
          <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
            Browse and monitor college operation histories
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2 rounded-lg border border-cyber-border/40 hover:border-cyber-primary bg-slate-900/60 text-cyber-primary cursor-pointer transition-all duration-300"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex gap-4 justify-between items-center border-cyber-border/10">
        <div className="flex items-center gap-2">
          <Shield className="text-cyber-primary" size={16} />
          <span className="text-[10px] font-cyber text-cyber-muted tracking-widest uppercase">AUDIT LOGGER ACTIVE</span>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 flex items-center">
          <input
            type="text"
            placeholder="Search operator, action, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-input pr-10 text-xs font-cyber"
          />
          <span className="absolute right-3 text-cyber-muted">
            <Search size={14} />
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel overflow-hidden border-cyber-border/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 border-3 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[9px] font-cyber text-cyber-muted tracking-widest uppercase font-semibold">READING COMPASS LOGS...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-cyber-danger font-cyber text-xs uppercase tracking-wider flex items-center justify-center gap-2">
            <AlertOctagon size={16} />
            <span>{error}</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-cyber-muted font-cyber text-xs uppercase tracking-wider">
            No audit records matched search queries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyber-border/15 bg-slate-900/30">
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">TIMESTAMP LOG</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">OPERATOR</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">ROLE CELL</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">ACTION PROTOCOL</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">DETAILS DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-cyber-border/5 hover:bg-slate-900/10 transition-colors">
                    <td className="p-4 text-xs font-mono text-cyber-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-xs font-cyber font-bold text-white capitalize">
                      {log.username || 'System Daemon'}
                    </td>
                    <td className="p-4 text-xs font-cyber text-cyber-muted">
                      <span className="uppercase tracking-wider font-mono">{log.role || 'daemon'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                        log.action.includes('DELETE') || log.action.includes('TERMINATE')
                          ? 'border-cyber-danger/30 bg-cyber-danger/5 text-cyber-danger'
                          : log.action.includes('ADD') || log.action.includes('IMPORT') || log.action.includes('SAVE')
                            ? 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                            : 'border-cyber-primary/30 bg-cyber-primary/5 text-cyber-primary'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-cyber-text/80 font-sans break-words max-w-sm">
                      {log.details}
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

export default AuditLogs;
