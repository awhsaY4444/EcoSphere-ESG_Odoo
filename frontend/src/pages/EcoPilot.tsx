import { useState } from 'react';
import api from '../api';
import { toast } from '../utils/toast';

interface Message {
  id: string;
  sender: 'user' | 'pilot';
  text?: string;
  data?: {
    answer: string;
    evidence: string;
    metric: string;
    explanation: string;
    recommended_action: string;
  };
}

export default function EcoPilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'pilot',
      text: "Hello! I am EcoPilot, your explainable ESG intelligence assistant. I can query live database records to explain scores, emission drivers, and risks. Ask me a question below or use one of the quick analysis templates."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "Why did our ESG score decrease?",
    "Which department needs attention?",
    "Which environmental goal may fail?",
    "What drives our carbon emissions?"
  ];

  const handleSend = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.post('/environmental/ecopilot', { query: queryText });
      const pilotMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'pilot',
        data: response.data
      };
      setMessages(prev => [...prev, pilotMsg]);
    } catch (err) {
      toast("EcoPilot is currently offline. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 h-[calc(100vh-140px)] flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title */}
      <div className="shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 mb-2">
          🧭 EcoPilot — Explainable ESG Assistant
        </h1>
        <p className="text-gray-400">
          Ask questions and receive evidence-based explanations grounded directly in your operational databases.
        </p>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Templates Sidebar */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-white/5 bg-white/5 space-y-4 flex flex-col justify-start">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Analysis Templates</h3>
          <div className="space-y-2.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 rounded-xl p-3.5 text-xs text-gray-300 font-semibold leading-relaxed transition-all cursor-pointer hover:scale-[1.01]"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="pt-6 border-t border-white/5 text-[10px] text-gray-500 font-semibold uppercase tracking-wider space-y-2">
            <p>🛡️ Zero Hallucinations</p>
            <p className="normal-case leading-relaxed font-normal">All replies are deterministically derived from SQLite schemas. No fabricated metrics.</p>
          </div>
        </div>

        {/* Chat Bubbles Feed */}
        <div className="lg:col-span-3 glass-panel rounded-2xl border border-white/5 bg-white/5 flex flex-col overflow-hidden relative">
          
          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'user' ? (
                  /* User Bubble */
                  <div className="bg-[#1c1c1e] border border-white/10 text-white rounded-2xl px-5 py-3 text-sm max-w-[80%] font-medium">
                    {m.text}
                  </div>
                ) : (
                  /* Assistant Bubble */
                  <div className="space-y-4 max-w-[90%]">
                    {m.text && (
                      <div className="bg-white/5 border border-white/5 text-gray-200 rounded-2xl px-5 py-4 text-sm font-medium leading-relaxed">
                        {m.text}
                      </div>
                    )}
                    
                    {m.data && (
                      <div className="glass-panel border border-orange-500/20 bg-orange-500/[0.02] rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                        {/* Direct Answer Header */}
                        <div className="p-5 border-b border-white/5 bg-gradient-to-r from-orange-500/10 to-transparent">
                          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <span>🧭</span> EcoPilot Analysis Result
                          </h4>
                          <p className="text-sm font-extrabold text-white leading-relaxed">
                            {m.data.answer}
                          </p>
                        </div>

                        {/* Analysis Grid */}
                        <div className="p-5 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Metrics & Evidence</span>
                              <p className="text-xs text-gray-300 font-semibold mt-1 bg-black/40 p-2.5 rounded-lg border border-white/5">
                                {m.data.evidence}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Evidence Source Record</span>
                              <p className="text-xs text-orange-200 font-mono mt-1 bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/10">
                                {m.data.metric}
                              </p>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Diagnostic Reasoning</span>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">
                              {m.data.explanation}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-start gap-3">
                            <span className="text-base mt-0.5">✅</span>
                            <div>
                              <span className="text-[10px] text-green-400 uppercase font-bold tracking-wider">Recommended Intervention</span>
                              <p className="text-xs text-gray-200 font-semibold mt-0.5">
                                {m.data.recommended_action}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 text-gray-400 rounded-2xl px-5 py-3.5 text-xs font-semibold animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                  EcoPilot is auditing active ledger databases...
                </div>
              </div>
            )}
          </div>

          {/* Typing Input */}
          <div className="p-4 border-t border-white/5 bg-black/20 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                placeholder="Ask about emissions, scores, goals at risk, or attention targets..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-gray-600"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl px-6 text-sm transition-all disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
