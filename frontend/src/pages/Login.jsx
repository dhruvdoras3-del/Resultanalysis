import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { KeyRound, User, Sparkles, AlertCircle, Loader } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please populate both authentication credentials.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const user = await login(username, password);
      
      // Fire success confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#38bdf8', '#a855f7', '#10b981']
      });

      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'faculty') navigate('/faculty');
        else if (user.role === 'student') navigate('/student');
      }, 600);
      
    } catch (err) {
      setError(err.message || 'Authentication sequence failed.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative px-4 overflow-hidden bg-cyber-bg cyber-grid-bg">
      {/* Interactive Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-cyber-primary/10 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyber-secondary/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 border-cyber-primary/25 relative overflow-hidden">
          {/* Top Decorative Cyan Line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-primary to-transparent"></div>

          {/* Logo Title */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-xl bg-cyber-primary/5 border border-cyber-primary/30 shadow-glow-cyan mb-3">
              <Sparkles className="text-cyber-primary animate-float" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-widest bg-gradient-to-r from-white via-cyber-primary to-cyber-secondary bg-clip-text text-transparent uppercase">
              NEXUS CORE LOGIN
            </h1>
            <p className="text-[10px] text-cyber-muted tracking-widest font-mono mt-1">
              AUTHORIZE SECURE SEED ACCESS
            </p>
          </div>

          {/* Error Message banner */}
          {error && (
            <div className="mb-6 p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-xs text-cyber-danger flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-cyber text-cyber-primary tracking-widest block mb-1.5 uppercase">
                Username Identifier
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-cyber-muted">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, student1, faculty1"
                  className="cyber-input pl-10 text-xs font-cyber"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-cyber text-cyber-primary tracking-widest block uppercase">
                  Cipher Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-[9px] font-cyber text-cyber-secondary hover:text-cyber-primary transition-colors tracking-wider uppercase"
                >
                  Forgot Cipher?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-cyber-muted">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="cyber-input pl-10 text-xs font-cyber"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary w-full py-3 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>DECRYPTING PROFILE...</span>
                </>
              ) : (
                <span>INITIATE ACCESS</span>
              )}
            </button>
          </form>

          {/* System Hint Footer */}
          <div className="mt-8 pt-4 border-t border-cyber-border/10 text-center">
            <span className="text-[9px] text-cyber-muted font-mono tracking-widest">
              SECURE SEED: SHA256 ENCRYPTED JWT SESSION
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
