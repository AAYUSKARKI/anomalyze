import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AnomalyData } from '../types/Anomaly';

export const exportAnomaliesAsExcel = (data: AnomalyData[]) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Anomalies');
  XLSX.writeFile(wb, 'Anomaly_Report.xlsx');
};

export const exportAnomaliesAsPDF = (data: AnomalyData[]) => {
  const doc = new jsPDF();
  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(key => item[key as keyof AnomalyData]));
  
  autoTable(doc, {
    head: [headers],
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 40, 40] },
  });

  doc.save('Anomaly_Report.pdf');
};
