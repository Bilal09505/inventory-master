import React, { useState } from 'react';
import { Plus, TrendingUp, ShoppingCart, User, Package, AlertTriangle } from 'lucide-react';
import { useFirestoreCollection, useFirestoreActions } from '../hooks/useFirestore';
import { Sale, Product, Customer, Category } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { cn } from '../lib/utils';
import { orderBy, limit } from 'firebase/firestore';
import { ChevronDown, Tag } from 'lucide-react';

export default function Sales() {
  const { data: sales, loading } = useFirestoreCollection<Sale>('sales', [orderBy('createdAt', 'desc'), limit(50)]);
  const { data: categories } = useFirestoreCollection<Category>('categories', [orderBy('name')]);
  const { data: products } = useFirestoreCollection<Product>('products', [orderBy('name')]);
  const { data: customers } = useFirestoreCollection<Customer>('customers', [orderBy('name')]);
  const { recordTransaction } = useFirestoreActions('sales');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredProducts = products.filter(p => !selectedCategoryId || p.category === selectedCategoryId);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    
    const formData = new FormData(e.currentTarget);
    const units = Number(formData.get('units'));
    
    if (selectedProduct && units > selectedProduct.stock) {
      setErrorMsg(`Insufficient stock. Only ${selectedProduct.stock} units available.`);
      return;
    }

    setIsSubmitting(true);
    const price = Number(formData.get('price'));
    const discount = Number(formData.get('discount') || 0);
    
    await recordTransaction('sale', {
      productId: selectedProductId,
      customerId: formData.get('customerId') || null,
      units,
      price,
      amount: (units * price) - discount,
      discount,
      date: formData.get('date'),
      paymentStatus: formData.get('paymentStatus') || 'paid',
    });
    
    setIsSubmitting(false);
    setIsModalOpen(false);
    setSelectedProductId('');
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';
  const getCustomerName = (id?: string) => customers.find(c => c.id === id)?.name || 'Walk-in Customer';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-slate-500">View and manage client transactions</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          New Sale
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Units</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-600">{new Date(sale.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-emerald-500" />
                    <span className="font-medium text-slate-900">{getProductName(sale.productId)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 truncate max-w-[150px]">
                  {getCustomerName(sale.customerId)}
                </td>
                <td className="px-6 py-4 text-slate-900 font-semibold">{sale.units}</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">${sale.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    sale.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" :
                    sale.paymentStatus === 'partial' ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {sale.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedCategoryId(''); setSelectedProductId(''); }} title="Create New Sale">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Select Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-hidden focus:ring-2 focus:ring-blue-100 appearance-none"
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedProductId(''); // Reset product when category changes
                }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Select Product</label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                name="productId" 
                required 
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-hidden focus:ring-2 focus:ring-blue-100 appearance-none"
                onChange={(e) => setSelectedProductId(e.target.value)}
                value={selectedProductId}
                disabled={!selectedCategoryId}
              >
                {!selectedCategoryId ? (
                   <option value="">Please select a category first...</option>
                ) : (
                  <>
                    <option value="">Choose a product...</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        {p.name} (Available: {p.stock} @ ${p.sellingPrice})
                      </option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Select Customer</label>
            <select name="customerId" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-hidden focus:ring-2 focus:ring-blue-100">
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantity" 
              name="units" 
              type="number" 
              required 
              min="1" 
              placeholder="0"
            />
            <Input 
              label="Selling Price ($)" 
              name="price" 
              type="number" 
              step="0.01" 
              required 
              defaultValue={selectedProduct?.sellingPrice || 0}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Discount ($)" name="discount" type="number" step="0.01" defaultValue="0" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Payment Status</label>
              <select name="paymentStatus" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          <Input label="Sale Date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertTriangle size={18} />
              {errorMsg}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>Generate Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
