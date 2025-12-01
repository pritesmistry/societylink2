import React, { useState, useRef } from 'react';
import { Bill, Society, PaymentStatus } from '../types';
import { Search, Download, Eye, Calendar, Upload, FileText } from 'lucide-react';

interface ReceiptsProps {
  bills: Bill[];
  activeSociety: Society;
  onBulkUpdateBills: (bills: Bill[]) => void;
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Receipts: React.FC<ReceiptsProps> = ({ bills, activeSociety, onBulkUpdateBills }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Bill | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter only PAID bills
  const paidBills = bills.filter(b => 
    b.status === PaymentStatus.PAID &&
    (b.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     b.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
     b.id.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
     // Sort by payment date descending (if available), else by bill ID
     const dateA = a.paymentDetails?.date || a.generatedDate;
     const dateB = b.paymentDetails?.date || b.generatedDate;
     return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const totalCollected = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  const handleViewReceipt = (bill: Bill) => {
    setSelectedReceipt(bill);
    setIsModalOpen(true);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) return;

        const lines = content.split(/\r\n|\n/);
        // Expected CSV: Bill ID, Amount, Date, Mode, Reference, Remarks
        // Start from index 1 to skip header
        
        const updatedBills: Bill[] = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [billId, amountStr, date, mode, ref, remarks] = line.split(',').map(item => item?.trim());

            if (!billId) continue;

            // Find the bill matching ID (or Unit Number if logic allows, keeping strictly ID for safety)
            const bill = bills.find(b => b.id === billId || b.id === `B${billId}`); // Handle case where user might omit prefix

            if (bill && bill.status !== PaymentStatus.PAID) {
                updatedBills.push({
                    ...bill,
                    status: PaymentStatus.PAID,
                    paymentDetails: {
                        date: date || new Date().toISOString().split('T')[0],
                        mode: (mode as any) || 'Bank Transfer',
                        reference: ref || 'Bulk Upload',
                        remarks: remarks || 'Bulk receipt entry'
                    }
                });
                successCount++;
            } else {
                failCount++;
            }
        }

        if (updatedBills.length > 0) {
            onBulkUpdateBills(updatedBills);
            alert(`Successfully recorded payments for ${successCount} bills. \n(${failCount} skipped - invalid ID or already paid)`);
        } else {
            alert("No valid pending bills found in CSV. Please check Bill IDs.");
        }

        if (fileInputRef.current) fileInputRef.current.value = ''; 
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = "Bill ID,Amount,Payment Date (YYYY-MM-DD),Mode,Reference,Remarks\n";
    // Find a pending bill for example
    const pendingBill = bills.find(b => b.status === PaymentStatus.PENDING);
    const exampleId = pendingBill ? pendingBill.id : "B123456";
    const row = `${exampleId},1500,2023-10-25,UPI,UPI-998877,Oct Maintenance`;
    
    const blob = new Blob([headers + row], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadPDF = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Temporarily remove shadow and border for clean print
    element.classList.remove('shadow-2xl', 'border');
    
    const opt = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        // Restore styles
        element.classList.add('shadow-2xl', 'border');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Payment Receipts</h2>
           <p className="text-sm text-slate-500 mt-1">Transaction history and downloadable receipts.</p>
        </div>
        <div className="flex gap-4">
             {/* Bulk Action Area */}
            <div className="flex gap-2">
                <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleBulkUpload} 
                />
                <button 
                    onClick={downloadTemplate}
                    className="bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors text-sm shadow-sm"
                    title="Download Template"
                >
                    <FileText size={16} /> Template
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
                >
                    <Upload size={18} /> Bulk Record Payments
                </button>
            </div>

            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex flex-col items-end min-w-[150px]">
                <span className="text-xs font-bold text-green-700 uppercase">Total Collected</span>
                <span className="text-lg font-bold text-green-800">₹{totalCollected.toLocaleString()}</span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Resident, Unit or Receipt No..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="text-sm text-slate-500">
            Showing {paidBills.length} records
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="p-4 font-semibold text-slate-600 text-sm">Receipt #</th>
                        <th className="p-4 font-semibold text-slate-600 text-sm">Payment Date</th>
                        <th className="p-4 font-semibold text-slate-600 text-sm">Unit / Resident</th>
                        <th className="p-4 font-semibold text-slate-600 text-sm">Mode & Ref</th>
                        <th className="p-4 font-semibold text-slate-600 text-sm text-right">Amount</th>
                        <th className="p-4 font-semibold text-slate-600 text-sm text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {paidBills.map(bill => (
                        <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 text-sm font-mono text-slate-500">RCP-{bill.id}</td>
                            <td className="p-4 text-sm text-slate-700">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    {bill.paymentDetails?.date || 'N/A'}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="font-medium text-slate-800">{bill.unitNumber}</div>
                                <div className="text-xs text-slate-500">{bill.residentName}</div>
                            </td>
                            <td className="p-4 text-sm">
                                <div className="font-medium text-slate-700">{bill.paymentDetails?.mode}</div>
                                <div className="text-xs text-slate-400 font-mono">{bill.paymentDetails?.reference || '-'}</div>
                            </td>
                            <td className="p-4 text-right font-bold text-slate-800">
                                ₹{bill.totalAmount.toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => handleViewReceipt(bill)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="View & Download"
                                >
                                    <Eye size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {paidBills.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                                No payment receipts found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- RECEIPT PREVIEW MODAL --- */}
      {isModalOpen && selectedReceipt && selectedReceipt.paymentDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[70] backdrop-blur-sm p-4 overflow-y-auto">
              <div className="relative w-full max-w-2xl flex flex-col items-center">
                  <div className="flex gap-4 mb-4">
                      <button 
                        onClick={() => downloadPDF('receipt-preview-full', `Receipt_${selectedReceipt.id}.pdf`)}
                        className="bg-white text-green-600 px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-50 flex items-center gap-2"
                      >
                          <Download size={20} /> Download PDF
                      </button>
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-900"
                      >
                          Close
                      </button>
                  </div>

                  <div 
                    id="receipt-preview-full" 
                    className="bg-white w-[210mm] h-[148mm] p-[10mm] shadow-2xl mx-auto text-slate-800 relative border border-slate-200"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                        <div className="border-4 border-double border-slate-200 h-full p-8 flex flex-col justify-between">
                            {/* Header */}
                            <div className="text-center border-b pb-4">
                                <h1 className="text-2xl font-bold text-slate-900">{activeSociety.name}</h1>
                                <p className="text-sm text-slate-500">{activeSociety.address}</p>
                                <h2 className="text-xl font-bold text-green-700 mt-4 uppercase tracking-wider border-2 border-green-700 inline-block px-4 py-1 rounded">Payment Receipt</h2>
                            </div>
                            
                            {/* Details */}
                            <div className="flex justify-between items-start my-6">
                                <div className="space-y-2">
                                    <p className="text-sm">Receipt No: <span className="font-bold">RCP-{selectedReceipt.id}</span></p>
                                    <p className="text-sm">Date: <span className="font-bold">{selectedReceipt.paymentDetails.date}</span></p>
                                </div>
                                <div className="space-y-2 text-right">
                                    <p className="text-sm">Unit No: <span className="font-bold">{selectedReceipt.unitNumber}</span></p>
                                    <p className="text-sm">Bill No: <span className="font-bold">{selectedReceipt.id}</span></p>
                                </div>
                            </div>

                            <div className="space-y-4 text-lg">
                                <p>
                                    Received with thanks from <span className="font-bold border-b border-slate-400 px-2">{selectedReceipt.residentName}</span>
                                </p>
                                <p>
                                    A sum of Rupees <span className="font-bold border-b border-slate-400 px-2">₹ {selectedReceipt.totalAmount.toFixed(2)} /-</span>
                                </p>
                                <p>
                                    By <span className="font-bold border-b border-slate-400 px-2">{selectedReceipt.paymentDetails.mode}</span> 
                                    (Ref: {selectedReceipt.paymentDetails.reference})
                                </p>
                                <p>
                                    Towards <span className="font-bold border-b border-slate-400 px-2">Maintenance Bill #{selectedReceipt.id}</span>
                                </p>
                            </div>

                            <div className="flex justify-between items-end mt-8 pt-8">
                                <div className="text-sm text-slate-500">
                                    * This is a computer generated receipt.
                                </div>
                                <div className="text-center">
                                    <div className="h-12 w-32 mb-2"></div>
                                    <p className="font-bold text-slate-800 border-t border-slate-400 pt-1 px-4">Authorized Signatory</p>
                                </div>
                            </div>
                        </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Receipts;