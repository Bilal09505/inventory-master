import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertCircle,
  MoreVertical,
  Package,
  ArrowUpDown,
  Tag,
  ChevronDown
} from 'lucide-react';
import { useFirestoreCollection, useFirestoreActions } from '../hooks/useFirestore';
import { Product, Category } from '../types';
import { Modal, Button, Input } from '../components/UI';
import { cn } from '../lib/utils';
import { orderBy, where, QueryConstraint } from 'firebase/firestore';

export default function Inventory() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
  const productsQuery = useMemo(() => {
    const q: QueryConstraint[] = [orderBy('name')];
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      q.push(where('category', '==', selectedCategoryId));
    }
    return q;
  }, [selectedCategoryId]);

  const { data: products, loading } = useFirestoreCollection<Product>('products', productsQuery);
  const { data: categories } = useFirestoreCollection<Category>('categories', [orderBy('name')]);
  const { add, update, remove } = useFirestoreActions('products');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      barcode: formData.get('barcode') as string,
      costPrice: Number(formData.get('costPrice')),
      sellingPrice: Number(formData.get('sellingPrice')),
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      category: formData.get('category') as string,
      unitType: formData.get('unitType') as string,
    };

    if (editingProduct) {
      await update(editingProduct.id, data);
    } else {
      await add(data);
    }
    
    setIsSubmitting(false);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await remove(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">Manage your product stock and details</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}>
          <Plus size={20} />
          Add Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-100 transition-all font-sans appearance-none text-slate-900"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">Select Category...</option>
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search products, SKU..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-100 transition-all font-sans"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="secondary" size="sm">
            <Filter size={16} />
            Filter
          </Button>
          <Button variant="secondary" size="sm">
            <ArrowUpDown size={16} />
            Sort
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price (Cost/Sell)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4 h-16 bg-slate-50/30"></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500 uppercase font-mono">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        {categories.find(c => c.id === product.category)?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          product.stock <= product.minStock ? "text-red-600" : "text-slate-900"
                        )}>
                          {product.stock}
                        </span>
                        <span className="text-slate-400 text-xs">{product.unitType || 'Units'}</span>
                        {product.stock <= product.minStock && (
                          <AlertCircle size={14} className="text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-slate-600">${product.costPrice} / <span className="text-emerald-600 font-bold">${product.sellingPrice}</span></p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Product Name" 
            name="name" 
            defaultValue={editingProduct?.name} 
            required 
            placeholder="e.g. Mechanical Keyboard"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="SKU" 
              name="sku" 
              defaultValue={editingProduct?.sku} 
              placeholder="SKU-001"
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <div className="relative">
                <select
                  name="category"
                  required
                  defaultValue={editingProduct?.category}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-100 transition-all font-sans appearance-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Cost Price ($)" 
              name="costPrice" 
              type="number" 
              step="0.01" 
              defaultValue={editingProduct?.costPrice} 
              required 
            />
            <Input 
              label="Selling Price ($)" 
              name="sellingPrice" 
              type="number" 
              step="0.01" 
              defaultValue={editingProduct?.sellingPrice} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Current Stock" 
              name="stock" 
              type="number" 
              defaultValue={editingProduct?.stock ?? 0} 
              required 
            />
            <Input 
              label="Min. Stock Level" 
              name="minStock" 
              type="number" 
              defaultValue={editingProduct?.minStock ?? 5} 
              required 
            />
          </div>
          <Input 
            label="Unit Type" 
            name="unitType" 
            defaultValue={editingProduct?.unitType ?? 'Pieces'} 
            placeholder="Pieces, KG, Box"
          />
          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              isLoading={isSubmitting}
            >
              {editingProduct ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
