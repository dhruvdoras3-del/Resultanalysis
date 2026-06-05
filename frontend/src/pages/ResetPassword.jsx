import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/api.js';
import { KeyRound, ArrowLeft, ShieldCheck, Loader } from 'lucide-react';
import confetti from 'canvas-confetti';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please populate both password inputs.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Ciphers do not match.');
      return;
    }
    if (!token) {
      setError('Security token is missing. Please re-request recovery.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.resetPassword(password, token);
      if (res.success) {
        setSuccess(true);
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 }
        });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Cipher update sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative px-4 bg-cyber-bg cyber-grid-bg">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyber-primary/5 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-cyber-secondary/5 blur-[100px] animate-pulse"></div>

      <div className="w-full max-w-md">
        <div className="glass-panel p-8 border-cyber-primary/20 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-primary to-transparent"></div>

          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center gap-1 text-[10px] font-cyber text-cyber-muted hover:text-cyber-primary transition-colors uppercase">
              <ArrowLeft size={12} />
              <span>Cancel Protocol</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-xl bg-cyber-primary/5 border border-cyber-primary/30 shadow-glow-cyan mb-3">
              <KeyRound className="text-cyber-primary animate-float" size={24} />
            </div>
            <h1 className="text-lg font-cyber font-bold tracking-widest bg-gradient-to-r from-white via-cyber-primary to-cyber-secondary bg-clip-text text-transparent uppercase">
              DECRYPT RESET PORTAL
            </h1>
            <p className="text-[10px] text-cyber-muted tracking-widest font-mono mt-1">
              ESTABLISH NEW SECURITY PASSPHRASE
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger">
              {error}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-cyber text-cyber-primary tracking-widest block mb-1.5 uppercase">
                  New Passphrase Cipher
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cyber-input text-xs font-cyber"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-[10px] font-cyber text-cyber-primary tracking-widest block mb-1.5 uppercase">
                  Confirm Cipher Match
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cyber-input text-xs font-cyber"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-cyber-primary w-full py-3 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>UPDATING VAULT SYSTEM...</span>
                  </>
                ) : (
                  <span>CONFIRM NEW CIPHER</span>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full border border-cyber-success/40 bg-cyber-success/15 flex items-center justify-center mx-auto shadow-glow-emerald animate-pulse">
                <ShieldCheck className="text-cyber-success" size={24} />
              </div>
              <h3 className="font-cyber font-bold text-cyber-success text-sm tracking-wider uppercase">CIPHER SYNC SUCCESSFUL</h3>
              <p className="text-[11px] text-cyber-muted leading-relaxed">
                Your credentials have been securely updated in the database. Redirecting to access terminal...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
