import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api.js';
import { Mail, ArrowLeft, ShieldAlert, Sparkles, Loader } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email identifier.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setMessage('AUTHENTICATION SYNC COMPLETE: Reset key generated.');
        setToken(res.token); // Store token for seamless simulator routing
      }
    } catch (err) {
      setError(err.message || 'Decryption sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative px-4 bg-cyber-bg cyber-grid-bg">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyber-primary/5 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-cyber-secondary/5 blur-[100px] animate-pulse"></div>

      <div className="w-full max-w-md">
        <div className="glass-panel p-8 border-cyber-secondary/20 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-secondary to-transparent"></div>

          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center gap-1 text-[10px] font-cyber text-cyber-muted hover:text-cyber-primary transition-colors uppercase">
              <ArrowLeft size={12} />
              <span>Back to Login</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-xl bg-cyber-secondary/5 border border-cyber-secondary/30 shadow-glow-purple mb-3">
              <ShieldAlert className="text-cyber-secondary animate-float" size={24} />
            </div>
            <h1 className="text-lg font-cyber font-bold tracking-widest bg-gradient-to-r from-white via-cyber-secondary to-cyber-accent bg-clip-text text-transparent uppercase">
              CIPHER RECOVERY
            </h1>
            <p className="text-[10px] text-cyber-muted tracking-widest font-mono mt-1">
              REQUEST CRYPTOGRAPHIC PASSPHRASE RESET
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger">
              {error}
            </div>
          )}

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-cyber text-cyber-primary tracking-widest block mb-1.5 uppercase">
                  Registered Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-cyber-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@university.edu"
                    className="cyber-input pl-10 text-xs font-cyber"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-cyber-secondary w-full py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>GENERATING PROTOCOL...</span>
                  </>
                ) : (
                  <span>GENERATE RESET KEY</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-xl border border-cyber-success/30 bg-cyber-success/10 text-xs text-cyber-success leading-relaxed">
                <p className="font-cyber font-bold mb-2">🔑 PROTOCOL KEY GRANTED</p>
                <p>A recovery token has been compiled. In production, this token would be sent to your inbox. For this demo, you can proceed directly below:</p>
              </div>

              <button
                onClick={() => navigate(`/reset-password?token=${token}`)}
                className="btn-cyber-primary w-full py-3 flex items-center justify-center gap-2 cursor-pointer animate-pulse-glow"
              >
                <Sparkles size={14} />
                <span>DECIPHER RESET PORTAL</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
