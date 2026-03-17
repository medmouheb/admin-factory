import React from 'react'

export interface BarcodeEntry {
    barcode1: string; // LearPN
    barcode2: string; // Traceability Code
    errorCode: string;
}

export interface CurrentData {
    part: { sarbiaPN?: string; learPN: string; tescaPN: string; desc: string; qtyPerBox: string };
    materile: { storageUn: string; availStock: string; barcodes: BarcodeEntry[] };
    repair?: { codePiece: string; checklist: any[] };
    ticketCode: string | null;
    hasCompletedStep1: boolean;
    client: 'lear' | 'serbia' | null;
}

export interface CurrentDataContextType {
    currentData: CurrentData;
    setCurrentData: React.Dispatch<React.SetStateAction<CurrentData>>;
}
