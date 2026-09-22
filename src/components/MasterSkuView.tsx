import React, { useState, useRef } from 'react';
import { MasterSKU, LocationIO, LocationSubIO, Locator } from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  RefreshCw,
  Layers,
  HelpCircle,
  MapPin,
  Building2,
  FileDown,
  FolderTree,
  Filter,
  Check,
  X
} from 'lucide-react';
import { 
  importMasterSkuFromExcel, 
  exportMasterSkuTemplate,
  importLocationHierarchyFromExcel,
  exportLocationHierarchyTemplate,
  exportLocationHierarchyToExcel
} from '../utils/excelUtils';
import { DEFAULT_IOS, DEFAULT_SUB_IOS, DEFAULT_LOCATORS, DEFAULT_MASTER_SKUS } from '../data/defaultMasterData';

interface MasterSkuViewProps {
  masterSKUs: MasterSKU[];
  setMasterSKUs: React.Dispatch<React.SetStateAction<MasterSKU[]>>;
  ios: LocationIO[];
  setIos: React.Dispatch<React.SetStateAction<LocationIO[]>>;
  subIos: LocationSubIO[];
  setSubIos: React.Dispatch<React.SetStateAction<LocationSubIO[]>>;
  locators: Locator[];
  setLocators: React.Dispatch<React.SetStateAction<Locator[]>>;
  onAddLocator: (subIoId: string, code: string, baris: string, keterangan?: string) => void;
  onDeleteLocator: (id: string) => void;
  onImportLocationHierarchy?: (
    newIos: LocationIO[],
    newSubIos: LocationSubIO[],
    newLocators: Locator[]
  ) => void;
}

