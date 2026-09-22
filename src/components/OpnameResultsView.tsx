import React, { useState, useMemo } from 'react';
import { OpnameRecord, LocationIO, LocationSubIO, Locator } from '../types';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  ChevronDown,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { exportOpnameToExcel } from '../utils/excelUtils';

interface OpnameResultsViewProps {
  records: OpnameRecord[];
  ios: LocationIO[];
  subIos: LocationSubIO[];
  locators: Locator[];
  onDeleteRecord: (id: string) => void;
  onClearAllRecords: () => void;
  onSelectLocator: (locatorId: string) => void;
}

export const OpnameResultsView: React.FC<OpnameResultsViewProps> = ({
  records,
  ios,
  subIos,
  locators,
  onDeleteRecord,
  onClearAllRecords,
  onSelectLocator,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIo, setFilterIo] = useState('');
  const [filterSubIo, setFilterSubIo] = useState('');
  const [filterLocator, setFilterLocator] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [viewMode, setViewMode] = useState<'detail' | 'rekap-locator' | 'rekap-motif'>('detail');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (filterIo && rec.ioId !== filterIo) return false;
      if (filterSubIo && rec.subIoId !== filterSubIo) return false;
      if (filterLocator && rec.locatorId !== filterLocator) return false;
      if (filterGrade && rec.grade !== filterGrade) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMotif = rec.motif.toLowerCase().includes(q);
        const matchWarna = rec.warna.toLowerCase().includes(q);
        const matchLocator = rec.locatorCode.toLowerCase().includes(q);
        const matchTonality = rec.tonality.toLowerCase().includes(q);
        const matchUkuran = rec.ukuran.toLowerCase().includes(q);
        const matchAuditor = (rec.auditor || '').toLowerCase().includes(q);
        const matchCatatan = (rec.catatan || '').toLowerCase().includes(q);
        return (
          matchMotif ||
          matchWarna ||
          matchLocator ||
          matchTonality ||
          matchUkuran ||
          matchAuditor ||
          matchCatatan
        );
      }
      return true;
    });
  }, [records, filterIo, filterSubIo, filterLocator, filterGrade, searchQuery]);

  // Totals for filtered records
  const totalBaik = filteredRecords.reduce((acc, r) => acc + r.qtyBaik, 0);
  const totalPecah = filteredRecords.reduce((acc, r) => acc + r.qtyPecah, 0);
  const grandTotal = totalBaik + totalPecah;
  const breakPercentage = grandTotal > 0 ? ((totalPecah / grandTotal) * 100).toFixed(2) : '0.00';

  // Distinct locators counted
  const distinctLocatorsCounted = new Set(records.map((r) => r.locatorId)).size;

  // Distinct grades available in records
  const availableGrades = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => s.add(r.grade));
    return Array.from(s).sort();
  }, [records]);

  // Handle Export
  const handleExportAll = () => {
    exportOpnameToExcel(records, { scopeName: 'Semua_Data' });
  };

  const handleExportFiltered = () => {
    exportOpnameToExcel(filteredRecords, { scopeName: 'Data_Terfilter' });
  };

  // Grouping for Rekap per Locator
  const locatorSummary = useMemo(() => {
    const map: { [locCode: string]: { locId: string; subIo: string; count: number; baik: number; pecah: number } } = {};
    filteredRecords.forEach((rec) => {
      if (!map[rec.locatorCode]) {
        map[rec.locatorCode] = { locId: rec.locatorId, subIo: rec.subIoName, count: 0, baik: 0, pecah: 0 };
      }
      map[rec.locatorCode].count += 1;
      map[rec.locatorCode].baik += rec.qtyBaik;
      map[rec.locatorCode].pecah += rec.qtyPecah;
    });
    return Object.entries(map).map(([locCode, data]) => ({
      locCode,
      ...data,
      total: data.baik + data.pecah,
    }));
  }, [filteredRecords]);

  // Grouping for Rekap per Motif & Grade
  const motifSummary = useMemo(() => {
    const map: { [key: string]: { motif: string; grade: string; baik: number; pecah: number } } = {};
    filteredRecords.forEach((rec) => {
      const key = `${rec.motif}__${rec.grade}`;
      if (!map[key]) {
        map[key] = { motif: rec.motif, grade: rec.grade, baik: 0, pecah: 0 };
      }
      map[key].baik += rec.qtyBaik;
      map[key].pecah += rec.qtyPecah;
    });
    return Object.values(map).map((m) => ({
      ...m,
      total: m.baik + m.pecah,
    }));
  }, [filteredRecords]);

  return (
    <div className="space-y-5">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Baik */}
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 shadow-sm text-white">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Total Qty Baik
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {totalBaik.toLocaleString('id-ID')}
            <span className="text-xs font-normal text-slate-400 ml-1">dus</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Kondisi bagus siap jual</p>
        </div>

        {/* Total Pecah */}
        <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-4 shadow-sm text-white">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1">
            Total Qty Pecah
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {totalPecah.toLocaleString('id-ID')}
            <span className="text-xs font-normal text-slate-400 ml-1">dus</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cacat fisik / sortir retur</p>
        </div>

        {/* Grand Total */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-sm text-white">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Grand Total Fisik
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {grandTotal.toLocaleString('id-ID')}
            <span className="text-xs font-normal text-slate-400 ml-1">dus</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Baik + Pecah terdata</p>
        </div>

        {/* % Kerusakan */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 shadow-sm text-white">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
            Rasio Pecah / Scrap
          </div>
          <div className="text-2xl font-black font-mono text-amber-300">
            {breakPercentage}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tingkat kerusakan di rak</p>
        </div>

        {/* Locators Checked */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-sm text-white">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Locator Teropname
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {distinctLocatorsCounted}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {locators.length}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total baris rak terisi</p>
        </div>
      </div>

      {/* Main Container: Controls & Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm text-white">
        {/* Header & Export Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Laporan Hasil Stock Opname
            </h2>
            <p className="text-xs text-slate-400">
              Total {records.length} baris pencatatan fisik keramik tersimpan di memori perangkat
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('detail')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === 'detail' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Detail Baris
              </button>
              <button
                onClick={() => setViewMode('rekap-locator')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === 'rekap-locator' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Rekap Locator
              </button>
              <button
                onClick={() => setViewMode('rekap-motif')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === 'rekap-motif' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Rekap Motif & Grade
              </button>
            </div>

            {/* Export Excel Buttons */}
            <button
              id="btn-export-excel"
              onClick={handleExportAll}
              disabled={records.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Ekspor seluruh hasil opname ke file Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Semua ke Excel (.xlsx)</span>
            </button>

            {filteredRecords.length !== records.length && filteredRecords.length > 0 && (
              <button
                onClick={handleExportFiltered}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Filter ({filteredRecords.length})</span>
              </button>
            )}

            {/* Clear All Records with In-UI Confirm */}
            {records.length > 0 && (
              showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-rose-950 p-1 rounded-lg border border-rose-600 animate-in fade-in text-xs">
                  <span className="text-rose-200 font-bold px-1 text-[11px] whitespace-nowrap">Reset Semua?</span>
                  <button
                    onClick={() => {
                      onClearAllRecords();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded flex items-center gap-1"
                    title="Ya, Bersihkan Semua Data Opname"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Ya</span>
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    title="Batal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 text-xs transition-colors"
                  title="Hapus / Reset semua data opname untuk sesi baru"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-4 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari motif, locator, tonality..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Filter IO */}
          <div>
            <select
              value={filterIo}
              onChange={(e) => {
                setFilterIo(e.target.value);
                setFilterSubIo('');
                setFilterLocator('');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua IO (Gudang)</option>
              {ios.map((io) => (
                <option key={io.id} value={io.id}>
                  {io.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Sub-IO */}
          <div>
            <select
              value={filterSubIo}
              onChange={(e) => {
                setFilterSubIo(e.target.value);
                setFilterLocator('');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Sub-IO (Blok)</option>
              {(filterIo ? subIos.filter((s) => s.ioId === filterIo) : subIos).map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Locator */}
          <div>
            <select
              value={filterLocator}
              onChange={(e) => setFilterLocator(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            >
              <option value="">Semua Locator (Baris)</option>
              {(filterSubIo ? locators.filter((l) => l.subIoId === filterSubIo) : locators).map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} ({loc.baris})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Grade */}
          <div>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Semua Grade</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* VIEW MODE 1: DETAIL ROWS */}
        {viewMode === 'detail' && (
          <div>
            {filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-slate-800 rounded-lg bg-slate-950/40">
                <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium text-slate-300">Tidak ada data opname yang sesuai dengan filter</p>
                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center">No</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Sub-IO & Locator</th>
                      <th className="py-2.5 px-3">Motif & Warna</th>
                      <th className="py-2.5 px-3">Surface</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Tonality</th>
                      <th className="py-2.5 px-3">Ukuran</th>
                      <th className="py-2.5 px-3 text-right">Qty Baik</th>
                      <th className="py-2.5 px-3 text-right">Qty Pecah</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3">Petugas</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 bg-slate-900/60 font-sans">
                    {filteredRecords.map((r, idx) => {
                      const recDate = new Date(r.timestamp);
                      const timeString = recDate.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {timeString}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => onSelectLocator(r.locatorId)}
                              className="font-mono font-bold text-amber-400 hover:underline text-left block"
                              title="Buka Locator ini"
                            >
                              {r.locatorCode}
                            </button>
                            <span className="text-[10px] text-slate-400">{r.subIoName}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-white">
                            <div>{r.motif}</div>
                            <div className="text-[11px] text-slate-400">{r.warna}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{r.surface}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                            {r.tonality}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">{r.ukuran}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            {r.qtyBaik.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                            {r.qtyPecah.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {(r.qtyBaik + r.qtyPecah).toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {r.auditor}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {deleteConfirmId === r.id ? (
                              <div className="flex items-center justify-center gap-1 bg-rose-950 p-0.5 rounded border border-rose-700 animate-in fade-in">
                                <span className="text-[10px] text-rose-300 font-bold px-1 whitespace-nowrap">Hapus?</span>
                                <button
                                  onClick={() => {
                                    onDeleteRecord(r.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                                  title="Ya, Hapus"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                                  title="Batal"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(r.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                                title="Hapus baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: REKAP PER LOCATOR */}
        {viewMode === 'rekap-locator' && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-center">No</th>
                  <th className="py-2.5 px-3">Kode Locator</th>
                  <th className="py-2.5 px-3">Sub-IO (Blok)</th>
                  <th className="py-2.5 px-3 text-center">Varian SKU</th>
                  <th className="py-2.5 px-3 text-right">Total Baik</th>
                  <th className="py-2.5 px-3 text-right">Total Pecah</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-slate-900/60 font-sans">
                {locatorSummary.map((loc, idx) => (
                  <tr key={loc.locCode} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {loc.locCode}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{loc.subIo}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                      {loc.count} SKU
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {loc.baik.toLocaleString('id-ID')} Dus
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                      {loc.pecah.toLocaleString('id-ID')} Dus
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {loc.total.toLocaleString('id-ID')} Dus
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectLocator(loc.locId)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded text-[11px] transition-colors"
                      >
                        Buka Locator
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW MODE 3: REKAP PER MOTIF & GRADE */}
        {viewMode === 'rekap-motif' && (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Motif Keramik</th>
                  <th className="py-2.5 px-3">Grade (Kualitas)</th>
                  <th className="py-2.5 px-3 text-right">Total Qty Baik</th>
                  <th className="py-2.5 px-3 text-right">Total Qty Pecah</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-slate-900/60 font-sans">
                {motifSummary.map((m, idx) => (
                  <tr key={`${m.motif}-${m.grade}`} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{m.motif}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                        {m.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {m.baik.toLocaleString('id-ID')} Dus
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                      {m.pecah.toLocaleString('id-ID')} Dus
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {m.total.toLocaleString('id-ID')} Dus
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
