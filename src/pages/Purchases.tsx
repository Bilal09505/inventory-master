import React, { useState } from 'react';
import { Plus, ShoppingCart, Search, Package, User } from 'lucide-react';
import { useFirestoreCollection, useFirestoreActions } from '../hooks/useFirestore';
import { Purchase, Product, Vendor, Category } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { orderBy, limit } from 'firebase/firestore';
import { ChevronDown, Tag } from 'lucide-react';

export default function Purchases() {
  const { data: purchases, loading } = useFirestoreCollection<Purchase>('purchases', [orderBy('createdAt', 'desc'), limit(50)]);
  const { data: categories } = useFirestoreCollection<Category>('categories', [orderBy('name')]);
  const { data: products } = useFirestoreCollection<Product>('products', [orderBy('name')]);
  const { data: vendors } = useFirestoreCollection<Vendor>('vendors', [orderBy('name')]);
  const { recordTransaction } = useFirestoreActions('purchases');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const filteredProducts = products.filter(p => !selectedCategoryId || p.category === selectedCategoryId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const productId = formData.get('productId') as string;
    const units = Number(formData.get('units'));
    const cost = Number(formData.get('cost'));
    
    await recordTransaction('purchase', {
      productId,
      vendorId: formData.get('vendorId') || null,
      units,
      cost,
      amount: units * cost,
      date: formData.get('date'),
      notes: formData.get('notes'),
    });
    
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown Product';
  const getVendorName = (id?: string) => vendors.find(v => v.id === id)?.name || 'Generic Vendor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase History</h1>
          <p className="text-slate-500">Track all stock replenishment transactions</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          New Purchase
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Units</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {purchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-600">{new Date(purchase.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-blue-500" />
                    <span className="font-medium text-slate-900">{getProductName(purchase.productId)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{getVendorName(purchase.vendorId)}</td>
                <td className="px-6 py-4 text-slate-900 font-semibold">{purchase.units}</td>
                <td className="px-6 py-4 text-slate-900 font-bold">${purchase.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedCategoryId(''); setSelectedProductId(''); }} title="Record New Purchase">
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
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={!selectedCategoryId}
              >
                {!selectedCategoryId ? (
                   <option value="">Please select a category first...</option>
                ) : (
                  <>
                    <option value="">Choose a product...</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                    ))}
                  </>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Select Vendor</label>
            <select name="vendorId" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-hidden focus:ring-2 focus:ring-blue-100">
              <option value="">Choose a vendor...</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Units Purchased" name="units" type="number" required min="1" />
            <Input label="Cost per Unit ($)" name="cost" type="number" step="0.01" required />
          </div>
          <Input label="Purchase Date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea name="notes" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-hidden focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>Confirm Purchase</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
