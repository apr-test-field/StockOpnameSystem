import React, { useState } from 'react';
import { OpnameRecord, Locator } from '../types';
import { 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Boxes,
  AlertCircle
} from 'lucide-react';

interface LocatorItemsListProps {
  currentLocator: Locator | undefined;
  records: OpnameRecord[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecordQty: (id: string, qtyBaik: number, qtyPecah: number, catatan?: string) => void;
  onToggleLocatorStatus: (locatorId: string) => void;
  onGoNextLocator: () => void;
  hasNextLocator: boolean;
}

export const LocatorItemsList: React.FC<LocatorItemsListProps> = ({
  currentLocator,
  records,
  onDeleteRecord,
  onUpdateRecordQty,
  onToggleLocatorStatus,
  onGoNextLocator,
  hasNextLocator,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editBaik, setEditBaik] = useState<number>(0);
  const [editPecah, setEditPecah] = useState<number>(0);
  const [editCatatan, setEditCatatan] = useState<string>('');

  if (!currentLocator) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center text-slate-400">
        Silakan pilih atau cari Locator di atas untuk melihat barang tercatat.
      </div>
    );
  }

  // Filter items in current locator
  const locatorRecords = records.filter((r) => r.locatorId === currentLocator.id);

  // Totals
  const totalBaik = locatorRecords.reduce((acc, r) => acc + r.qtyBaik, 0);
  const totalPecah = locatorRecords.reduce((acc, r) => acc + r.qtyPecah, 0);
  const grandTotal = totalBaik + totalPecah;

  const startEdit = (record: OpnameRecord) => {
    setEditingId(record.id);
    setEditBaik(record.qtyBaik);
    setEditPecah(record.qtyPecah);
    setEditCatatan(record.catatan || '');
  };

  const saveEdit = (id: string) => {
    onUpdateRecordQty(id, editBaik, editPecah, editCatatan);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm text-white">
      {/* Header List */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Daftar Barang Tercatat di Locator: <span className="font-mono text-amber-400">{currentLocator.code}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentLocator && (
            <button
              onClick={() => onToggleLocatorStatus(currentLocator.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentLocator.status === 'SELESAI'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {currentLocator.status === 'SELESAI' ? 'Status: Selesai' : 'Tandai Selesai'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Table / Empty State */}
      {locatorRecords.length === 0 ? (
        <div className="py-10 px-4 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Boxes className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-300">Belum ada barang diinput untuk locator ini</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Gunakan form input opname di atas dengan memilih motif, spesifikasi, dan jumlah dus fisik yang ada di baris <span className="font-mono text-amber-400">{currentLocator.code}</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">No</th>
                  <th className="py-2.5 px-3">Motif & Warna</th>
                  <th className="py-2.5 px-3">Surface</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Tonality</th>
                  <th className="py-2.5 px-3">Ukuran</th>
                  <th className="py-2.5 px-3 text-right">Qty Baik</th>
                  <th className="py-2.5 px-3 text-right">Qty Pecah</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3">Catatan</th>
                  <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-sans">
                {locatorRecords.map((item, idx) => {
                  const isEditing = editingId === item.id;
                  const itemTotal = item.qtyBaik + item.qtyPecah;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Motif & Warna */}
                      <td className="py-2.5 px-3 font-medium text-white">
                        <div>{item.motif}</div>
                        <div className="text-[11px] text-slate-400">{item.warna}</div>
                      </td>

                      {/* Surface */}
                      <td className="py-2.5 px-3 text-slate-300">{item.surface}</td>

                      {/* Grade */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.grade.toLowerCase().includes('grade 1') || item.grade.toLowerCase().includes('kw1')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.grade.toLowerCase().includes('grade 2') || item.grade.toLowerCase().includes('kw2')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.grade}
                        </span>
                      </td>

                      {/* Tonality */}
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {item.tonality}
                      </td>

                      {/* Ukuran */}
                      <td className="py-2.5 px-3 font-mono text-slate-300">{item.ukuran}</td>

                      {/* Qty Baik */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editBaik}
                            onChange={(e) => setEditBaik(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-16 bg-slate-950 border border-emerald-500 rounded px-1.5 py-0.5 text-right text-emerald-400 font-bold"
                          />
                        ) : (
                          <span className="font-bold text-emerald-400">
                            {item.qtyBaik.toLocaleString('id-ID')}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 ml-1">dus</span>
                      </td>

                      {/* Qty Pecah */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editPecah}
                            onChange={(e) => setEditPecah(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-16 bg-slate-950 border border-rose-500 rounded px-1.5 py-0.5 text-right text-rose-400 font-bold"
                          />
                        ) : (
                          <span className={item.qtyPecah > 0 ? 'font-bold text-rose-400' : 'text-slate-500'}>
                            {item.qtyPecah.toLocaleString('id-ID')}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 ml-1">dus</span>
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {isEditing ? (editBaik + editPecah).toLocaleString('id-ID') : itemTotal.toLocaleString('id-ID')}
                        <span className="text-[10px] text-slate-500 ml-1">dus</span>
                      </td>

                      {/* Catatan */}
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCatatan}
                            onChange={(e) => setEditCatatan(e.target.value)}
                            placeholder="Catatan..."
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                          />
                        ) : (
                          item.catatan || '-'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Simpan Perubahan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : deleteConfirmId === item.id ? (
                          <div className="flex items-center justify-center gap-1 bg-rose-950/90 p-0.5 rounded border border-rose-700/80 animate-in fade-in">
                            <span className="text-[10px] text-rose-300 font-bold px-1 whitespace-nowrap">Hapus?</span>
                            <button
                              onClick={() => {
                                onDeleteRecord(item.id);
                                setDeleteConfirmId(null);
                              }}
                              className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                              title="Ya, Hapus Sekarang"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                              title="Edit Jumlah Dus"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Hapus Baris Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Totals & Navigation */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400">Total Dus Baik: </span>
                <span className="font-bold text-emerald-400 text-sm">
                  {totalBaik.toLocaleString('id-ID')} Dus
                </span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400">Total Dus Pecah: </span>
                <span className="font-bold text-rose-400 text-sm">
                  {totalPecah.toLocaleString('id-ID')} Dus
                </span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400">Grand Total: </span>
                <span className="font-bold text-white text-sm">
                  {grandTotal.toLocaleString('id-ID')} Dus
                </span>
              </div>
            </div>

            {/* Move to next locator button */}
            {hasNextLocator && (
              <button
                onClick={onGoNextLocator}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg text-xs flex items-center gap-2 transition-all border border-amber-500/30 hover:border-amber-400"
              >
                <span>Lanjut ke Locator Berikutnya</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
