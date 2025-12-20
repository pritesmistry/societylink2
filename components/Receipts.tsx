
import React, { useState, useRef, useMemo } from 'react';
import { Bill, Society, PaymentStatus, PaymentDetails } from '../types';
import { Search, Download, Eye, Calendar, Upload, FileText, Plus, CreditCard, AlertCircle, Check, X } from 'lucide-react';
import StandardToolbar from './StandardToolbar';

interface ReceiptsProps {
  bills: Bill[];
  activeSociety: Society;
  onBulkUpdateBills: (bills: Bill[]) => void;
  onUpdateBill: (bill: Bill) => void;
  balances?: { cash: number; bank: number };
}

declare global {
  interface Window {
    html2pdf: any;
  }
}

const Receipts: React.FC<ReceiptsProps> = ({ bills, activeSociety, onBulkUpdateBills, onUpdateBill, balances }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Bill | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddReceiptOpen, setIsAddReceiptOpen] = useState(false);
  
  // New Receipt Form State
  const [selectedBillId, setSelectedBillId] = useState('');
  const [paymentForm, setPaymentForm] = useState<PaymentDetails>({
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      reference: '',
      remarks: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter only PAID bills
  const paidBills = bills.filter(b => 
    b.status === PaymentStatus.PAID &&
    (b.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     b.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
     b.id.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
     const dateA = a.paymentDetails?.date || a.generatedDate;
     const dateB = b.paymentDetails?.date || b.generatedDate;
     return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const pendingBills = bills.filter(b => b.status === PaymentStatus.PENDING || b.status === PaymentStatus.OVERDUE);

  const totalCollected = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  const selectedBill = useMemo(() => bills.find(b => b.id === selectedBillId), [bills, selectedBillId]);

  const memberTotalOutstanding = useMemo(() => {
    if (!selectedBill) return 0;
    return bills
        .filter(b => 
            b.residentId === selectedBill.residentId && 
            (b.status === PaymentStatus.PENDING || b.status === PaymentStatus.OVERDUE)
        )
        .reduce((sum, b) => sum + b.totalAmount, 0);
  }, [selectedBill, bills]);

  const handleBillSelectionChange = (billId: string) => {
    setSelectedBillId(billId);
    if (billId) {
        setPaymentForm(prev => ({
            ...prev,
            remarks: `MAINTENANCE AGAINST BILL NO. ${billId}`
        }));
    } else {
        setPaymentForm(prev => ({ ...prev, remarks: '' }));
    }
  };

  const handleViewReceipt = (bill: Bill) => {
    setSelectedReceipt(bill);
    setIsViewModalOpen(true);
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
      e.preventDefault();
      const billToUpdate = bills.find(b => b.id === selectedBillId);
      if (billToUpdate) {
          onUpdateBill({
              ...billToUpdate,
              status: PaymentStatus.PAID,
              paymentDetails: paymentForm
          });
          setIsAddReceiptOpen(false);
          setPaymentForm({
              date: new Date().toISOString().split('T')[0],
              mode: 'UPI',
              reference: '',
              remarks: ''
          });
          setSelectedBillId('');
      }
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) return;

        const lines = content.split(/\r\n|\n/);
        const updatedBills: Bill[] = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [billId, amountStr, date, mode, ref, remarks] = line.split(',').map(item => item?.trim());

            if (!billId) continue;
            const bill = bills.find(b => b.id === billId || b.id === `B${billId}`);

            if (bill && bill.status !== PaymentStatus.PAID) {
                updatedBills.push({
                    ...bill,
                    status: PaymentStatus.PAID,
                    paymentDetails: {
                        date: date || new Date().toISOString().split('T')[0],
                        mode: (mode as any) || 'Bank Transfer',
                        reference: ref || 'Bulk Upload',
                        remarks: remarks || `MAINTENANCE AGAINST BILL NO. ${bill.id}`
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
    const pendingBill = bills.find(b => b.status === PaymentStatus.PENDING);
    const exampleId = pendingBill ? pendingBill.id : "B123456";
    const row = `${exampleId},1500,2023-10-25,UPI,UPI-998877,MAINTENANCE AGAINST BILL NO. ${exampleId}`;
    
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
    element.classList.remove('shadow-2xl', 'border');
    
    const opt = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        element.classList.add('shadow-2xl', 'border');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StandardToolbar 
        onSearch={() => {}}
        onSave={() => setIsAddReceiptOpen(true)}
        balances={balances}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-semibold text-slate-800">Members Receipts</h2>
           <p className="text-sm text-slate-500 mt-1">Transaction history and downloadable receipts.</p>
        </div>
        <div className="flex gap-4">
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
                    <Upload size={18} /> Bulk Upload
                </button>
                 <button 
                    onClick={() => setIsAddReceiptOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-sm"
                >
                    <Plus size={18} /> New Receipt
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

      {/* --- ADD NEW RECEIPT MODAL --- */}
      {isAddReceiptOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                 <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-2">
                     <Plus className="text-green-600" />
                     New Receipt Entry
                 </h2>
                 
                 <form onSubmit={handleSaveReceipt} className="space-y-5">
                     <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-2">Select Pending Bill *</label>
                         <select 
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-green-100 outline-none font-bold text-slate-700 transition-all"
                            required
                            value={selectedBillId}
                            onChange={(e) => handleBillSelectionChange(e.target.value)}
                         >
                             <option value="">-- Choose Bill --</option>
                             {pendingBills.map(b => (
                                 <option key={b.id} value={b.id}>
                                     {b.unitNumber} - {b.residentName} (₹{b.totalAmount.toLocaleString()})
                                 </option>
                             ))}
                             {pendingBills.length === 0 && <option disabled>No pending bills found</option>}
                         </select>
                     </div>

                     {selectedBill && (
                         <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 animate-fade-in shadow-inner">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-black text-indigo-400 uppercase tracking-tighter">Member Dues Summary</p>
                                <span className="bg-indigo-200 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-black">{selectedBill.unitNumber}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <p className="text-sm text-indigo-900 font-black">{selectedBill.residentName}</p>
                                <div className="text-right">
                                    <p className="text-[10px] text-indigo-400 uppercase font-bold">Total Outstanding</p>
                                    <p className="text-xl font-black text-indigo-700">₹{memberTotalOutstanding.toLocaleString()}</p>
                                </div>
                            </div>
                         </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-1">Payment Date</label>
                            <input 
                                type="date" 
                                required 
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-green-100 outline-none font-bold"
                                value={paymentForm.date}
                                onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-1">Payment Mode</label>
                            <select 
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-green-100 outline-none font-bold"
                                value={paymentForm.mode}
                                onChange={(e) => setPaymentForm({...paymentForm, mode: e.target.value as any})}
                            >
                                <option value="UPI">UPI / GPay</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Cash">Cash</option>
                            </select>
                        </div>
                     </div>

                     <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-1">Reference / Cheque No. *</label>
                         <input 
                            type="text" 
                            required 
                            placeholder="TXN ID or Cheque Number"
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-green-100 outline-none font-bold"
                            value={paymentForm.reference}
                            onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                         />
                     </div>

                     <div>
                         <label className="block text-xs font-black text-slate-400 uppercase mb-1">Remarks (Auto-picked)</label>
                         <textarea 
                            rows={2}
                            placeholder="Payment remarks"
                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-green-100 outline-none font-bold text-indigo-700 bg-slate-50"
                            value={paymentForm.remarks}
                            onChange={(e) => setPaymentForm({...paymentForm, remarks: e.target.value})}
                         />
                     </div>

                     <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
                         <button 
                            type="button" 
                            onClick={() => setIsAddReceiptOpen(false)}
                            className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                         >
                             <X size={18} className="inline mr-1" /> CANCEL
                         </button>
                         <button 
                            type="submit" 
                            disabled={!selectedBillId}
                            className="px-10 py-2.5 bg-green-600 text-white font-black rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             <Check size={18} /> SAVE RECEIPT
                         </button>
                     </div>
                 </form>
             </div>
          </div>
      )}

      {/* --- RECEIPT PREVIEW MODAL --- */}
      {isViewModalOpen && selectedReceipt && selectedReceipt.paymentDetails && (
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
                        onClick={() => setIsViewModalOpen(false)}
                        className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-900"
                      >
                          Close
                      </button>
                  </div>

                  <div 
                    id="receipt-preview-full" 
                    className="bg-white w-[210mm] h-[148mm] p-[10mm] shadow-2xl mx-auto text-slate-800 relative border border-slate-200"
                  >
                        <div className="border-4 border-double border-slate-200 h-full p-8 flex flex-col justify-between">
                            <div className="text-center border-b pb-4">
                                <h1 className="text-2xl font-bold text-slate-900 uppercase">{activeSociety.name}</h1>
                                <p className="text-sm text-slate-500">{activeSociety.address}</p>
                                <h2 className="text-xl font-bold text-green-700 mt-4 uppercase tracking-wider border-2 border-green-700 inline-block px-4 py-1 rounded">Official Receipt</h2>
                            </div>
                            
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
                                    A sum of Rupees <span className="font-bold border-b border-slate-400 px-2">₹ {selectedReceipt.totalAmount.toLocaleString()} /-</span>
                                </p>
                                <p>
                                    By <span className="font-bold border-b border-slate-400 px-2">{selectedReceipt.paymentDetails.mode}</span> 
                                    (Ref: {selectedReceipt.paymentDetails.reference})
                                </p>
                                <p>
                                    Towards <span className="font-bold border-b border-slate-400 px-2">{selectedReceipt.paymentDetails.remarks}</span>
                                </p>
                            </div>

                            <div className="flex justify-between items-end mt-8 pt-8">
                                <div className="text-[10px] text-slate-400 italic">
                                    * Computer generated receipt - Signature not required.
                                </div>
                                <div className="text-center">
                                    <div className="h-10 w-32 mb-1"></div>
                                    <p className="font-black text-slate-800 border-t border-slate-400 pt-1 px-4 text-xs uppercase">Hon. Treasurer</p>
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
