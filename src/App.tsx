import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, 
  LocationIO, 
  LocationSubIO, 
  Locator, 
  MasterSKU, 
  OpnameRecord 
} from './types';
import { 
  DEFAULT_IOS, 
  DEFAULT_SUB_IOS, 
  DEFAULT_LOCATORS, 
  DEFAULT_MASTER_SKUS 
} from './data/defaultMasterData';
import { Navbar } from './components/Navbar';
import { LocatorSelector } from './components/LocatorSelector';
import { OpnameInputForm } from './components/OpnameInputForm';
import { LocatorItemsList } from './components/LocatorItemsList';
import { OpnameResultsView } from './components/OpnameResultsView';
import { MasterSkuView } from './components/MasterSkuView';

const STORAGE_KEYS = {
  IOS: 'ceramix_ios_v1',
  SUB_IOS: 'ceramix_sub_ios_v1',
  LOCATORS: 'ceramix_locators_v1',
  MASTER_SKUS: 'ceramix_master_skus_v1',
  RECORDS: 'ceramix_records_v1',
  AUDITOR: 'ceramix_auditor_v1',
  ACTIVE_TAB: 'ceramix_active_tab_v1',
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) as ActiveTab) || 'opname';
  });

  // Master Data & Hierarchy States with localStorage persistence
  const [ios, setIos] = useState<LocationIO[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IOS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_IOS;
  });

  const [subIos, setSubIos] = useState<LocationSubIO[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUB_IOS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_SUB_IOS;
  });

  const [locators, setLocators] = useState<Locator[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCATORS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_LOCATORS;
  });

  const [masterSKUs, setMasterSKUs] = useState<MasterSKU[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MASTER_SKUS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_MASTER_SKUS;
  });

  const [records, setRecords] = useState<OpnameRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [auditor, setAuditor] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.AUDITOR) || 'Budi Santoso (Admin Gudang)';
  });

  // Selected Location State (IO -> Sub-IO -> Locator)
  const [selectedIoId, setSelectedIoId] = useState<string>(() => ios[0]?.id || 'io-gbj');
  const [selectedSubIoId, setSelectedSubIoId] = useState<string>(() => {
    const matched = subIos.find((s) => s.ioId === selectedIoId) || subIos[0];
    return matched ? matched.id : 'subio-a';
  });
  const [selectedLocatorId, setSelectedLocatorId] = useState<string>(() => {
    const matched = locators.find((l) => l.subIoId === selectedSubIoId) || locators[0];
    return matched ? matched.id : 'loc-a01-01';
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IOS, JSON.stringify(ios));
  }, [ios]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUB_IOS, JSON.stringify(subIos));
  }, [subIos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATORS, JSON.stringify(locators));
  }, [locators]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MASTER_SKUS, JSON.stringify(masterSKUs));
  }, [masterSKUs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDITOR, auditor);
  }, [auditor]);

  // Derived current location objects
  const currentIo = ios.find((i) => i.id === selectedIoId) || ios[0];
  const currentSubIo = subIos.find((s) => s.id === selectedSubIoId) || subIos[0];
  const currentLocator = locators.find((l) => l.id === selectedLocatorId) || locators[0];

  // Locator Stepper (Next locator in current Sub-IO)
  const subIoLocators = locators.filter((l) => l.subIoId === selectedSubIoId);
  const currentLocIndex = subIoLocators.findIndex((l) => l.id === selectedLocatorId);
  const hasNextLocator = currentLocIndex >= 0 && currentLocIndex < subIoLocators.length - 1;

  const handleGoNextLocator = () => {
    if (hasNextLocator) {
      setSelectedLocatorId(subIoLocators[currentLocIndex + 1].id);
    }
  };

  // Toggle Locator Status (SELESAI / PROSES)
  const handleToggleLocatorStatus = (locatorId: string) => {
    setLocators((prev) =>
      prev.map((l) => {
        if (l.id === locatorId) {
          const nextStatus = l.status === 'SELESAI' ? 'PROSES' : 'SELESAI';
          return { ...l, status: nextStatus };
        }
        return l;
      })
    );
  };

  // Add Opname Record
  const handleSaveRecord = (newRec: Omit<OpnameRecord, 'id' | 'timestamp'>) => {
    const record: OpnameRecord = {
      ...newRec,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    setRecords((prev) => [record, ...prev]);

    // Set locator status to PROSES if not already SELESAI
    setLocators((prev) =>
      prev.map((l) => {
        if (l.id === newRec.locatorId && l.status !== 'SELESAI') {
          return { ...l, status: 'PROSES' };
        }
        return l;
      })
    );
  };

  // Delete Opname Record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Update Record Qty
  const handleUpdateRecordQty = (id: string, qtyBaik: number, qtyPecah: number, catatan?: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, qtyBaik, qtyPecah, catatan: catatan !== undefined ? catatan : r.catatan };
        }
        return r;
      })
    );
  };

  // Clear All Records
  const handleClearAllRecords = () => {
    setRecords([]);
    setLocators((prev) => prev.map((l) => ({ ...l, status: 'BELUM' })));
  };

  // Add Locator dynamically
  const handleAddLocator = (subIoId: string, code: string, baris: string, keterangan?: string) => {
    const newLoc: Locator = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subIoId,
      code,
      baris,
      keterangan: keterangan || 'Baris Baru',
      status: 'BELUM',
    };
    setLocators((prev) => [...prev, newLoc]);
    setSelectedSubIoId(subIoId);
    setSelectedLocatorId(newLoc.id);
  };

  // Import Location Hierarchy from Excel
  const handleImportLocationHierarchy = (
    newIos: LocationIO[],
    newSubIos: LocationSubIO[],
    newLocators: Locator[]
  ) => {
    setIos(newIos);
    setSubIos(newSubIos);
    setLocators(newLocators);

    // Ensure selected pointers point to valid records
    if (newIos.length > 0) {
      const validIo = newIos.find((i) => i.id === selectedIoId) || newIos[0];
      setSelectedIoId(validIo.id);

      const matchingSub = newSubIos.find((s) => s.ioId === validIo.id) || newSubIos[0];
      if (matchingSub) {
        setSelectedSubIoId(matchingSub.id);
        const matchingLoc = newLocators.find((l) => l.subIoId === matchingSub.id) || newLocators[0];
        if (matchingLoc) {
          setSelectedLocatorId(matchingLoc.id);
        }
      }
    }
  };

  // Delete Locator
  const handleDeleteLocator = (id: string) => {
    setLocators((prev) => prev.filter((l) => l.id !== id));
    if (selectedLocatorId === id) {
      const remaining = locators.filter((l) => l.id !== id);
      if (remaining.length > 0) setSelectedLocatorId(remaining[0].id);
    }
  };

  // Select locator from other views (e.g. Results View)
  const handleJumpToLocator = (locatorId: string) => {
    const loc = locators.find((l) => l.id === locatorId);
    if (loc) {
      const sub = subIos.find((s) => s.id === loc.subIoId);
      if (sub) {
        setSelectedIoId(sub.ioId);
        setSelectedSubIoId(sub.id);
      }
      setSelectedLocatorId(loc.id);
      setActiveTab('opname');
    }
  };

  // Total stats for navbar
  const totalBaik = records.reduce((acc, r) => acc + r.qtyBaik, 0);
  const totalPecah = records.reduce((acc, r) => acc + r.qtyPecah, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        auditor={auditor}
        setAuditor={setAuditor}
        totalRecords={records.length}
        totalBaik={totalBaik}
        totalPecah={totalPecah}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: INPUT OPNAME (PER LOCATOR) */}
        {activeTab === 'opname' && (
          <div className="space-y-6">
            {/* 1. Location Hierarchy Selector (IO -> Sub-IO -> Locator) */}
            <LocatorSelector
              ios={ios}
              subIos={subIos}
              locators={locators}
              selectedIoId={selectedIoId}
              setSelectedIoId={setSelectedIoId}
              selectedSubIoId={selectedSubIoId}
              setSelectedSubIoId={setSelectedSubIoId}
              selectedLocatorId={selectedLocatorId}
              setSelectedLocatorId={setSelectedLocatorId}
              records={records}
              onToggleLocatorStatus={handleToggleLocatorStatus}
              onAddQuickLocator={handleAddLocator}
              onOpenLocationMaster={() => setActiveTab('master')}
            />

            {/* 2. Input Opname Form (Cascading Dropdowns & Steppers) */}
            <OpnameInputForm
              masterSKUs={masterSKUs}
              currentLocatorCode={currentLocator?.code || 'LOCATOR'}
              currentLocatorId={currentLocator?.id || ''}
              currentSubIoId={currentSubIo?.id || ''}
              currentSubIoName={currentSubIo?.name || ''}
              currentIoId={currentIo?.id || ''}
              currentIoName={currentIo?.name || ''}
              auditor={auditor}
              onSaveRecord={handleSaveRecord}
              onOpenMasterTab={() => setActiveTab('master')}
            />

            {/* 3. Items Recorded in This Locator */}
            <LocatorItemsList
              currentLocator={currentLocator}
              records={records}
              onDeleteRecord={handleDeleteRecord}
              onUpdateRecordQty={handleUpdateRecordQty}
              onToggleLocatorStatus={handleToggleLocatorStatus}
              onGoNextLocator={handleGoNextLocator}
              hasNextLocator={hasNextLocator}
            />
          </div>
        )}

        {/* TAB 2: HASIL & REKAP OPNAME (EXCEL EXPORT) */}
        {activeTab === 'results' && (
          <OpnameResultsView
            records={records}
            ios={ios}
            subIos={subIos}
            locators={locators}
            onDeleteRecord={handleDeleteRecord}
            onClearAllRecords={handleClearAllRecords}
            onSelectLocator={handleJumpToLocator}
          />
        )}

        {/* TAB 3: MASTER SKU & EXCEL IMPORT */}
        {activeTab === 'master' && (
          <MasterSkuView
            masterSKUs={masterSKUs}
            setMasterSKUs={setMasterSKUs}
            ios={ios}
            setIos={setIos}
            subIos={subIos}
            setSubIos={setSubIos}
            locators={locators}
            setLocators={setLocators}
            onAddLocator={handleAddLocator}
            onDeleteLocator={handleDeleteLocator}
            onImportLocationHierarchy={handleImportLocationHierarchy}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Sistem Stock Opname Manufaktur Keramik Lantai • Hierarki: IO &gt; Sub-IO &gt; Locator
          </div>
          <div className="flex items-center gap-3">
            <span>Ekspor & Impor XLSX Didukung</span>
            <span>•</span>
            <span className="text-amber-400/80">Offline Ready (Penyimpanan Lokal Aktif)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
