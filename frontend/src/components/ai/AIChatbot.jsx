import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../../services/api.js';
import { Send, Sparkles, MessageSquareCode, Bot, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Greetings. I am your Neural Academic Advisor. I analyze your exam grades, class attendance, and subject credits to forecast outcomes and suggest study plans. How may I assist your academic journey today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Suggestions for student quick queries
  const suggestions = [
    "Analyze my grades",
    "How is my attendance?",
    "Give me a study plan",
    "What careers suit me?"
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await aiService.sendMessage(messageText);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.message || "Apologies, my neural nodes are currently recalculating. Please try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Error connecting to advisor nodes: ${error.message}. Ensure backend is running.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col justify-between">
      {/* Bot Header Card */}
      <div className="glass-panel p-4 mb-4 flex items-center justify-between border-cyber-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 border border-cyber-primary/50 flex items-center justify-center shadow-glow-cyan animate-pulse">
            <Bot size={22} className="text-cyber-primary" />
          </div>
          <div>
            <h1 className="text-sm font-cyber font-bold tracking-wider text-neon-cyan">NEURAL ACADEMIC ADVISOR</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyber-success animate-ping"></span>
              <span className="text-[10px] text-cyber-muted font-mono tracking-widest">COGNITIVE HUB ONLINE</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-secondary/20 bg-cyber-secondary/5">
          <Sparkles size={12} className="text-cyber-secondary animate-float" />
          <span className="text-[9px] text-cyber-secondary font-cyber font-bold tracking-widest">EXPERT MODE</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 glass-panel p-6 overflow-y-auto mb-4 space-y-4 max-h-[70vh] custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                msg.sender === 'user'
                  ? 'bg-cyber-primary/10 border-cyber-primary/30 text-cyber-primary shadow-glow-cyan'
                  : 'bg-cyber-secondary/10 border-cyber-secondary/30 text-cyber-secondary shadow-glow-purple'
              }`}>
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              
              <div className="max-w-[75%]">
                <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-l from-cyber-primary/20 to-cyber-bg border border-cyber-primary/30 rounded-tr-none text-cyber-text'
                    : 'bg-gradient-to-r from-cyber-secondary/10 to-slate-900/80 border border-cyber-border/20 rounded-tl-none text-cyber-text/90'
                }`}>
                  {msg.text}
                </div>
                <span className={`text-[9px] text-cyber-muted font-mono mt-1 block ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary shadow-glow-purple flex items-center justify-center animate-bounce">
              <Bot size={14} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-900/60 border border-cyber-border/10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-cyber-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-cyber-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && !loading && (
        <div className="mb-4">
          <p className="text-[10px] text-cyber-muted font-cyber mb-2 tracking-widest">QUICK SCAN OPTIONS:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-lg border border-cyber-border hover:border-cyber-primary bg-slate-900/50 text-[10px] text-cyber-muted hover:text-cyber-primary transition-all duration-300 font-cyber shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>{s}</span>
                <ArrowRight size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pose a query to the Neural Core (e.g. 'Analyze my grades')..."
          className="cyber-input pr-12 text-xs font-cyber"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`absolute right-2 p-2 rounded-lg transition-all duration-300 ${
            input.trim() && !loading
              ? 'bg-cyber-primary/20 hover:bg-cyber-primary text-cyber-primary hover:text-cyber-bg border border-cyber-primary/40 shadow-glow-cyan cursor-pointer'
              : 'text-cyber-muted/30 border border-transparent'
          }`}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
