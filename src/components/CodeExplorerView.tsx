import React, { useState } from 'react';
import { Search, Code2, Copy, Check, Filter, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import { ALL_LANGUAGES_DATA } from '../data/languagesCodebase';
import { LanguageKey, PhaseId } from '../types';

export const CodeExplorerView: React.FC = () => {
  const [selectedLanguageId, setSelectedLanguageId] = useState<LanguageKey>('c');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Filter languages
  const filteredLanguages = ALL_LANGUAGES_DATA.filter((item) => {
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesPhase = phaseFilter === 'all' || item.phase === phaseFilter;
    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesPhase && matchesSearch;
  });

  const activeSnippet =
    ALL_LANGUAGES_DATA.find((l) => l.id === selectedLanguageId) || ALL_LANGUAGES_DATA[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
          <Code2 className="w-4 h-4" />
          <span>PRODUCTION CODEBASE & ARCHITECTURAL CONTRACTS</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          21-Language Systems Engineering Curriculum
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Inspect production-grade implementations for all 21 languages spanning low-level Ring 0 memory copy routines, mobile Kalman filters, distributed cloud ingestion workers, and big data spatial geometry engines.
        </p>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded px-2 py-1">
            <span className="text-slate-500 text-[11px]">Domain:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All 5 Domains</option>
              <option value="Systems & Kernel" className="bg-slate-900">Systems & Kernel</option>
              <option value="Mobile & Native" className="bg-slate-900">Mobile & Native</option>
              <option value="Cloud & Distributed" className="bg-slate-900">Cloud & Distributed</option>
              <option value="Analytics & Math" className="bg-slate-900">Analytics & Math</option>
              <option value="Legacy & Shell" className="bg-slate-900">Legacy & Shell</option>
            </select>
          </div>

          {/* Phase Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded px-2 py-1">
            <span className="text-slate-500 text-[11px]">Phase:</span>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All 4 Phases</option>
              <option value="phase1" className="bg-slate-900">Phase 1: Kernel Driver</option>
              <option value="phase2" className="bg-slate-900">Phase 2: Precision Overlay</option>
              <option value="phase3" className="bg-slate-900">Phase 3: AI Verification</option>
              <option value="phase4" className="bg-slate-900">Phase 4: Spatial OLAP</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search code or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Grid: Language Selector (Left 4 cols) & Code Inspector (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 21 Languages List */}
        <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-2 max-h-[750px] overflow-y-auto">
          <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-mono text-slate-500">
            <span>21 LANGUAGES ({filteredLanguages.length})</span>
            <span>PHASE / ROLE</span>
          </div>

          <div className="space-y-1">
            {filteredLanguages.map((lang) => {
              const isSelected = lang.id === selectedLanguageId;
              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguageId(lang.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{lang.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {lang.extension}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="truncate max-w-[170px]">{lang.category}</span>
                    <span className="font-mono text-cyan-400/80 uppercase">{lang.phase.toUpperCase()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer & Architecture Role */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4 shadow-2xl">
          
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">{activeSnippet.name}</span>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                  {activeSnippet.extension}
                </span>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {activeSnippet.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeSnippet.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Architectural Role Box */}
          <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-cyan-400 block mb-1">Architectural Role & Contract:</span>
            <p className="leading-relaxed text-slate-300">{activeSnippet.roleInArchitecture}</p>
          </div>

          {/* Code Body with Line Numbers */}
          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-black font-mono text-xs">
            <div className="flex justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
              <span>SOURCE IMPLEMENTATION</span>
              <span>SYNTAX VERIFIED</span>
            </div>
            <pre className="p-4 text-cyan-300 overflow-x-auto text-[11px] leading-relaxed max-h-[440px]">
              {activeSnippet.code}
            </pre>
          </div>

          {/* Sample Input / Output Contract */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans block">SAMPLE INPUT / CALL CONTRACT</span>
              <p className="text-slate-300 text-[11px] break-all">{activeSnippet.sampleInput}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans block">VERIFIED OUTPUT / ARTIFACT</span>
              <p className="text-emerald-400 text-[11px] break-all">{activeSnippet.sampleOutput}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
