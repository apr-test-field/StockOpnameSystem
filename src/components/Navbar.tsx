import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { 
  ClipboardList, 
  FileSpreadsheet, 
  Database, 
  Layers, 
  User, 
  Boxes,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  auditor: string;
  setAuditor: (name: string) => void;
  totalRecords: number;
  totalBaik: number;
  totalPecah: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  auditor,
  setAuditor,
  totalRecords,
  totalBaik,
  totalPecah,
}) => {
  const [isEditingAuditor, setIsEditingAuditor] = useState(false);
  const [auditorInput, setAuditorInput] = useState(auditor);

  const handleSaveAuditor = () => {
    if (auditorInput.trim()) {
      setAuditor(auditorInput.trim());
    }
    setIsEditingAuditor(false);
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Warehouse Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">CERAMIX OPNAME</span>
            </div>
          </div>

          {/* Quick Metrics & Auditor */}
          <div className="flex items-center gap-4">
            {/* Quick Live Count */}
            <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400">Total Baris: </span>
                <span className="font-bold text-white font-mono">{totalRecords}</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400">Baik: </span>
                <span className="font-bold text-emerald-400 font-mono">{totalBaik.toLocaleString('id-ID')} Dus</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400">Pecah: </span>
                <span className="font-bold text-rose-400 font-mono">{totalPecah.toLocaleString('id-ID')} Dus</span>
              </div>
            </div>

            {/* Auditor Badge */}
            <div className="relative">
              {isEditingAuditor ? (
                <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-md border border-amber-500/60">
                  <input
                    type="text"
                    value={auditorInput}
                    onChange={(e) => setAuditorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveAuditor()}
                    placeholder="Nama Petugas"
                    className="text-xs bg-slate-900 px-2 py-1 rounded text-white focus:outline-none border border-slate-700 w-36"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveAuditor}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-1 rounded"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingAuditor(true)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 transition-colors"
                  title="Klik untuk ubah nama auditor"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-white max-w-[120px] truncate">{auditor}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-700/60 px-1 rounded">Ubah</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 py-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-opname"
            onClick={() => setActiveTab('opname')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'opname'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Input Opname (per Locator)</span>
          </button>

          <button
            id="tab-results"
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'results'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Hasil & Rekap Opname</span>
            {totalRecords > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === 'results'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-slate-800 text-amber-400 border border-slate-700'
                }`}
              >
                {totalRecords}
              </span>
            )}
          </button>

          <button
            id="tab-master"
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'master'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Master SKU & Excel Import</span>
          </button>

          <div className="ml-auto hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{todayStr}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
