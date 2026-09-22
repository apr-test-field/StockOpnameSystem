import React, { useState } from 'react';
import { LocationIO, LocationSubIO, Locator, OpnameRecord } from '../types';
import { 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  Boxes
} from 'lucide-react';

interface LocatorSelectorProps {
  ios: LocationIO[];
  subIos: LocationSubIO[];
  locators: Locator[];
  selectedIoId: string;
  setSelectedIoId: (id: string) => void;
  selectedSubIoId: string;
  setSelectedSubIoId: (id: string) => void;
  selectedLocatorId: string;
  setSelectedLocatorId: (id: string) => void;
  records: OpnameRecord[];
  onToggleLocatorStatus: (locatorId: string) => void;
  onAddQuickLocator?: (subIoId: string, code: string, baris: string) => void;
  onOpenLocationMaster?: () => void;
}

export const LocatorSelector: React.FC<LocatorSelectorProps> = ({
  ios,
  subIos,
  locators,
  selectedIoId,
  setSelectedIoId,
  selectedSubIoId,
  setSelectedSubIoId,
  selectedLocatorId,
  setSelectedLocatorId,
  records,
  onToggleLocatorStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Current IO, Sub-IO, Locator
  const currentIo = ios.find((i) => i.id === selectedIoId) || ios[0];
  const availableSubIos = subIos.filter((s) => s.ioId === selectedIoId);
  const currentSubIo = availableSubIos.find((s) => s.id === selectedSubIoId) || availableSubIos[0];

  // Locators in current Sub-IO
  const subIoLocators = locators.filter((l) => l.subIoId === selectedSubIoId);
  const currentLocator = locators.find((l) => l.id === selectedLocatorId) || subIoLocators[0];

  // Locator stats
  const getLocatorStats = (locId: string) => {
    const locRecords = records.filter((r) => r.locatorId === locId);
    const count = locRecords.length;
    const baik = locRecords.reduce((acc, r) => acc + r.qtyBaik, 0);
    const pecah = locRecords.reduce((acc, r) => acc + r.qtyPecah, 0);
    return { count, baik, pecah, total: baik + pecah };
  };

  const currentStats = currentLocator ? getLocatorStats(currentLocator.id) : { count: 0, baik: 0, pecah: 0, total: 0 };

  // Navigation: Next / Prev Locator in current Sub-IO
  const currentIndex = subIoLocators.findIndex((l) => l.id === selectedLocatorId);
  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedLocatorId(subIoLocators[currentIndex - 1].id);
    }
  };
  const handleNext = () => {
    if (currentIndex < subIoLocators.length - 1) {
      setSelectedLocatorId(subIoLocators[currentIndex + 1].id);
    }
  };

  // Quick search across all locators
  const matchingLocators = searchQuery.trim()
    ? locators.filter((l) => {
        const query = searchQuery.toLowerCase();
        return l.code.toLowerCase().includes(query) || (l.baris && l.baris.toLowerCase().includes(query));
      })
    : [];

  const handleSelectSearchedLocator = (loc: Locator) => {
    const parentSub = subIos.find((s) => s.id === loc.subIoId);
    if (parentSub) {
      setSelectedIoId(parentSub.ioId);
      setSelectedSubIoId(parentSub.id);
    }
    setSelectedLocatorId(loc.id);
    setSearchQuery('');
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm text-white">
      {/* 1. Hierarchy Selectors: IO & Sub-IO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
        {/* IO Selector */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            1. INVENTORY ORGANIZATION (IO)
          </label>
          <select
            id="select-io"
            value={selectedIoId}
            onChange={(e) => {
              const newIoId = e.target.value;
              setSelectedIoId(newIoId);
              const nextSubs = subIos.filter((s) => s.ioId === newIoId);
              if (nextSubs.length > 0) {
                setSelectedSubIoId(nextSubs[0].id);
                const nextLocs = locators.filter((l) => l.subIoId === nextSubs[0].id);
                if (nextLocs.length > 0) {
                  setSelectedLocatorId(nextLocs[0].id);
                }
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
          >
            {ios.map((io) => (
              <option key={io.id} value={io.id}>
                {io.name} ({io.code})
              </option>
            ))}
          </select>
        </div>

        {/* Sub-IO Selector */}
        <div className="md:col-span-5">
          <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-amber-400" />
            2. SUB-IO (BLOK BESAR GUDANG)
          </label>
          <select
            id="select-subio"
            value={selectedSubIoId}
            onChange={(e) => {
              const newSubId = e.target.value;
              setSelectedSubIoId(newSubId);
              const nextLocs = locators.filter((l) => l.subIoId === newSubId);
              if (nextLocs.length > 0) {
                setSelectedLocatorId(nextLocs[0].id);
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
          >
            {availableSubIos.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Search Locator */}
        <div className="md:col-span-3 relative">
          <label className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            CARI CEPAT LOCATOR
          </label>
          <div className="relative">
            <input
              id="search-locator-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: A-01-01 atau B-02..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Quick search dropdown results */}
          {searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
              {matchingLocators.length > 0 ? (
                matchingLocators.map((loc) => {
                  const sub = subIos.find((s) => s.id === loc.subIoId);
                  const stats = getLocatorStats(loc.id);
                  return (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectSearchedLocator(loc)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center justify-between border-b border-slate-700/50 last:border-0"
                    >
                      <div>
                        <span className="font-mono font-bold text-amber-400">{loc.code}</span>
                        <span className="text-slate-400 ml-2">({sub?.code} - {loc.baris})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {stats.count} SKU ({stats.total} dus)
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-xs text-slate-400 text-center">Locator tidak ditemukan</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Active Locator Banner & Baris Navigation */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 sm:gap-4">
        {/* Current Locator Badge & Details */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide">LOCATOR:</span>
              <span className="text-lg sm:text-xl font-black font-mono tracking-wider text-amber-400 bg-amber-400/10 px-2 sm:px-2.5 py-0.5 rounded border border-amber-400/20">
                {currentLocator ? currentLocator.code : 'PILIH LOCATOR'}
              </span>
              {currentLocator?.status === 'SELESAI' ? (
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> Selesai
                </span>
              ) : (
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" /> Proses
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current Locator Count Stats & Next/Prev Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          {/* Counts for this locator - Grid on mobile so it never wraps or breaks */}
          <div className="grid grid-cols-3 divide-x divide-slate-800 bg-slate-900/90 rounded-lg border border-slate-800 py-1.5 px-1 sm:px-3">
            <div className="text-center px-2">
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold truncate">Item SKU</div>
              <div className="font-bold text-white font-mono text-xs sm:text-sm">{currentStats.count}</div>
            </div>
            <div className="text-center px-2">
              <div className="text-[9px] sm:text-[10px] text-emerald-400 uppercase font-semibold truncate">Baik</div>
              <div className="font-bold text-emerald-400 font-mono text-xs sm:text-sm">
                {currentStats.baik} <span className="text-[10px] font-normal text-emerald-500/70">dus</span>
              </div>
            </div>
            <div className="text-center px-2">
              <div className="text-[9px] sm:text-[10px] text-rose-400 uppercase font-semibold truncate">Pecah</div>
              <div className="font-bold text-rose-400 font-mono text-xs sm:text-sm">
                {currentStats.pecah} <span className="text-[10px] font-normal text-rose-500/70">dus</span>
              </div>
            </div>
          </div>

          {/* Action Row: Status Button & Stepper */}
          <div className="flex items-center gap-2">
            {/* Toggle Selesai Status */}
            {currentLocator && (
              <button
                type="button"
                onClick={() => onToggleLocatorStatus(currentLocator.id)}
                className={`flex-1 sm:flex-initial h-10 sm:h-9 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors touch-manipulation ${
                  currentLocator.status === 'SELESAI'
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white'
                }`}
                title="Tandai baris locator ini sudah selesai di-opname"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {currentLocator.status === 'SELESAI' ? 'Selesai' : 'Tandai Selesai'}
                </span>
              </button>
            )}

            {/* Previous / Next Stepper */}
            <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 sm:p-1 rounded-lg border border-slate-800 h-10 sm:h-9">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 touch-manipulation"
                title="Locator Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-mono text-slate-400 px-1.5 sm:px-1 whitespace-nowrap min-w-[3rem] text-center">
                {currentIndex + 1}/{subIoLocators.length || 1}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= subIoLocators.length - 1}
                className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 touch-manipulation"
                title="Locator Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Locator Quick Pills (Baris Penyimpanan) */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {subIoLocators.map((loc) => {
            const isSelected = loc.id === selectedLocatorId;
            const stats = getLocatorStats(loc.id);
            const isDone = loc.status === 'SELESAI';

            return (
              <button
                key={loc.id}
                onClick={() => setSelectedLocatorId(loc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : isDone
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/50'
                    : stats.count > 0
                    ? 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-750'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/70 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{loc.code}</span>
                {stats.count > 0 && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-slate-950/80 text-amber-300' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    {stats.count}
                  </span>
                )}
                {isDone && !isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
