import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, HelpCircle, MessageSquare, Search } from 'lucide-react';
import { schoolLogos, getLogoUrl } from '../utils/schoolLogos';

export default function LogoSelector({ selectedLogo, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogos = useMemo(() => {
    if (!searchQuery) return schoolLogos;
    return schoolLogos.filter(logo => 
      logo.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (logo) => {
    const url = getLogoUrl(logo.filename);
    onSelect(url);
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedOption = schoolLogos.find(l => getLogoUrl(l.filename) === selectedLogo);

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          {selectedOption ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                <img src={getLogoUrl(selectedOption.filename)} alt="" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-700">{selectedOption.name}</span>
            </>
          ) : selectedLogo ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                <img src={selectedLogo} alt="Current Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-slate-700">Current Logo</span>
            </>
          ) : (
            <span className="text-slate-400 font-medium">Select your school logo...</span>
          )}
        </div>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                autoFocus
                placeholder="Search your school..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {filteredLogos.length > 0 ? (
              filteredLogos.map((logo) => {
                const url = getLogoUrl(logo.filename);
                const isSelected = selectedLogo === url;
                return (
                  <div 
                    key={logo.filename}
                    onClick={() => handleSelect(logo)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-sm font-bold">{logo.name}</span>
                    </div>
                    {isSelected && <Check size={16} />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm">
                No schools found matching "{searchQuery}"
              </div>
            )}
          </div>
          
          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo missing?</span>
              <span className="h-[1px] flex-grow mx-3 bg-slate-200"></span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a 
                href="https://wa.me/23280952832"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition shadow-sm shadow-emerald-200"
              >
                <MessageSquare size={14} /> WhatsApp
              </a>
              <a 
                href="tel:+23279538326" 
                className="flex items-center justify-center gap-2 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition shadow-sm shadow-blue-200"
              >
                <HelpCircle size={14} /> Call Dev
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
