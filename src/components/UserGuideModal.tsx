import React, { useState } from 'react';
import { X, Globe, Search, BookOpen, Copy, Check } from 'lucide-react';
import { USER_GUIDE_TRANSLATIONS } from '../data/userGuideTranslations';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentGuide = USER_GUIDE_TRANSLATIONS[selectedLang] || USER_GUIDE_TRANSLATIONS['en'];
  const isRtl = currentGuide.dir === 'rtl';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentGuide.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter sections by search term if provided
  const displayContent = searchTerm.trim()
    ? currentGuide.content
        .split('\n\n')
        .filter((paragraph) =>
          paragraph.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .join('\n\n')
    : currentGuide.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                KayBiT_Util User Guide
              </h2>
              <p className="text-[11px] text-slate-400">
                Architectural Manual · Multi-Language Documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 border border-slate-700 px-2 py-1">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
                aria-label="Select User Guide Language"
              >
                {Object.values(USER_GUIDE_TRANSLATIONS).map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-2.5 border-b border-slate-800/70 bg-slate-900/60 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search curriculum, phases, or technologies (e.g., Kalman, PostGIS, TPM, COBOL)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[11px] text-slate-400 hover:text-slate-200 px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className={`flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-xs sm:text-sm leading-relaxed ${
            isRtl ? 'font-sans' : ''
          }`}
        >
          <div className="max-w-none prose prose-invert prose-headings:text-slate-100 prose-headings:font-semibold prose-a:text-cyan-400 prose-code:text-cyan-300">
            {displayContent.split('\n\n').map((block, idx) => {
              const trimmed = block.trim();
              if (trimmed.startsWith('# ')) {
                return (
                  <h1 key={idx} className="text-xl sm:text-2xl font-bold text-slate-100 pb-2 border-b border-slate-800">
                    {trimmed.replace('# ', '')}
                  </h1>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-base sm:text-lg font-semibold text-cyan-300 mt-5 mb-2">
                    {trimmed.replace('## ', '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-sm sm:text-base font-medium text-slate-200 mt-4 mb-1">
                    {trimmed.replace('### ', '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('- ')) {
                const listItems = trimmed.split('\n').map((li) => li.replace(/^-\s*/, ''));
                return (
                  <ul key={idx} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-slate-300">
                    {listItems.map((item, itemIdx) => (
                      <li key={itemIdx} dangerouslySetInnerHTML={{ __html: formatBold(item) }} />
                    ))}
                  </ul>
                );
              }
              if (trimmed.startsWith('```')) {
                return (
                  <pre key={idx} className="p-3 bg-slate-950 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800 text-cyan-300">
                    {trimmed.replace(/```[a-z]*\n?/g, '')}
                  </pre>
                );
              }
              if (trimmed === '---') {
                return <hr key={idx} className="border-slate-800 my-4" />;
              }
              return (
                <p key={idx} className="text-slate-300 leading-normal" dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400">
          <div>
            Language: <span className="text-cyan-400 font-medium">{currentGuide.name}</span> ({currentGuide.nativeName}) · 21 Languages Available
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-xs font-medium cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper for formatting markdown **bold**
function formatBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>');
}
