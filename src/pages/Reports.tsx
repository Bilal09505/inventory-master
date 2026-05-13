import React from 'react';
import { FileText, Download, Printer, BarChart3, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { Sale, Product, Purchase } from '../types';
import { Button } from '../components/UI';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const { data: sales } = useFirestoreCollection<Sale>('sales');
  const { data: products } = useFirestoreCollection<Product>('products');
  const { data: purchases } = useFirestoreCollection<Purchase>('purchases');

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sales.map(s => ({
      Date: s.date,
      Product: products.find(p => p.id === s.productId)?.name || s.productId,
      Units: s.units,
      Price: s.price,
      Amount: s.amount,
      Status: s.paymentStatus
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("InventoryMaster - Sales Report", 20, 10);
    
    const tableData = sales.map(s => [
      new Date(s.date).toLocaleDateString(),
      products.find(p => p.id === s.productId)?.name || s.productId,
      s.units.toString(),
      `$${s.price.toFixed(2)}`,
      `$${s.amount.toFixed(2)}`,
      s.paymentStatus
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Product', 'Units', 'Price', 'Amount', 'Status']],
      body: tableData,
    });

    doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);
  const totalPurchases = purchases.reduce((acc, p) => acc + p.amount, 0);
  const netProfit = totalSales - totalPurchases;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business Reports</h1>
        <p className="text-slate-500">Analyze your performance and export data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-semibold text-slate-700">Gross Sales</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">${totalSales.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Lifetime revenue</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <h3 className="font-semibold text-slate-700">Total Procurement</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">${totalPurchases.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Stock investment</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <h3 className="font-semibold text-slate-700">Estimated Profit</h3>
          </div>
          <p className={cn("text-3xl font-bold", netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
            ${netProfit.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Gross Margin</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <FileText size={20} className="text-slate-400" />
          Export Center
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-emerald-600 mb-4">
              <Download size={24} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Sales Data (XLSX)</h4>
            <p className="text-sm text-slate-500 mb-6">Comprehensive sales history for spreadsheet analysis</p>
            <Button onClick={exportToExcel} className="w-full" variant="secondary">
              Export to Excel
            </Button>
          </div>

          <div className="p-6 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-red-600 mb-4">
              <FileText size={24} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Performance Report (PDF)</h4>
            <p className="text-sm text-slate-500 mb-6">A formatted document showing recent business activity</p>
            <Button onClick={exportToPDF} className="w-full" variant="secondary">
              Generate PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


