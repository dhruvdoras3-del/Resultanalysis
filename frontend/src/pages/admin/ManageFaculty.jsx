import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api.js';
import { 
  Users, Search, Plus, Edit, Trash2, X, AlertTriangle, 
  User, Mail, Phone, School, Briefcase, Loader
} from 'lucide-react';

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [academics, setAcademics] = useState({ departments: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    departmentId: '',
    designation: '',
    phone: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const acadRes = await adminService.getAcademics();
      if (acadRes.success) {
        setAcademics(acadRes.data);
      }
      
      const params = {
        departmentId: selectedDept,
        search: searchQuery
      };
      const facRes = await adminService.getFaculty(params);
      if (facRes.success) {
        setFaculty(facRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load faculty registries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      departmentId: academics.departments[0]?.id || '',
      designation: 'Assistant Professor',
      phone: ''
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (fac) => {
    setModalMode('edit');
    setEditingId(fac.id);
    setFormData({
      username: fac.username,
      email: fac.email,
      password: '',
      departmentId: fac.department_id || '',
      designation: fac.designation || 'Assistant Professor',
      phone: fac.phone || '',
      status: fac.status
    });
    setError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (modalMode === 'add') {
        const res = await adminService.addFaculty(formData);
        if (res.success) {
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await adminService.updateFaculty(editingId, formData);
        if (res.success) {
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete Faculty: ${name}? All course mappings and marks created by them will have reference reset.`)) {
      try {
        const res = await adminService.deleteFaculty(id);
        if (res.success) {
          fetchData();
        }
      } catch (err) {
        alert(err.message || 'Delete operation failed.');
      }
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-cyber-border/20 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">FACULTY DIRECTORY</h1>
          <p className="text-[10px] text-cyber-muted tracking-widest font-mono uppercase mt-1">
            Browse, manage, or assign faculty instructor nodes
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-cyber-primary flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus size={14} />
          <span>ADD FACULTY NODE</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center border-cyber-border/10">
        <div>
          {/* Department filter */}
          <select 
            value={selectedDept} 
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-cyber-border/30 rounded-lg px-3 py-2 text-xs font-cyber text-cyber-text"
          >
            <option value="">ALL DEPARTMENTS</option>
            {academics.departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full md:w-80 flex items-center">
          <input
            type="text"
            placeholder="Search name, designation, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-input pr-10 text-xs font-cyber"
          />
          <button type="submit" className="absolute right-3 text-cyber-primary cursor-pointer">
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Table List */}
      <div className="glass-panel overflow-hidden border-cyber-border/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 border-3 border-cyber-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[9px] font-cyber text-cyber-muted tracking-widest uppercase">SYNCING FACULTY CELLS...</span>
          </div>
        ) : faculty.length === 0 ? (
          <div className="p-12 text-center text-cyber-muted font-cyber text-xs uppercase tracking-wider">
            No active faculty records matched filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyber-border/15 bg-slate-900/30">
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">INSTRUCTOR IDENTIFIER</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">DEPARTMENT</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">DESIGNATION</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">PHONE</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase">STATUS</th>
                  <th className="p-4 text-[9px] font-cyber text-cyber-primary tracking-wider uppercase text-right">CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {faculty.map((fac) => (
                  <tr key={fac.id} className="border-b border-cyber-border/5 hover:bg-slate-900/20 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-cyber font-bold capitalize text-cyber-text">{fac.username}</span>
                        <span className="text-[10px] text-cyber-muted font-mono">{fac.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-cyber text-white font-semibold">
                      {fac.department_name || 'UNALLOCATED'}
                    </td>
                    <td className="p-4 text-xs font-cyber text-cyber-muted">
                      {fac.designation}
                    </td>
                    <td className="p-4 text-xs font-mono text-cyber-text">
                      {fac.phone || 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-cyber font-bold border ${
                        fac.status === 'active'
                          ? 'border-cyber-success/30 bg-cyber-success/5 text-cyber-success'
                          : 'border-cyber-danger/30 bg-cyber-danger/5 text-cyber-danger'
                      }`}>
                        {fac.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => openEditModal(fac)}
                        className="p-1.5 rounded border border-cyber-primary/20 hover:border-cyber-primary text-cyber-primary hover:bg-cyber-primary/10 transition-all cursor-pointer"
                        title="Edit config"
                      >
                        <Edit size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(fac.id, fac.username)}
                        className="p-1.5 rounded border border-cyber-danger/20 hover:border-cyber-danger text-cyber-danger hover:bg-cyber-danger/10 transition-all cursor-pointer"
                        title="Purge node"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* sliding modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-panel w-full max-w-lg border-cyber-secondary/30 relative">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-cyber-border/15">
              <div className="flex items-center gap-2">
                <Users className="text-cyber-secondary" size={18} />
                <h2 className="text-xs font-cyber font-bold tracking-wider uppercase">
                  {modalMode === 'add' ? 'INITIALIZE FACULTY NODE' : 'UPDATE FACULTY CONFIG'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-cyber-muted hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {/* Error banner inside modal */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger flex items-center gap-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {modalMode === 'add' && (
                  <div>
                    <label className="text-[9px] font-cyber text-cyber-secondary tracking-widest block mb-1 uppercase">USERNAME IDENTIFIER</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-cyber-muted" size={14} />
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="prof_smith"
                        className="cyber-input pl-9 text-xs font-cyber"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-cyber text-cyber-secondary tracking-widest block mb-1 uppercase">EMAIL IDENTIFIER</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-cyber-muted" size={14} />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="smith@university.edu"
                      className="cyber-input pl-9 text-xs font-cyber"
                    />
                  </div>
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="text-[9px] font-cyber text-cyber-secondary tracking-widest block mb-1 uppercase">SEED PASSWORD</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="faculty123 (Default)"
                      className="cyber-input text-xs font-cyber"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-cyber text-cyber-secondary tracking-widest block mb-1 uppercase">DEPARTMENT DEPT</label>
                  <div className="relative">
                    <School className="absolute left-3 top-3 text-cyber-muted" size={14} />
                    <select
                      name="departmentId"
                      required
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className="cyber-input pl-9 text-xs font-cyber"
                    >
                      <option value="">SELECT DEPT</option>
                      {academics.departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-cyber text-cyber-secondary tracking-widest block mb-1 uppercase">DESIGNATION</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-cyber-muted" size={14} />
                    <input
                      type="text"
                      name="designation"
                      required
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="Assistant Professor"
                      className="cyber-input pl-9 text-xs font-cyber"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-cyber text-cyber-secondary tracking-widest block mb-1 uppercase">PHONE NUMBER</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-cyber-muted" size={14} />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className="cyber-input pl-9 text-xs font-cyber"
                    />
                  </div>
                </div>

                {modalMode === 'edit' && (
                  <div>
                    <label className="text-[9px] font-cyber text-cyber-secondary tracking-widest block mb-1 uppercase">NODE STATE STATUS</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="cyber-input text-xs font-cyber"
                    >
                      <option value="active">ACTIVE (ONLINE)</option>
                      <option value="inactive">INACTIVE (OFFLINE)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-cyber-border/15 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-cyber-border text-cyber-muted text-xs font-cyber tracking-wider hover:text-white cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-cyber-secondary px-6 py-2.5 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader size={12} className="animate-spin" />
                      <span>PROCESSING...</span>
                    </>
                  ) : (
                    <span>CONFIRM CONFIG</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFaculty;