export const MasterSkuView: React.FC<MasterSkuViewProps> = ({
  masterSKUs,
  setMasterSKUs,
  ios,
  setIos,
  subIos,
  setSubIos,
  locators,
  setLocators,
  onAddLocator,
  onDeleteLocator,
  onImportLocationHierarchy,
}) => {
  const [subTab, setSubTab] = useState<'sku' | 'locations'>('sku');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmSkuId, setDeleteConfirmSkuId] = useState<string | null>(null);
  const [skuImportMode, setSkuImportMode] = useState<'replace' | 'merge'>('replace');
  const [importStatus, setImportStatus] = useState<{
    loading: boolean;
    success?: string;
    errors?: string[];
    details?: {
      totalRows: number;
      totalSkus: number;
      addedCount: number;
      updatedCount: number;
    };
  }>({ loading: false });

  // Location Hierarchy Excel States
  const [locImportMode, setLocImportMode] = useState<'replace' | 'merge'>('replace');
  const [locImportStatus, setLocImportStatus] = useState<{
    loading: boolean;
    success?: string;
    errors?: string[];
    details?: {
      totalRows: number;
      addedLocators: number;
      newIos: number;
      newSubIos: number;
    };
  }>({ loading: false });
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [locFilterIo, setLocFilterIo] = useState<string>('ALL');

  // Add SKU Manual Modal State
  const [showAddSkuModal, setShowAddSkuModal] = useState(false);
  const [newSku, setNewSku] = useState({
    skuCode: '',
    motif: '',
    warna: '',
    surface: 'Glossy',
    grade: 'Grade 1 (KW1)',
    tonality: 'T01',
    ukuran: '60x60',
    satuan: 'DUS',
  });

  // Add Locator Modal State
  const [showAddLocModal, setShowAddLocModal] = useState(false);
  const [newLocSubIoId, setNewLocSubIoId] = useState(subIos[0]?.id || '');
  const [newLocCode, setNewLocCode] = useState('');
  const [newLocBaris, setNewLocBaris] = useState('');
  const [newLocKet, setNewLocKet] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const locFileInputRef = useRef<HTMLInputElement>(null);

  // Filter master skus
  const filteredSkus = masterSKUs.filter((sku) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (sku.skuCode || '').toLowerCase().includes(q) ||
      sku.motif.toLowerCase().includes(q) ||
      sku.warna.toLowerCase().includes(q) ||
      sku.surface.toLowerCase().includes(q) ||
      sku.grade.toLowerCase().includes(q) ||
      sku.tonality.toLowerCase().includes(q) ||
      sku.ukuran.toLowerCase().includes(q)
    );
  });

  // Unique counts
  const uniqueMotifs = new Set(masterSKUs.map((s) => s.motif)).size;
  const uniqueUkurans = new Set(masterSKUs.map((s) => s.ukuran)).size;

  // Handle Excel File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus({ loading: true });
    try {
      const result = await importMasterSkuFromExcel(file, {
        mode: skuImportMode,
        existingSkus: masterSKUs,
      });
      if (result.skus.length === 0 && result.errors.length > 0) {
        setImportStatus({
          loading: false,
          errors: result.errors,
        });
        return;
      }

      // Add to master
      setMasterSKUs(result.skus);
      const modeMsg = skuImportMode === 'replace' ? 'mengganti semua data lama' : 'menggabungkan & memperbarui data';
      setImportStatus({
        loading: false,
        success: `Berhasil mengimpor file Excel (${modeMsg}): ${result.skus.length} varian SKU aktif.`,
        errors: result.errors.length > 0 ? result.errors : undefined,
        details: {
          totalRows: result.totalRows,
          totalSkus: result.skus.length,
          addedCount: result.addedCount,
          updatedCount: result.updatedCount,
        },
      });
    } catch (err: any) {
      setImportStatus({
        loading: false,
        errors: [err.message || 'Gagal membaca file Excel.'],
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Manual Add SKU
  const handleSaveManualSku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.motif || !newSku.warna || !newSku.surface || !newSku.grade || !newSku.tonality || !newSku.ukuran) {
      alert('Semua atribut SKU wajib diisi.');
      return;
    }

    const created: MasterSKU = {
      id: `sku-manual-${Date.now()}`,
      skuCode:
        newSku.skuCode.trim() ||
        `KRM-${newSku.motif.slice(0, 3).toUpperCase()}-${newSku.ukuran}-${newSku.tonality}`,
      motif: newSku.motif.trim(),
      warna: newSku.warna.trim(),
      surface: newSku.surface.trim(),
      grade: newSku.grade.trim(),
      tonality: newSku.tonality.trim().toUpperCase(),
      ukuran: newSku.ukuran.trim(),
      satuan: newSku.satuan || 'DUS',
    };

    setMasterSKUs((prev) => [created, ...prev]);
    setShowAddSkuModal(false);
    setNewSku({
      skuCode: '',
      motif: '',
      warna: '',
      surface: 'Glossy',
      grade: 'Grade 1 (KW1)',
      tonality: 'T01',
      ukuran: '60x60',
      satuan: 'DUS',
    });
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('Kembalikan database Master SKU ke data standar bawaan pabrik (25 item)?')) {
      setMasterSKUs(DEFAULT_MASTER_SKUS);
      setImportStatus({
        loading: false,
        success: 'Master SKU telah di-reset ke data katalog standar.',
      });
    }
  };

  // Handle Location Hierarchy Excel Upload
  const handleLocationFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocImportStatus({ loading: true });
    try {
      const result = await importLocationHierarchyFromExcel(
        file,
        ios,
        subIos,
        locators,
        locImportMode
      );

      if (result.locators.length === 0 && result.errors.length > 0) {
        setLocImportStatus({
          loading: false,
          errors: result.errors,
        });
        return;
      }

      // Apply changes to parent state
      if (onImportLocationHierarchy) {
        onImportLocationHierarchy(result.ios, result.subIos, result.locators);
      } else {
        setIos(result.ios);
        setSubIos(result.subIos);
        setLocators(result.locators);
      }

      setLocImportStatus({
        loading: false,
        success: `Berhasil memproses hierarki lokasi dari file Excel! ${result.locators.length} total baris locator, ${result.subIos.length} blok Sub-IO, dan ${result.ios.length} organisasi IO (${locImportMode === 'replace' ? 'Mode Ganti Semua' : 'Mode Gabungkan / Update'}).`,
        errors: result.errors.length > 0 ? result.errors : undefined,
        details: {
          totalRows: result.totalRows,
          addedLocators: result.addedLocatorsCount,
          newIos: result.newIosCount,
          newSubIos: result.newSubIosCount,
        },
      });
    } catch (err: any) {
      setLocImportStatus({
        loading: false,
        errors: [err.message || 'Gagal membaca file Excel hierarki lokasi.'],
      });
    } finally {
      if (locFileInputRef.current) locFileInputRef.current.value = '';
    }
  };

  // Reset Locations to Factory Default
  const handleResetDefaultLocations = () => {
    if (confirm('Kembalikan struktur lokasi ke standar bawaan pabrik keramik (IO-GBJ, Blok A-C, Transit)? Semua data baris khusus akan direset.')) {
      if (onImportLocationHierarchy) {
        onImportLocationHierarchy(DEFAULT_IOS, DEFAULT_SUB_IOS, DEFAULT_LOCATORS);
      } else {
        setIos(DEFAULT_IOS);
        setSubIos(DEFAULT_SUB_IOS);
        setLocators(DEFAULT_LOCATORS);
      }
      setLocImportStatus({
        loading: false,
        success: 'Struktur lokasi berhasil dikembalikan ke standar bawaan pabrik keramik.',
      });
    }
  };

  return (
    <div className="space-y-5 text-white">
      {/* Sub Tabs: Master SKU vs Lokasi */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('sku')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              subTab === 'sku'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Master SKU ({masterSKUs.length})</span>
          </button>
          <button
            onClick={() => setSubTab('locations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              subTab === 'locations'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Hierarki Lokasi (IO & Locator)</span>
          </button>
        </div>

        {subTab === 'sku' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1.5 transition-colors"
              title="Reset ke data bawaan pabrik"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
          </div>
        )}
      </div>

      {subTab === 'sku' ? (
        <div className="space-y-5">
          {/* EXCEL IMPORT / EXPORT BANNER */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  Import Master SKU dari File Excel
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Upload file Excel berisi daftar master keramik lantai Anda. Form input opname akan otomatis membaca opsi dropdown Motif, Warna, Surface, Grade, Tonality, dan Ukuran dari file ini.
                </p>
              </div>

              {/* Action Buttons: Upload & Template */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-input"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importStatus.loading}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{importStatus.loading ? 'Memproses Excel...' : 'Upload File Excel (.xlsx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={exportMasterSkuTemplate}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-lg text-xs flex items-center gap-2 transition-all"
                  title="Unduh contoh template Excel siap isi"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Unduh Template Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddSkuModal(true)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Manual</span>
                </button>
              </div>
            </div>

            {/* Import Mode Selection & Column Info */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Pilih Mode Impor:
                </span>
                <div className="inline-flex p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSkuImportMode('replace')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      skuImportMode === 'replace'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Menimpa database Master SKU saat ini dengan seluruh data dari file Excel"
                  >
                    {skuImportMode === 'replace' && <Check className="w-3.5 h-3.5" />}
                    <span>Ganti Semua (Replace)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkuImportMode('merge')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      skuImportMode === 'merge'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Menambahkan SKU baru atau mengupdate varian SKU yang cocok tanpa menghapus data yang ada"
                  >
                    {skuImportMode === 'merge' && <Check className="w-3.5 h-3.5" />}
                    <span>Gabungkan / Update (Merge)</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="font-semibold text-slate-300">Kolom yang didukung:</span>
                <span className="text-amber-300 font-mono text-[11px]">Motif, Warna, Surface, Grade, Tonality, Ukuran, SKU Code (Opsional)</span>
              </div>
            </div>

            {/* Import Status Alert */}
            {importStatus.loading && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Memproses baris file Excel dan memvalidasi varian Master SKU...</span>
              </div>
            )}

            {importStatus.success && (
              <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-lg text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{importStatus.success}</span>
                </div>
                {importStatus.details && (
                  <div className="text-[11px] text-emerald-400/90 pl-6">
                    Total baris dibaca: {importStatus.details.totalRows} | Total SKU sekarang: {importStatus.details.totalSkus}
                    {importStatus.details.addedCount > 0 && ` | Ditambahkan: ${importStatus.details.addedCount}`}
                    {importStatus.details.updatedCount > 0 && ` | Diperbarui: ${importStatus.details.updatedCount}`}
                  </div>
                )}
              </div>
            )}

            {importStatus.errors && importStatus.errors.length > 0 && (
              <div className="mt-4 p-3 bg-rose-950/40 border border-rose-600/40 rounded-lg text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Catatan Validasi Excel:</span>
                </div>
                <ul className="list-disc list-inside pl-2 space-y-0.5 max-h-32 overflow-y-auto font-mono text-[11px]">
                  {importStatus.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Format explanation */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
              <span className="font-semibold text-slate-300">Format Kolom Excel yang didukung:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-amber-300">Motif</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-amber-300">Warna</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-amber-300">Surface</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-amber-300">Grade</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-amber-300">Tonality</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-amber-300">Ukuran</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-400">SKU Code (Opsional)</span>
            </div>
          </div>

          {/* MASTER SKU TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Daftar Master SKU Aktif</h3>
                <p className="text-xs text-slate-400">
                  Total {masterSKUs.length} kombinasi SKU ({uniqueMotifs} motif, {uniqueUkurans} ukuran)
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari motif, warna, ukuran, grade..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {filteredSkus.length === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-slate-800 rounded-lg bg-slate-950/40">
                <Database className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium text-slate-300">Tidak ada SKU yang ditemukan</p>
                <p className="text-xs text-slate-500 mt-1">Upload file Excel atau tambahkan varian SKU manual.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-center">No</th>
                      <th className="py-2.5 px-3">Kode SKU</th>
                      <th className="py-2.5 px-3">Motif</th>
                      <th className="py-2.5 px-3">Warna</th>
                      <th className="py-2.5 px-3">Surface</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Tonality</th>
                      <th className="py-2.5 px-3">Ukuran</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 bg-slate-900/60 font-sans">
                    {filteredSkus.map((sku, idx) => (
                      <tr key={sku.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                          {sku.skuCode || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">{sku.motif}</td>
                        <td className="py-2.5 px-3 text-slate-300">{sku.warna}</td>
                        <td className="py-2.5 px-3 text-slate-300">{sku.surface}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                            {sku.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          {sku.tonality}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{sku.ukuran} cm</td>
                        <td className="py-2.5 px-3 text-center">
                          {deleteConfirmSkuId === sku.id ? (
                            <div className="flex items-center justify-center gap-1 bg-rose-950 p-0.5 rounded border border-rose-700 animate-in fade-in">
                              <span className="text-[10px] text-rose-300 font-bold px-1 whitespace-nowrap">Hapus?</span>
                              <button
                                onClick={() => {
                                  setMasterSKUs((prev) => prev.filter((s) => s.id !== sku.id));
                                  setDeleteConfirmSkuId(null);
                                }}
                                className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                                title="Ya, Hapus SKU"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmSkuId(null)}
                                className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                                title="Batal"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmSkuId(sku.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              title="Hapus SKU"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LOCATIONS MANAGEMENT SUB-TAB */
        <div className="space-y-5">
          {/* EXCEL IMPORT / EXPORT PANEL FOR LOCATION HIERARCHY */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  Impor & Ekspor Hierarki Lokasi dari Excel
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Atur denah dan susunan gudang keramik secara massal: Organisasi Gudang (IO) → Blok (Sub-IO) → Baris Rak (Locator).
                </p>
              </div>

              <input
                type="file"
                ref={locFileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleLocationFileUpload}
                className="hidden"
                id="excel-loc-file-input"
              />

              {/* Action Buttons: Upload & Template */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => locFileInputRef.current?.click()}
                  disabled={locImportStatus.loading}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                  title="Pilih file Excel hierarki lokasi untuk diunggah"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{locImportStatus.loading ? 'Memproses Excel...' : 'Upload File Excel (.xlsx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={exportLocationHierarchyTemplate}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Unduh contoh format file Excel untuk diisi"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unduh Template Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportLocationHierarchyToExcel(ios, subIos, locators)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Ekspor seluruh struktur lokasi saat ini ke file Excel"
                >
                  <FileDown className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ekspor Hierarki (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaultLocations}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 rounded-lg text-xs transition-colors"
                  title="Kembalikan struktur lokasi ke standar pabrik"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Import Mode Selection & Column Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Pilih Mode Impor:
                </span>
                <div className="inline-flex p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLocImportMode('replace')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      locImportMode === 'replace'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Menimpa struktur lokasi saat ini dengan data dari file"
                  >
                    {locImportMode === 'replace' && <Check className="w-3.5 h-3.5" />}
                    <span>Ganti Semua (Replace)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocImportMode('merge')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                      locImportMode === 'merge'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Menambahkan baris atau blok baru tanpa menghapus data lama"
                  >
                    {locImportMode === 'merge' && <Check className="w-3.5 h-3.5" />}
                    <span>Gabungkan / Update (Merge)</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="font-semibold text-slate-300">Kolom yang didukung:</span>
                <span className="text-amber-300 font-mono text-[11px]">Kode IO, Nama IO, Kode Sub-IO, Nama Sub-IO, Kode Locator, Posisi Baris, Keterangan</span>
              </div>
            </div>

            {/* Status Notifications */}
            {locImportStatus.loading && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>Memproses baris file Excel dan menyusun hierarki lokasi gudang...</span>
              </div>
            )}

            {locImportStatus.success && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{locImportStatus.success}</span>
                </div>
                {locImportStatus.details && (
                  <div className="text-[11px] text-emerald-400/90 pl-6">
                    Total baris dibaca: {locImportStatus.details.totalRows} | Locator ditambahkan/update:{' '}
                    {locImportStatus.details.addedLocators} | Organisasi IO baru: {locImportStatus.details.newIos} |
                    Sub-IO baru: {locImportStatus.details.newSubIos}
                  </div>
                )}
              </div>
            )}

            {locImportStatus.errors && locImportStatus.errors.length > 0 && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Peringatan / Catatan Baris Excel ({locImportStatus.errors.length} baris):</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pl-6 text-[11px] text-rose-300/90 font-mono">
                  {locImportStatus.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* METRIC BADGES & FILTER BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Inventory Org (IO)</div>
                <div className="text-lg font-bold text-white font-mono">{ios.length} Organisasi</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Sub-IO (Blok Gudang)</div>
                <div className="text-lg font-bold text-white font-mono">{subIos.length} Blok</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Total Locator (Baris)</div>
                <div className="text-lg font-bold text-white font-mono">{locators.length} Baris Rak</div>
              </div>
            </div>
          </div>

          {/* LOCATORS SEARCH & LIST VIEW */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari kode locator, nomor baris, atau blok..."
                    value={locSearchQuery}
                    onChange={(e) => setLocSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Filter IO */}
                <select
                  value={locFilterIo}
                  onChange={(e) => setLocFilterIo(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">Semua Organisasi (IO)</option>
                  {ios.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.code} - {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowAddLocModal(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all self-start md:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Baris Manual</span>
              </button>
            </div>

            {/* Hierarchical Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {subIos
                .filter((sub) => locFilterIo === 'ALL' || sub.ioId === locFilterIo)
                .map((sub) => {
                  const parentIo = ios.find((i) => i.id === sub.ioId);
                  const blockLocators = locators.filter((l) => {
                    if (l.subIoId !== sub.id) return false;
                    if (!locSearchQuery.trim()) return true;
                    const q = locSearchQuery.toLowerCase();
                    return (
                      l.code.toLowerCase().includes(q) ||
                      (l.baris && l.baris.toLowerCase().includes(q)) ||
                      (l.keterangan && l.keterangan.toLowerCase().includes(q))
                    );
                  });

                  // If search query is active and this block has 0 matching locators, hide if not matching sub name
                  if (locSearchQuery.trim() && blockLocators.length === 0 && !sub.name.toLowerCase().includes(locSearchQuery.toLowerCase())) {
                    return null;
                  }

                  return (
                    <div key={sub.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                            {sub.code}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                            {parentIo?.code || 'IO-GBJ'}
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-sm mb-1">{sub.name}</h4>
                        <p className="text-xs text-slate-400 mb-3">{sub.description || `Zona penyimpanan ${sub.code}`}</p>
                      </div>

                      <div className="border-t border-slate-800/80 pt-2.5 mt-1">
                        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                          <span>Daftar Baris Locator:</span>
                          <span className="text-amber-400 font-mono text-[11px]">
                            {blockLocators.length} baris
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {blockLocators.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-500 italic bg-slate-900/60 rounded border border-slate-800/60">
                              Tidak ada baris yang cocok
                            </div>
                          ) : (
                            blockLocators.map((loc) => (
                              <div
                                key={loc.id}
                                className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-mono font-bold text-amber-300 truncate">{loc.code}</div>
                                  <div className="text-slate-400 text-[11px] truncate">
                                    {loc.baris} {loc.keterangan ? `• ${loc.keterangan}` : ''}
                                  </div>
                                </div>
                                {locators.length > 1 && (
                                  <button
                                    onClick={() => onDeleteLocator(loc.id)}
                                    className="text-slate-600 hover:text-rose-400 p-1 shrink-0 transition-colors"
                                    title="Hapus Locator"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL SKU */}
      {showAddSkuModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-1">Tambah Varian Master SKU Baru</h3>
            <p className="text-xs text-slate-400 mb-4">
              Item ini akan otomatis tersedia dalam pilihan dropdown dependant opname.
            </p>

            <form onSubmit={handleSaveManualSku} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Motif Keramik *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Carrara Bianco"
                    value={newSku.motif}
                    onChange={(e) => setNewSku({ ...newSku, motif: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Warna *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Putih"
                    value={newSku.warna}
                    onChange={(e) => setNewSku({ ...newSku, warna: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Surface (Permukaan) *</label>
                  <select
                    value={newSku.surface}
                    onChange={(e) => setNewSku({ ...newSku, surface: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Glossy">Glossy</option>
                    <option value="Polished">Polished</option>
                    <option value="Matte">Matte</option>
                    <option value="Rustic">Rustic</option>
                    <option value="Satin">Satin</option>
                    <option value="Carving">Carving</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Grade (Kualitas) *</label>
                  <select
                    value={newSku.grade}
                    onChange={(e) => setNewSku({ ...newSku, grade: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Grade 1 (KW1)">Grade 1 (KW1)</option>
                    <option value="Grade 2 (KW2)">Grade 2 (KW2)</option>
                    <option value="Grade 3 (KW3)">Grade 3 (KW3)</option>
                    <option value="Afkir / Scrap">Afkir / Scrap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Tonality (Shade Seri) *</label>
                  <input
                    type="text"
                    placeholder="Contoh: T01, A02, 88A"
                    value={newSku.tonality}
                    onChange={(e) => setNewSku({ ...newSku, tonality: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Ukuran (cm) *</label>
                  <input
                    type="text"
                    placeholder="Contoh: 60x60, 50x50, 60x120"
                    value={newSku.ukuran}
                    onChange={(e) => setNewSku({ ...newSku, ukuran: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Kode SKU (Opsional)</label>
                <input
                  type="text"
                  placeholder="Auto generated jika kosong"
                  value={newSku.skuCode}
                  onChange={(e) => setNewSku({ ...newSku, skuCode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSkuModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Simpan SKU ke Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD LOCATOR */}
      {showAddLocModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-1">Tambah Locator / Baris Rak</h3>
            <p className="text-xs text-slate-400 mb-4">
              Tambahkan posisi baris penyimpanan baru untuk stock opname.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newLocCode.trim()) return;
                onAddLocator(newLocSubIoId, newLocCode.trim().toUpperCase(), newLocBaris.trim() || `Baris ${newLocCode.trim()}`, newLocKet.trim());
                setShowAddLocModal(false);
                setNewLocCode('');
                setNewLocBaris('');
                setNewLocKet('');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-slate-300 mb-1">Sub-IO (Blok Gudang) *</label>
                <select
                  value={newLocSubIoId}
                  onChange={(e) => setNewLocSubIoId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {subIos.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Kode Locator (Wajib) *</label>
                <input
                  type="text"
                  placeholder="Contoh: B-04-01"
                  value={newLocCode}
                  onChange={(e) => setNewLocCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Posisi Baris / Rak</label>
                <input
                  type="text"
                  placeholder="Contoh: Baris 04 - Rak Heavy Pallet 1-6"
                  value={newLocBaris}
                  onChange={(e) => setNewLocBaris(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Pallet 1-6 atau Area Retur"
                  value={newLocKet}
                  onChange={(e) => setNewLocKet(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLocModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Simpan Locator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
