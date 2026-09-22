export interface LocationIO {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface LocationSubIO {
  id: string;
  ioId: string;
  name: string;
  code: string;
  description: string;
}

export interface Locator {
  id: string;
  subIoId: string;
  code: string; // e.g. "A-01-01"
  baris: string; // Baris penyimpanan
  keterangan?: string;
  status?: 'BELUM' | 'PROSES' | 'SELESAI';
}

export interface MasterSKU {
  id: string;
  skuCode?: string;
  motif: string;
  warna: string;
  surface: string;
  grade: string;
  tonality: string;
  ukuran: string;
  satuan?: string; // 'DUS' | 'PCS' | 'M2'
}

export interface OpnameRecord {
  id: string;
  timestamp: string; // ISO date string
  auditor: string;
  ioId: string;
  ioName: string;
  subIoId: string;
  subIoName: string;
  locatorId: string;
  locatorCode: string;
  // SKU attributes
  skuId?: string;
  motif: string;
  warna: string;
  surface: string;
  grade: string;
  tonality: string;
  ukuran: string;
  // Quantities
  qtyBaik: number;
  qtyPecah: number;
  satuan: string;
  catatan?: string;
}

export type ActiveTab = 'opname' | 'results' | 'master';
