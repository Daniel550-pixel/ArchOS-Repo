import React, { useState } from 'react';
import { GlassPanel } from '../layout/GlassPanel';
import { Send, Volume2, Sparkles, Building2, Thermometer, Database, CheckCircle2 } from 'lucide-react';
import { askJarvis, JarvisResponse } from '../../services/ai/jarvisBrain';
import { speechService } from '../../services/voice/speechService';

export const JarvisChat: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<JarvisResponse | null>({
    answer: 'J.A.R.V.I.S. Live Ground-Truth intelligence online. Ask me about real Dubai buildings, live climate, or macro statistics.',
    toolsCalled: ['system_init'],
    latencyMs: 12
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (promptQuery?: string) => {
    const textToAsk = promptQuery || query;
    if (!textToAsk.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await askJarvis(textToAsk);
      setResponse(res);
      speechService.speak(res.answer);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassPanel
      title="J.A.R.V.I.S. — LIVE GROUND TRUTH (REAL TOOLS)"
      icon={<Sparkles size={16} />}
      badge="GROUND TRUTH VERIFIED"
      badgeColor="cyan"
      className="h-full flex flex-col justify-between font-mono-tech select-none"
    >
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 mb-3">
        {/* Quick Question Prompts */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleAsk('How many buildings in Downtown Dubai and which is tallest?')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00e5ff]/20 text-[10px] text-[#00e5ff] border border-[#00e5ff]/30 transition-all cursor-pointer"
          >
            🏢 Downtown Buildings & Tallest
          </button>
          <button
            onClick={() => handleAsk('What are the top 5 tallest buildings in Downtown?')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#d4ff00]/20 text-[10px] text-[#d4ff00] border border-[#d4ff00]/30 transition-all cursor-pointer"
          >
            ⚡ Top 5 Skyscrapers (OSM)
          </button>
          <button
            onClick={() => handleAsk('What is the live climate in Dubai right now?')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#10b981]/20 text-[10px] text-[#10b981] border border-[#10b981]/30 transition-all cursor-pointer"
          >
            ☀️ Live Climate (Open-Meteo)
          </button>
          <button
            onClick={() => handleAsk('What are the official UAE GDP and Population figures?')}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#ec4899]/20 text-[10px] text-[#ec4899] border border-[#ec4899]/30 transition-all cursor-pointer"
          >
            📊 UAE Macro Stats (World Bank)
          </button>
        </div>

        {/* Answer Box */}
        {response && (
          <div className="p-3.5 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex flex-col gap-2 relative">
            <div className="flex items-center justify-between text-[10px] border-b border-[#00e5ff]/20 pb-1.5">
              <div className="flex items-center gap-1.5 text-[#00e5ff] font-bold">
                <CheckCircle2 size={12} className="text-[#10b981]" />
                <span>TOOLS: {response.toolsCalled.join(', ').toUpperCase()}</span>
              </div>
              <span className="text-zinc-400">{response.latencyMs}ms</span>
            </div>

            <p className="text-xs text-white leading-relaxed font-sans font-medium">
              {response.answer}
            </p>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => speechService.speak(response.answer)}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[#00e5ff] border border-white/20 text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Volume2 size={12} />
                <span>SPEAK ANSWER</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Query Bar */}
      <div className="flex gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask J.A.R.V.I.S. about real Dubai buildings, weather, or macro stats..."
          className="flex-1 bg-black/60 border border-white/20 focus:border-[#00e5ff] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
        />
        <button
          onClick={() => handleAsk()}
          disabled={isLoading}
          className="px-4 py-2 bg-[#00e5ff] hover:bg-[#00c4db] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_12px_#00e5ff] transition-all cursor-pointer disabled:opacity-50"
        >
          <Send size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? 'QUERYING...' : 'ASK'}</span>
        </button>
      </div>
    </GlassPanel>
  );
};
