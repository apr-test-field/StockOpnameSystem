import React, { useState, useMemo, useEffect } from 'react';
import { MasterSKU, OpnameRecord } from '../types';
import { 
  Plus, 
  Minus, 
  Check, 
  RotateCcw, 
  Sparkles, 
  PackageCheck, 
  Layers, 
  Palette, 
  Sun, 
  ShieldCheck, 
  Hash, 
  Maximize2,
  FileText,
  AlertCircle,
  MapPin
} from 'lucide-react';

interface OpnameInputFormProps {
  masterSKUs: MasterSKU[];
  currentLocatorCode: string;
  currentLocatorId: string;
  currentSubIoId: string;
  currentSubIoName: string;
  currentIoId: string;
  currentIoName: string;
  auditor: string;
  onSaveRecord: (record: Omit<OpnameRecord, 'id' | 'timestamp'>) => void;
  onOpenMasterTab: () => void;
}

export const OpnameInputForm: React.FC<OpnameInputFormProps> = ({
  masterSKUs,
  currentLocatorCode,
  currentLocatorId,
  currentSubIoId,
  currentSubIoName,
  currentIoId,
  currentIoName,
  auditor,
  onSaveRecord,
  onOpenMasterTab,
}) => {
  // Cascading selections
  const [selectedMotif, setSelectedMotif] = useState<string>('');
  const [selectedWarna, setSelectedWarna] = useState<string>('');
  const [selectedSurface, setSelectedSurface] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedTonality, setSelectedTonality] = useState<string>('');
  const [selectedUkuran, setSelectedUkuran] = useState<string>('');

  // Quantities
  const [qtyBaik, setQtyBaik] = useState<number>(0);
  const [qtyPecah, setQtyPecah] = useState<number>(0);
  const [satuan, setSatuan] = useState<string>('DUS');
  const [catatan, setCatatan] = useState<string>('');

  // UI feedback
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Available Motifs (All unique motifs in Master SKU)
  const availableMotifs = useMemo(() => {
    const set = new Set<string>();
    masterSKUs.forEach((sku) => {
      if (sku.motif) set.add(sku.motif);
    });
    return Array.from(set).sort();
  }, [masterSKUs]);

  // 2. Available Warnas (Filtered by selectedMotif)
  const availableWarnas = useMemo(() => {
    if (!selectedMotif) return [];
    const set = new Set<string>();
    masterSKUs
      .filter((sku) => sku.motif === selectedMotif)
      .forEach((sku) => {
        if (sku.warna) set.add(sku.warna);
      });
    return Array.from(set).sort();
  }, [masterSKUs, selectedMotif]);

  // Auto-select or validate Warna when Motif changes
  useEffect(() => {
    if (!selectedMotif) {
      setSelectedWarna('');
      return;
    }
    if (availableWarnas.length === 1) {
      setSelectedWarna(availableWarnas[0]);
    } else if (selectedWarna && !availableWarnas.includes(selectedWarna)) {
      setSelectedWarna('');
    }
  }, [selectedMotif, availableWarnas]);

  // 3. Available Surfaces (Filtered by selectedMotif & selectedWarna)
  const availableSurfaces = useMemo(() => {
    if (!selectedMotif || !selectedWarna) return [];
    const set = new Set<string>();
    masterSKUs
      .filter((sku) => sku.motif === selectedMotif && sku.warna === selectedWarna)
      .forEach((sku) => {
        if (sku.surface) set.add(sku.surface);
      });
    return Array.from(set).sort();
  }, [masterSKUs, selectedMotif, selectedWarna]);

  // Auto-select or validate Surface
  useEffect(() => {
    if (!selectedWarna) {
      setSelectedSurface('');
      return;
    }
    if (availableSurfaces.length === 1) {
      setSelectedSurface(availableSurfaces[0]);
    } else if (selectedSurface && !availableSurfaces.includes(selectedSurface)) {
      setSelectedSurface('');
    }
  }, [selectedWarna, availableSurfaces]);

  // 4. Available Grades (Filtered by selectedMotif, selectedWarna, selectedSurface)
  const availableGrades = useMemo(() => {
    if (!selectedMotif || !selectedWarna || !selectedSurface) return [];
    const set = new Set<string>();
    masterSKUs
      .filter(
        (sku) =>
          sku.motif === selectedMotif &&
          sku.warna === selectedWarna &&
          sku.surface === selectedSurface
      )
      .forEach((sku) => {
        if (sku.grade) set.add(sku.grade);
      });
    return Array.from(set).sort();
  }, [masterSKUs, selectedMotif, selectedWarna, selectedSurface]);

  // Auto-select or validate Grade
  useEffect(() => {
    if (!selectedSurface) {
      setSelectedGrade('');
      return;
    }
    if (availableGrades.length === 1) {
      setSelectedGrade(availableGrades[0]);
    } else if (selectedGrade && !availableGrades.includes(selectedGrade)) {
      setSelectedGrade('');
    }
  }, [selectedSurface, availableGrades]);

  // 5. Available Tonalities (Filtered by Motif, Warna, Surface, Grade)
  const availableTonalities = useMemo(() => {
    if (!selectedMotif || !selectedWarna || !selectedSurface || !selectedGrade) return [];
    const set = new Set<string>();
    masterSKUs
      .filter(
        (sku) =>
          sku.motif === selectedMotif &&
          sku.warna === selectedWarna &&
          sku.surface === selectedSurface &&
          sku.grade === selectedGrade
      )
      .forEach((sku) => {
        if (sku.tonality) set.add(sku.tonality);
      });
    return Array.from(set).sort();
  }, [masterSKUs, selectedMotif, selectedWarna, selectedSurface, selectedGrade]);

  // Auto-select or validate Tonality
  useEffect(() => {
    if (!selectedGrade) {
      setSelectedTonality('');
      return;
    }
    if (availableTonalities.length === 1) {
      setSelectedTonality(availableTonalities[0]);
    } else if (selectedTonality && !availableTonalities.includes(selectedTonality)) {
      setSelectedTonality('');
    }
  }, [selectedGrade, availableTonalities]);

  // 6. Available Ukurans (Filtered by Motif, Warna, Surface, Grade, Tonality)
  const availableUkurans = useMemo(() => {
    if (!selectedMotif || !selectedWarna || !selectedSurface || !selectedGrade || !selectedTonality) {
      return [];
    }
    const set = new Set<string>();
    masterSKUs
      .filter(
        (sku) =>
          sku.motif === selectedMotif &&
          sku.warna === selectedWarna &&
          sku.surface === selectedSurface &&
          sku.grade === selectedGrade &&
          sku.tonality === selectedTonality
      )
      .forEach((sku) => {
        if (sku.ukuran) set.add(sku.ukuran);
      });
    return Array.from(set).sort();
  }, [masterSKUs, selectedMotif, selectedWarna, selectedSurface, selectedGrade, selectedTonality]);

  // Auto-select or validate Ukuran
  useEffect(() => {
    if (!selectedTonality) {
      setSelectedUkuran('');
      return;
    }
    if (availableUkurans.length === 1) {
      setSelectedUkuran(availableUkurans[0]);
    } else if (selectedUkuran && !availableUkurans.includes(selectedUkuran)) {
      setSelectedUkuran('');
    }
  }, [selectedTonality, availableUkurans]);

  // Find currently matched Master SKU
  const matchedMasterSKU = useMemo(() => {
    if (
      selectedMotif &&
      selectedWarna &&
      selectedSurface &&
      selectedGrade &&
      selectedTonality &&
      selectedUkuran
    ) {
      return masterSKUs.find(
        (sku) =>
          sku.motif === selectedMotif &&
          sku.warna === selectedWarna &&
          sku.surface === selectedSurface &&
          sku.grade === selectedGrade &&
          sku.tonality === selectedTonality &&
          sku.ukuran === selectedUkuran
      );
    }
    return null;
  }, [
    masterSKUs,
    selectedMotif,
    selectedWarna,
    selectedSurface,
    selectedGrade,
    selectedTonality,
    selectedUkuran,
  ]);

  // Sync unit with matched SKU
  useEffect(() => {
    if (matchedMasterSKU?.satuan) {
      setSatuan(matchedMasterSKU.satuan);
    }
  }, [matchedMasterSKU]);

  // Reset all dropdowns
  const handleResetSelections = () => {
    setSelectedMotif('');
    setSelectedWarna('');
    setSelectedSurface('');
    setSelectedGrade('');
    setSelectedTonality('');
    setSelectedUkuran('');
    setQtyBaik(0);
    setQtyPecah(0);
    setCatatan('');
    setValidationError(null);
  };

  // Quantity Stepper Helpers
  const stepQty = (type: 'baik' | 'pecah', delta: number) => {
    if (type === 'baik') {
      setQtyBaik((prev) => Math.max(0, prev + delta));
    } else {
      setQtyPecah((prev) => Math.max(0, prev + delta));
    }
  };

  // Handle Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!selectedMotif) {
      setValidationError('Pilih Motif keramik terlebih dahulu.');
      return;
    }
    if (!selectedWarna) {
      setValidationError('Pilih Warna keramik.');
      return;
    }
    if (!selectedSurface) {
      setValidationError('Pilih Surface (permukaan) keramik.');
      return;
    }
    if (!selectedGrade) {
      setValidationError('Pilih Grade keramik.');
      return;
    }
    if (!selectedTonality) {
      setValidationError('Pilih Tonality (shading pembakaran).');
      return;
    }
    if (!selectedUkuran) {
      setValidationError('Pilih Ukuran keramik.');
      return;
    }
    if (qtyBaik <= 0 && qtyPecah <= 0) {
      setValidationError('Masukkan jumlah (Qty Baik atau Qty Pecah minimal 1 dus).');
      return;
    }

    onSaveRecord({
      auditor: auditor || 'Petugas Gudang',
      ioId: currentIoId,
      ioName: currentIoName,
      subIoId: currentSubIoId,
      subIoName: currentSubIoName,
      locatorId: currentLocatorId,
      locatorCode: currentLocatorCode,
      skuId: matchedMasterSKU?.id,
      motif: selectedMotif,
      warna: selectedWarna,
      surface: selectedSurface,
      grade: selectedGrade,
      tonality: selectedTonality,
      ukuran: selectedUkuran,
      qtyBaik,
      qtyPecah,
      satuan: satuan || 'DUS',
      catatan: catatan.trim(),
    });

    // Show toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2500);

    // Reset quantities & notes for the next entry
    setQtyBaik(0);
    setQtyPecah(0);
    setCatatan('');
  };

  const isFormComplete =
    Boolean(
      selectedMotif &&
      selectedWarna &&
      selectedSurface &&
      selectedGrade &&
      selectedTonality &&
      selectedUkuran
    );

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm text-white relative">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="absolute top-4 right-4 z-20 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" /> Item berhasil disimpan ke locator {currentLocatorCode}!
        </div>
      )}

      {/* Header Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 sm:mt-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span>Form Input Opname Fisik</span>
              <span className="text-[11px] sm:text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap">
                {currentLocatorCode}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
              Pilihan bertingkat (dependant) mengikuti database Master SKU
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetSelections}
          className="self-end sm:self-auto text-xs text-slate-400 hover:text-amber-400 active:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors px-2.5 py-1.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 touch-manipulation flex-shrink-0"
          title="Reset semua pilihan dropdown"
        >
          <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="whitespace-nowrap">Reset Dropdown</span>
        </button>
      </div>

      {/* Warning if Master SKU is empty */}
      {masterSKUs.length === 0 && (
        <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>Database Master SKU masih kosong! Harap import file Excel terlebih dahulu.</span>
          </div>
          <button
            onClick={onOpenMasterTab}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
          >
            Import Excel
          </button>
        </div>
      )}

      {validationError && (
        <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* UNIFIED INPUT FIELD: IDENTIFIKASI PRODUK & JUMLAH FISIK */}
        <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800/90 space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Identifikasi Produk & Hitung Fisik
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. Motif */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Motif Keramik *</span>
                <span className="text-[10px] text-slate-500">({availableMotifs.length} opsi)</span>
              </label>
              <select
                id="select-motif"
                value={selectedMotif}
                onChange={(e) => setSelectedMotif(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium"
                required
              >
                <option value="">-- Pilih Motif --</option>
                {availableMotifs.map((motif) => (
                  <option key={motif} value={motif}>
                    {motif}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Warna */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Warna *</span>
                {selectedMotif && (
                  <span className="text-[10px] text-slate-500">({availableWarnas.length} opsi)</span>
                )}
              </label>
              <select
                id="select-warna"
                value={selectedWarna}
                onChange={(e) => setSelectedWarna(e.target.value)}
                disabled={!selectedMotif}
                className="w-full bg-slate-800 disabled:bg-slate-900/60 disabled:text-slate-600 disabled:border-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium"
                required
              >
                <option value="">
                  {!selectedMotif ? '-- Pilih Motif Dulu --' : '-- Pilih Warna --'}
                </option>
                {availableWarnas.map((warna) => (
                  <option key={warna} value={warna}>
                    {warna}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Surface */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Surface (Permukaan) *</span>
                {selectedWarna && (
                  <span className="text-[10px] text-slate-500">({availableSurfaces.length} opsi)</span>
                )}
              </label>
              <select
                id="select-surface"
                value={selectedSurface}
                onChange={(e) => setSelectedSurface(e.target.value)}
                disabled={!selectedWarna}
                className="w-full bg-slate-800 disabled:bg-slate-900/60 disabled:text-slate-600 disabled:border-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium"
                required
              >
                <option value="">
                  {!selectedWarna ? '-- Pilih Warna Dulu --' : '-- Pilih Surface --'}
                </option>
                {availableSurfaces.map((surface) => (
                  <option key={surface} value={surface}>
                    {surface}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Grade */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Grade (Kualitas) *</span>
                {selectedSurface && (
                  <span className="text-[10px] text-slate-500">({availableGrades.length} opsi)</span>
                )}
              </label>
              <select
                id="select-grade"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                disabled={!selectedSurface}
                className="w-full bg-slate-800 disabled:bg-slate-900/60 disabled:text-slate-600 disabled:border-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-medium"
                required
              >
                <option value="">
                  {!selectedSurface ? '-- Pilih Surface Dulu --' : '-- Pilih Grade --'}
                </option>
                {availableGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Tonality */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>Tonality (Shade/Seri) *</span>
                {selectedGrade && (
                  <span className="text-[10px] text-slate-500">({availableTonalities.length} opsi)</span>
                )}
              </label>
              <select
                id="select-tonality"
                value={selectedTonality}
                onChange={(e) => setSelectedTonality(e.target.value)}
                disabled={!selectedGrade}
                className="w-full bg-slate-800 disabled:bg-slate-900/60 disabled:text-slate-600 disabled:border-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-mono font-medium"
                required
              >
                <option value="">
                  {!selectedGrade ? '-- Pilih Grade Dulu --' : '-- Pilih Tonality --'}
                </option>
                {availableTonalities.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Ukuran */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ukuran (cm) *</span>
                {selectedTonality && (
                  <span className="text-[10px] text-slate-500">({availableUkurans.length} opsi)</span>
                )}
              </label>
              <select
                id="select-ukuran"
                value={selectedUkuran}
                onChange={(e) => setSelectedUkuran(e.target.value)}
                disabled={!selectedTonality}
                className="w-full bg-slate-800 disabled:bg-slate-900/60 disabled:text-slate-600 disabled:border-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all font-mono font-medium"
                required
              >
                <option value="">
                  {!selectedTonality ? '-- Pilih Tonality Dulu --' : '-- Pilih Ukuran --'}
                </option>
                {availableUkurans.map((uk) => (
                  <option key={uk} value={uk}>
                    {uk} cm
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Matched SKU Badge */}
          {matchedMasterSKU && (
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-700/80 flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Kode SKU Master:</span>
                <span className="font-mono font-bold text-amber-300">
                  {matchedMasterSKU.skuCode || 'TERDAFTAR'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Satuan: <strong className="text-white font-mono">{matchedMasterSKU.satuan || 'DUS'}</strong></span>
              </div>
            </div>
          )}

          {/* Sub-section: Quantities & Manual Input */}
          <div className="pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Hitung Fisik Barang (Ketik Manual & Tombol +/-)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Satuan: Dus</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Qty Baik */}
            <div className="bg-slate-900/90 p-3.5 rounded-lg border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  QTY BAIK (Kondisi Bagus / Layak Jual)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Satuan: Dus</span>
              </div>

              {/* Main Stepper */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-minus-baik"
                  onClick={() => stepQty('baik', -1)}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 flex items-center justify-center text-slate-200 font-bold transition-all shadow-sm"
                  title="Kurang 1 Dus"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    id="input-qty-baik"
                    type="number"
                    min="0"
                    value={qtyBaik === 0 ? '' : qtyBaik}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQtyBaik(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-2 text-center text-xl font-mono font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">
                    Dus
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-plus-baik"
                  onClick={() => stepQty('baik', 1)}
                  className="w-10 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-white flex items-center justify-center font-bold transition-all shadow-sm"
                  title="Tambah 1 Dus"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Increment Pills */}
              <div className="flex items-center gap-1.5 mt-2 justify-end">
                <span className="text-[10px] text-slate-500 mr-1">Cepat:</span>
                {[5, 10, 20, 50].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => stepQty('baik', step)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 text-[11px] font-mono border border-slate-700/60"
                  >
                    +{step}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty Pecah */}
            <div className="bg-slate-900/90 p-3.5 rounded-lg border border-rose-500/30">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  QTY PECAH (Rusak / Retak / Cacat Fisik)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Satuan: Dus</span>
              </div>

              {/* Main Stepper */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-minus-pecah"
                  onClick={() => stepQty('pecah', -1)}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 flex items-center justify-center text-slate-200 font-bold transition-all shadow-sm"
                  title="Kurang 1 Dus Pecah"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    id="input-qty-pecah"
                    type="number"
                    min="0"
                    value={qtyPecah === 0 ? '' : qtyPecah}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQtyPecah(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-rose-500/40 rounded-lg px-3 py-2 text-center text-xl font-mono font-bold text-rose-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono pointer-events-none">
                    Dus
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-plus-pecah"
                  onClick={() => stepQty('pecah', 1)}
                  className="w-10 h-10 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-400 text-white flex items-center justify-center font-bold transition-all shadow-sm"
                  title="Tambah 1 Dus Pecah"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Increment Pills */}
              <div className="flex items-center gap-1.5 mt-2 justify-end">
                <span className="text-[10px] text-slate-500 mr-1">Cepat:</span>
                {[1, 2, 5, 10].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => stepQty('pecah', step)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 text-[11px] font-mono border border-slate-700/60"
                  >
                    +{step}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan Khusus (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Dus bawah basah, Pallet baris 2 miring, Kemasan sobek..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: SUBMIT ACTION BUTTON & TARGET LOCATOR NOTICE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pt-3 gap-3.5">
          <div className="flex items-center gap-3 bg-amber-950/40 border-2 border-amber-500/50 rounded-xl px-4 py-3 shadow-md">
            <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center flex-shrink-0 text-amber-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                <span>TARGET LOKASI PENYIMPANAN:</span>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300 drop-shadow-sm">
                  {currentLocatorCode}
                </span>
                <span className="text-xs sm:text-sm text-slate-300 font-semibold">
                  ({currentSubIoName})
                </span>
              </div>
              <div className="text-[11px] text-amber-300/90 font-medium mt-0.5">
                Pastikan posisi fisik Anda berada di rak locator ini sebelum menyimpan
              </div>
            </div>
          </div>

          <button
            id="btn-save-opname-item"
            type="submit"
            disabled={!isFormComplete || (qtyBaik === 0 && qtyPecah === 0)}
            className="w-full md:w-auto px-7 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 active:scale-98 text-slate-950 font-bold rounded-xl text-sm sm:text-base shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
          >
            <Check className="w-5 h-5" />
            <span>Simpan ke {currentSubIoName} {currentLocatorCode}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
