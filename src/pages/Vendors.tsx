import React, { useState } from 'react';
import { Plus, Truck, Search, Edit2, Trash2 } from 'lucide-react';
import { useFirestoreCollection, useFirestoreActions } from '../hooks/useFirestore';
import { Vendor } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { orderBy } from 'firebase/firestore';

export default function Vendors() {
  const { data: vendors, loading } = useFirestoreCollection<Vendor>('vendors', [orderBy('name')]);
  const { add, update, remove } = useFirestoreActions('vendors');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      category: formData.get('category') as string,
    };

    if (editingVendor) {
      await update(editingVendor.id, data);
    } else {
      await add(data);
    }
    
    setIsModalOpen(false);
    setEditingVendor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-slate-500">Manage your suppliers and vendors</p>
        </div>
        <Button onClick={() => { setEditingVendor(null); setIsModalOpen(true); }}>
          <Plus size={20} />
          Add Vendor
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-100 transition-all font-sans"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Vendor Name</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{vendor.name}</td>
                <td className="px-6 py-4 text-slate-600">{vendor.phone || '-'}</td>
                <td className="px-6 py-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 m-4 inline-block">
                  {vendor.category || 'General'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingVendor(vendor); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => remove(vendor.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingVendor(null); }}
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" defaultValue={editingVendor?.name} required />
          <Input label="Phone" name="phone" defaultValue={editingVendor?.phone} />
          <Input label="Category" name="category" defaultValue={editingVendor?.category} placeholder="e.g. Raw Materials, Electronics" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Address</label>
            <textarea 
              name="address" 
              defaultValue={editingVendor?.address}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-hidden focus:ring-2 focus:ring-blue-100 min-h-[100px]"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">{editingVendor ? 'Update' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
