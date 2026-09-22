import * as XLSX from 'xlsx';
import { MasterSKU, OpnameRecord, LocationIO, LocationSubIO, Locator } from '../types';

/**
 * Normalizes header string to find matching field
 */
function normalizeHeader(h: string): string {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses an Excel or CSV file into MasterSKU records
 * Supports 'replace' (overwrite) or 'merge' (append/update existing)
 */
export async function importMasterSkuFromExcel(
  file: File,
  options?: {
    mode?: 'replace' | 'merge';
    existingSkus?: MasterSKU[];
  }
): Promise<{
  skus: MasterSKU[];
  errors: string[];
  totalRows: number;
  addedCount: number;
  updatedCount: number;
}> {
  const mode = options?.mode || 'replace';
  const existingSkus = options?.existingSkus || [];

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return resolve({
            skus: existingSkus,
            errors: ['File Excel tidak memiliki sheet yang dapat dibaca.'],
            totalRows: 0,
            addedCount: 0,
            updatedCount: 0,
          });
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          return resolve({
            skus: existingSkus,
            errors: ['File Excel kosong atau tidak memiliki baris data.'],
            totalRows: 0,
            addedCount: 0,
            updatedCount: 0,
          });
        }

        // Clone existing SKUs if merge mode, otherwise start fresh
        const workingSkus: MasterSKU[] = mode === 'merge' ? [...existingSkus] : [];
        const errors: string[] = [];
        let addedCount = 0;
        let updatedCount = 0;

        rawJson.forEach((row, index) => {
          const rowNumber = index + 2; // header is row 1

          // Map known variants of headers
          let motif = '';
          let warna = '';
          let surface = '';
          let grade = '';
          let tonality = '';
          let ukuran = '';
          let skuCode = '';
          let satuan = 'DUS';

          for (const key of Object.keys(row)) {
            const val = String(row[key] || '').trim();
            const normKey = normalizeHeader(key);

            if (normKey === 'motif' || normKey === 'namamotif' || normKey === 'pattern' || normKey === 'itemname') {
              motif = val;
            } else if (normKey === 'warna' || normKey === 'color' || normKey === 'colour') {
              warna = val;
            } else if (normKey === 'surface' || normKey === 'permukaan' || normKey === 'finish' || normKey === 'finishing') {
              surface = val;
            } else if (normKey === 'grade' || normKey === 'kualitas' || normKey === 'kw' || normKey === 'classtype') {
              grade = val;
            } else if (normKey === 'tonality' || normKey === 'tone' || normKey === 'shade' || normKey === 'shading' || normKey === 'seri') {
              tonality = val;
            } else if (normKey === 'ukuran' || normKey === 'size' || normKey === 'dimension' || normKey === 'dimensi') {
              ukuran = val;
            } else if (normKey === 'skucode' || normKey === 'kode' || normKey === 'kodesku' || normKey === 'itemcode' || normKey === 'barcode') {
              skuCode = val;
            } else if (normKey === 'satuan' || normKey === 'unit' || normKey === 'uom') {
              if (val) satuan = val.toUpperCase();
            }
          }

          // Validation
          if (!motif && !warna && !ukuran) {
            // Ignore completely empty row
            return;
          }

          if (!motif || !warna || !surface || !grade || !tonality || !ukuran) {
            errors.push(
              `Baris ${rowNumber}: Kolom wajib belum lengkap (Motif: "${motif}", Warna: "${warna}", Surface: "${surface}", Grade: "${grade}", Tonality: "${tonality}", Ukuran: "${ukuran}").`
            );
            return;
          }

          const generatedSkuCode = skuCode || `SKU-${motif.slice(0, 3).toUpperCase()}-${ukuran}-${tonality}`;

          // If merge mode, check if exact SKU already exists by skuCode or by combination (motif+warna+surface+grade+tonality+ukuran)
          if (mode === 'merge') {
            const existingIndex = workingSkus.findIndex(
              (item) =>
                (skuCode && item.skuCode && item.skuCode.toLowerCase() === skuCode.toLowerCase()) ||
                (item.motif.toLowerCase() === motif.toLowerCase() &&
                  item.warna.toLowerCase() === warna.toLowerCase() &&
                  item.surface.toLowerCase() === surface.toLowerCase() &&
                  item.grade.toLowerCase() === grade.toLowerCase() &&
                  item.tonality.toLowerCase() === tonality.toLowerCase() &&
                  item.ukuran.toLowerCase() === ukuran.toLowerCase())
            );

            if (existingIndex >= 0) {
              // Update existing
              workingSkus[existingIndex] = {
                ...workingSkus[existingIndex],
                skuCode: skuCode || workingSkus[existingIndex].skuCode || generatedSkuCode,
                satuan: satuan || workingSkus[existingIndex].satuan || 'DUS',
              };
              updatedCount++;
            } else {
              // Insert new
              workingSkus.push({
                id: `sku-import-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
                skuCode: generatedSkuCode,
                motif,
                warna,
                surface,
                grade,
                tonality,
                ukuran,
                satuan,
              });
              addedCount++;
            }
          } else {
            // Replace mode: direct push
            workingSkus.push({
              id: `sku-import-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
              skuCode: generatedSkuCode,
              motif,
              warna,
              surface,
              grade,
              tonality,
              ukuran,
              satuan,
            });
            addedCount++;
          }
        });

        resolve({
          skus: workingSkus,
          errors,
          totalRows: rawJson.length,
          addedCount,
          updatedCount,
        });
      } catch (err: any) {
        reject(new Error(`Gagal memproses file Excel: ${err.message || err}`));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari sistem.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a template Excel for Master SKU
 */
export function exportMasterSkuTemplate() {
  const sampleData = [
    {
      'SKU Code': 'KRM-CRB-6060-GL-G1-T01',
      Motif: 'Carrara Bianco',
      Warna: 'Putih',
      Surface: 'Glossy',
      Grade: 'Grade 1 (KW1)',
      Tonality: 'T01',
      Ukuran: '60x60',
      Satuan: 'DUS',
    },
    {
      'SKU Code': 'KRM-CRB-6060-GL-G1-T02',
      Motif: 'Carrara Bianco',
      Warna: 'Putih',
      Surface: 'Glossy',
      Grade: 'Grade 1 (KW1)',
      Tonality: 'T02',
      Ukuran: '60x60',
      Satuan: 'DUS',
    },
    {
      'SKU Code': 'KRM-MRQ-6060-POL-G1-B01',
      Motif: 'Marquina Nero',
      Warna: 'Hitam',
      Surface: 'Polished',
      Grade: 'Grade 1 (KW1)',
      Tonality: 'B01',
      Ukuran: '60x60',
      Satuan: 'DUS',
    },
    {
      'SKU Code': 'KRM-TRV-5050-MAT-G1-88A',
      Motif: 'Travertine Classic',
      Warna: 'Beige',
      Surface: 'Matte',
      Grade: 'Grade 1 (KW1)',
      Tonality: '88A',
      Ukuran: '50x50',
      Satuan: 'DUS',
    },
    {
      'SKU Code': 'KRM-BTN-4040-RST-G1-T01',
      Motif: 'Beton Grey',
      Warna: 'Abu-abu',
      Surface: 'Rustic',
      Grade: 'Grade 1 (KW1)',
      Tonality: 'T01',
      Ukuran: '40x40',
      Satuan: 'DUS',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 26 }, // SKU Code
    { wch: 20 }, // Motif
    { wch: 16 }, // Warna
    { wch: 14 }, // Surface
    { wch: 18 }, // Grade
    { wch: 12 }, // Tonality
    { wch: 12 }, // Ukuran
    { wch: 10 }, // Satuan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master SKU');

  const fileName = `Template_Master_SKU_Keramik_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports opname records to a formatted multi-sheet Excel file
 */
export function exportOpnameToExcel(
  records: OpnameRecord[],
  options?: {
    scopeName?: string;
    auditorName?: string;
  }
) {
  if (records.length === 0) {
    alert('Tidak ada data opname yang dapat diekspor.');
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // 1. Data Detail Rows
  const detailRows = records.map((rec, idx) => {
    const recDate = new Date(rec.timestamp);
    const formattedDate = `${recDate.toLocaleDateString('id-ID')} ${recDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    return {
      No: idx + 1,
      'Waktu Opname': formattedDate,
      'Inventory Org (IO)': rec.ioName,
      'Sub-IO (Blok)': rec.subIoName,
      'Locator (Baris)': rec.locatorCode,
      Motif: rec.motif,
      Warna: rec.warna,
      Surface: rec.surface,
      Grade: rec.grade,
      Tonality: rec.tonality,
      Ukuran: rec.ukuran,
      'Qty Baik (Dus)': rec.qtyBaik,
      'Qty Pecah (Dus)': rec.qtyPecah,
      'Total Qty (Dus)': rec.qtyBaik + rec.qtyPecah,
      Satuan: rec.satuan || 'DUS',
      'Auditor / Petugas': rec.auditor || 'Admin Gudang',
      Catatan: rec.catatan || '-',
    };
  });

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);

  // Set widths
  detailSheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Waktu Opname
    { wch: 25 }, // IO
    { wch: 28 }, // Sub-IO
    { wch: 16 }, // Locator
    { wch: 20 }, // Motif
    { wch: 16 }, // Warna
    { wch: 14 }, // Surface
    { wch: 18 }, // Grade
    { wch: 12 }, // Tonality
    { wch: 12 }, // Ukuran
    { wch: 16 }, // Qty Baik
    { wch: 16 }, // Qty Pecah
    { wch: 16 }, // Total Qty
    { wch: 10 }, // Satuan
    { wch: 20 }, // Auditor
    { wch: 25 }, // Catatan
  ];

  // 2. Rekap per Locator
  const locatorMap: { [locCode: string]: { subIo: string; count: number; baik: number; pecah: number } } = {};
  records.forEach((rec) => {
    if (!locatorMap[rec.locatorCode]) {
      locatorMap[rec.locatorCode] = { subIo: rec.subIoName, count: 0, baik: 0, pecah: 0 };
    }
    locatorMap[rec.locatorCode].count += 1;
    locatorMap[rec.locatorCode].baik += rec.qtyBaik;
    locatorMap[rec.locatorCode].pecah += rec.qtyPecah;
  });

  const locatorSummaryRows = Object.keys(locatorMap)
    .sort()
    .map((locCode, idx) => ({
      No: idx + 1,
      'Locator (Baris)': locCode,
      'Sub-IO (Blok)': locatorMap[locCode].subIo,
      'Total Baris Item (SKU)': locatorMap[locCode].count,
      'Total Qty Baik (Dus)': locatorMap[locCode].baik,
      'Total Qty Pecah (Dus)': locatorMap[locCode].pecah,
      'Grand Total Qty (Dus)': locatorMap[locCode].baik + locatorMap[locCode].pecah,
    }));

  const locatorSheet = XLSX.utils.json_to_sheet(locatorSummaryRows);
  locatorSheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
  ];

  // 3. Rekap per Motif & Grade
  const motifGradeMap: { [key: string]: { motif: string; grade: string; baik: number; pecah: number } } = {};
  records.forEach((rec) => {
    const key = `${rec.motif}__${rec.grade}`;
    if (!motifGradeMap[key]) {
      motifGradeMap[key] = { motif: rec.motif, grade: rec.grade, baik: 0, pecah: 0 };
    }
    motifGradeMap[key].baik += rec.qtyBaik;
    motifGradeMap[key].pecah += rec.qtyPecah;
  });

  const motifSummaryRows = Object.values(motifGradeMap).map((m, idx) => ({
    No: idx + 1,
    Motif: m.motif,
    Grade: m.grade,
    'Qty Baik (Dus)': m.baik,
    'Qty Pecah (Dus)': m.pecah,
    'Total (Dus)': m.baik + m.pecah,
  }));

  const motifSheet = XLSX.utils.json_to_sheet(motifSummaryRows);
  motifSheet['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

  // Build Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail Opname');
  XLSX.utils.book_append_sheet(workbook, locatorSheet, 'Rekap per Locator');
  XLSX.utils.book_append_sheet(workbook, motifSheet, 'Rekap per Motif');

  const scopeSuffix = options?.scopeName ? `_${options.scopeName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const fileName = `Hasil_Stock_Opname_Keramik${scopeSuffix}_${dateStr}_${timeStr.replace(':', '.')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export interface LocationImportResult {
  ios: LocationIO[];
  subIos: LocationSubIO[];
  locators: Locator[];
  errors: string[];
  totalRows: number;
  addedLocatorsCount: number;
  newIosCount: number;
  newSubIosCount: number;
}

/**
 * Parses an Excel or CSV file containing location hierarchy
 * (IO -> Sub-IO -> Locator)
 */
export async function importLocationHierarchyFromExcel(
  file: File,
  existingIos: LocationIO[],
  existingSubIos: LocationSubIO[],
  existingLocators: Locator[],
  mode: 'replace' | 'merge' = 'replace'
): Promise<LocationImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return resolve({
            ios: existingIos,
            subIos: existingSubIos,
            locators: existingLocators,
            errors: ['File Excel tidak memiliki sheet yang dapat dibaca.'],
            totalRows: 0,
            addedLocatorsCount: 0,
            newIosCount: 0,
            newSubIosCount: 0,
          });
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          return resolve({
            ios: existingIos,
            subIos: existingSubIos,
            locators: existingLocators,
            errors: ['File Excel kosong atau tidak memiliki baris data.'],
            totalRows: 0,
            addedLocatorsCount: 0,
            newIosCount: 0,
            newSubIosCount: 0,
          });
        }

        // Initialize collections based on mode
        const workingIos: LocationIO[] = mode === 'merge' ? [...existingIos] : [];
        const workingSubIos: LocationSubIO[] = mode === 'merge' ? [...existingSubIos] : [];
        const workingLocators: Locator[] = mode === 'merge' ? [...existingLocators] : [];

        let newIosCount = 0;
        let newSubIosCount = 0;
        let addedLocatorsCount = 0;
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          const rowNumber = index + 2;

          let ioCode = '';
          let ioName = '';
          let ioDesc = '';
          let subIoCode = '';
          let subIoName = '';
          let subIoDesc = '';
          let locatorCode = '';
          let baris = '';
          let keterangan = '';

          for (const key of Object.keys(row)) {
            const val = String(row[key] || '').trim();
            const normKey = normalizeHeader(key);

            if (normKey === 'kodeio' || normKey === 'iocode' || normKey === 'io' || normKey === 'kodedivisi') {
              ioCode = val;
            } else if (normKey === 'namaio' || normKey === 'ioname' || normKey === 'organisasigudang' || normKey === 'namagudang') {
              ioName = val;
            } else if (normKey === 'deskripsiio' || normKey === 'keteranganio' || normKey === 'iodescription') {
              ioDesc = val;
            } else if (normKey === 'kodesubio' || normKey === 'subiocode' || normKey === 'subio' || normKey === 'kodeblok' || normKey === 'blok') {
              subIoCode = val;
            } else if (normKey === 'namasubio' || normKey === 'subioname' || normKey === 'namablok' || normKey === 'blokname' || normKey === 'zonagudang') {
              subIoName = val;
            } else if (normKey === 'deskripsisubio' || normKey === 'keterangansubio' || normKey === 'deskripsiblok') {
              subIoDesc = val;
            } else if (normKey === 'kodelocator' || normKey === 'locatorcode' || normKey === 'locator' || normKey === 'kodelokasi' || normKey === 'lokasi') {
              locatorCode = val;
            } else if (normKey === 'posisibaris' || normKey === 'baris' || normKey === 'rak' || normKey === 'posisi' || normKey === 'rakbaris') {
              baris = val;
            } else if (normKey === 'keterangan' || normKey === 'deskripsilocator' || normKey === 'keteranganlocator' || normKey === 'notes' || normKey === 'catatan') {
              keterangan = val;
            }
          }

          // If row is entirely empty, ignore
          if (!ioCode && !subIoCode && !locatorCode && !baris) {
            return;
          }

          // Validate required Locator Code
          if (!locatorCode) {
            errors.push(`Baris ${rowNumber}: Kolom "Kode Locator" tidak boleh kosong.`);
            return;
          }

          // Fallbacks for IO
          if (!ioCode && !ioName) {
            ioCode = 'IO-GBJ';
            ioName = 'Gudang Barang Jadi (FG)';
          } else if (!ioCode && ioName) {
            ioCode = ioName.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
          } else if (ioCode && !ioName) {
            ioName = ioCode;
          }

          // Fallbacks for Sub-IO
          if (!subIoCode && !subIoName) {
            // Extract from locator code prefix if possible (e.g., A-01-01 -> BLOK-A)
            const prefixMatch = locatorCode.match(/^([A-Za-z0-9]+)[-_]/);
            const prefix = prefixMatch ? prefixMatch[1].toUpperCase() : 'BLOK-1';
            subIoCode = `BLOK-${prefix}`;
            subIoName = `Blok ${prefix}`;
          } else if (!subIoCode && subIoName) {
            subIoCode = subIoName.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '');
          } else if (subIoCode && !subIoName) {
            subIoName = subIoCode;
          }

          // Fallbacks for Baris
          if (!baris) {
            baris = `Baris ${locatorCode}`;
          }

          // 1. Resolve or create IO
          let matchedIo = workingIos.find(
            (i) => i.code.toLowerCase() === ioCode.toLowerCase() || i.name.toLowerCase() === ioName.toLowerCase()
          );

          if (!matchedIo) {
            const cleanId = `io-${ioCode.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;
            matchedIo = {
              id: cleanId,
              code: ioCode.toUpperCase(),
              name: ioName,
              description: ioDesc || `Organisasi Gudang ${ioCode}`,
            };
            workingIos.push(matchedIo);
            newIosCount++;
          } else if (ioDesc && !matchedIo.description) {
            matchedIo.description = ioDesc;
          }

          // 2. Resolve or create Sub-IO under this IO
          let matchedSubIo = workingSubIos.find(
            (s) =>
              s.ioId === matchedIo!.id &&
              (s.code.toLowerCase() === subIoCode.toLowerCase() || s.name.toLowerCase() === subIoName.toLowerCase())
          );

          if (!matchedSubIo) {
            const cleanSubId = `subio-${subIoCode.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}-${workingSubIos.length + 1}`;
            matchedSubIo = {
              id: cleanSubId,
              ioId: matchedIo.id,
              code: subIoCode.toUpperCase(),
              name: subIoName,
              description: subIoDesc || `Zona ${subIoName}`,
            };
            workingSubIos.push(matchedSubIo);
            newSubIosCount++;
          } else if (subIoDesc && !matchedSubIo.description) {
            matchedSubIo.description = subIoDesc;
          }

          // 3. Resolve or create Locator under this Sub-IO
          const existingLocIndex = workingLocators.findIndex(
            (l) => l.subIoId === matchedSubIo!.id && l.code.toLowerCase() === locatorCode.toLowerCase()
          );

          if (existingLocIndex >= 0) {
            // Update existing locator
            workingLocators[existingLocIndex] = {
              ...workingLocators[existingLocIndex],
              baris,
              keterangan: keterangan || workingLocators[existingLocIndex].keterangan,
            };
          } else {
            const cleanLocId = `loc-${locatorCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${workingLocators.length + 1}`;
            workingLocators.push({
              id: cleanLocId,
              subIoId: matchedSubIo.id,
              code: locatorCode.toUpperCase(),
              baris,
              keterangan: keterangan || 'Baris Penyimpanan',
              status: 'BELUM',
            });
            addedLocatorsCount++;
          }
        });

        resolve({
          ios: workingIos,
          subIos: workingSubIos,
          locators: workingLocators,
          errors,
          totalRows: rawJson.length,
          addedLocatorsCount,
          newIosCount,
          newSubIosCount,
        });
      } catch (err: any) {
        reject(new Error(`Gagal memproses file Excel: ${err.message || err}`));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari sistem.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Downloads a template Excel for Location Hierarchy (IO -> Sub-IO -> Locator)
 */
export function exportLocationHierarchyTemplate() {
  const sampleData = [
    {
      'Kode IO': 'IO-GBJ',
      'Nama IO': 'Gudang Barang Jadi (FG)',
      'Deskripsi IO': 'Penyimpanan utama produk keramik siap kirim',
      'Kode Sub-IO': 'BLOK-A',
      'Nama Sub-IO': 'Blok A (Standar 40x40 & 50x50)',
      'Deskripsi Sub-IO': 'Lantai 1 zona barat - keramik glazed lantai',
      'Kode Locator': 'A-01-01',
      'Posisi Baris': 'Baris 01 - Rak A',
      Keterangan: 'Pallet 1-4',
    },
    {
      'Kode IO': 'IO-GBJ',
      'Nama IO': 'Gudang Barang Jadi (FG)',
      'Deskripsi IO': 'Penyimpanan utama produk keramik siap kirim',
      'Kode Sub-IO': 'BLOK-A',
      'Nama Sub-IO': 'Blok A (Standar 40x40 & 50x50)',
      'Deskripsi Sub-IO': 'Lantai 1 zona barat - keramik glazed lantai',
      'Kode Locator': 'A-01-02',
      'Posisi Baris': 'Baris 01 - Rak B',
      Keterangan: 'Pallet 5-8',
    },
    {
      'Kode IO': 'IO-GBJ',
      'Nama IO': 'Gudang Barang Jadi (FG)',
      'Deskripsi IO': 'Penyimpanan utama produk keramik siap kirim',
      'Kode Sub-IO': 'BLOK-B',
      'Nama Sub-IO': 'Blok B (Granite Tile 60x60 & 80x80)',
      'Deskripsi Sub-IO': 'Lantai 1 zona timur - porselen & glazed tile',
      'Kode Locator': 'B-01-01',
      'Posisi Baris': 'Baris 01 - Racking Heavy',
      Keterangan: 'Pallet 1-6',
    },
    {
      'Kode IO': 'IO-GBJ',
      'Nama IO': 'Gudang Barang Jadi (FG)',
      'Deskripsi IO': 'Penyimpanan utama produk keramik siap kirim',
      'Kode Sub-IO': 'BLOK-B',
      'Nama Sub-IO': 'Blok B (Granite Tile 60x60 & 80x80)',
      'Deskripsi Sub-IO': 'Lantai 1 zona timur - porselen & glazed tile',
      'Kode Locator': 'B-01-02',
      'Posisi Baris': 'Baris 01 - Racking Heavy',
      Keterangan: 'Pallet 7-12',
    },
    {
      'Kode IO': 'IO-GBJ',
      'Nama IO': 'Gudang Barang Jadi (FG)',
      'Deskripsi IO': 'Penyimpanan utama produk keramik siap kirim',
      'Kode Sub-IO': 'BLOK-C',
      'Nama Sub-IO': 'Blok C (Big Slab 60x120 & Dinding)',
      'Deskripsi Sub-IO': 'Zona racking vertikal slab besar',
      'Kode Locator': 'C-01-01',
      'Posisi Baris': 'Baris A-Frame 01',
      Keterangan: 'Slab 60x120',
    },
    {
      'Kode IO': 'IO-PROD',
      'Nama IO': 'Stock Produksi (WIP / Sortir)',
      'Deskripsi IO': 'Area keluar kiln & line sortir sebelum packing final',
      'Kode Sub-IO': 'BLOK-SORTIR',
      'Nama Sub-IO': 'Blok Sortir & Re-Check',
      'Deskripsi Sub-IO': 'Line grading & sortir ulang',
      'Kode Locator': 'SORT-01',
      'Posisi Baris': 'Meja Sortir 01',
      Keterangan: 'Area QC KW2 & KW3',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 14 }, // Kode IO
    { wch: 28 }, // Nama IO
    { wch: 36 }, // Deskripsi IO
    { wch: 16 }, // Kode Sub-IO
    { wch: 32 }, // Nama Sub-IO
    { wch: 36 }, // Deskripsi Sub-IO
    { wch: 16 }, // Kode Locator
    { wch: 26 }, // Posisi Baris
    { wch: 24 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hierarki Lokasi');

  const fileName = `Template_Hierarki_Lokasi_Gudang_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports current Location Hierarchy to Excel
 */
export function exportLocationHierarchyToExcel(
  ios: LocationIO[],
  subIos: LocationSubIO[],
  locators: Locator[]
) {
  if (locators.length === 0) {
    alert('Tidak ada data lokasi untuk diekspor.');
    return;
  }

  const rows = locators.map((loc) => {
    const parentSub = subIos.find((s) => s.id === loc.subIoId);
    const parentIo = parentSub ? ios.find((i) => i.id === parentSub.ioId) : undefined;

    return {
      'Kode IO': parentIo?.code || 'IO-GBJ',
      'Nama IO': parentIo?.name || 'Gudang Barang Jadi',
      'Deskripsi IO': parentIo?.description || '',
      'Kode Sub-IO': parentSub?.code || 'BLOK-DEFAULT',
      'Nama Sub-IO': parentSub?.name || 'Blok Default',
      'Deskripsi Sub-IO': parentSub?.description || '',
      'Kode Locator': loc.code,
      'Posisi Baris': loc.baris,
      Keterangan: loc.keterangan || '',
      'Status Terakhir': loc.status || 'BELUM',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 32 },
    { wch: 16 },
    { wch: 30 },
    { wch: 32 },
    { wch: 16 },
    { wch: 26 },
    { wch: 24 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hierarki Lokasi');

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Master_Hierarki_Lokasi_Gudang_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
