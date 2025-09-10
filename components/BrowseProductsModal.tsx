'use client';

import { useEffect, useState } from 'react';

interface BrowseProductsModalProps {
  searchTerm?: string;
  setSearchTerm: (value: string) => void;
  onClose: () => void;
  onSelect: (selected: ProductSearchResult[]) => void;
}

interface ProductSearchResult {
  id: string;
  variantId: string | null;
  title: string;
  price: number;
  image?: { url?: string; altText?: string };
}

export default function BrowseProductsModal({ searchTerm, setSearchTerm, onClose, onSelect }: BrowseProductsModalProps) {
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(searchTerm ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const res = await fetch(`/api/products/list?search=${encodeURIComponent(search)}&limit=20`);
      const data = await res.json();
      //console.log("[Modal] Fetched products from API:", data.products);
      setProducts(data.products || []);
      setLoading(false);
    };

    fetchProducts();
  }, [searchTerm]);

  const toggleSelect = (id: string) => {
    //console.log("[Modal] Toggling selection for:", id);
    setSelected((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleAdd = () => {
    const selectedProducts = products.filter((p) => selected.has(p.id));
    //console.log("[Modal] Selected products to add:", selectedProducts);
    onSelect(selectedProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-20">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl border border-gray-200">
        <div className="flex justify-between rounded-lg items-center bg-gray-100 border border-gray-200 px-6 py-2">
          <h2 className="text-lg">Select products</h2>
          <button onClick={onClose} className="text-3xl text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none">&times;</button>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {loading ? (
            <p>Loading...</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto divide-y rounded-sm border border-gray-300 px-3 py-2">
              {products.map((p) => (
                <li key={p.id} className="flex items-center space-x-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                  />
                  {p.image?.url ? (
                    <img src={p.image.url} alt={p.image.altText || p.title} className="w-10 h-10 object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-xs text-gray-400">No Image</div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-gray-500">${p.price.toFixed(2)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 cursor-pointer rounded">Cancel</button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white cursor-pointer rounded disabled:opacity-50"
            disabled={selected.size === 0}
          >
            Add {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
