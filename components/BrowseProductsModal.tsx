'use client';

import { useEffect, useState } from 'react';

interface CompanyLocation {
  id: string;
  name: string;
}

interface ProductSearchResult {
  id: string;
  variantId: string | null;
  title: string;
  price: number;
  contextualPrice?: { amount: number; currencyCode: string } | null;
  image?: { url?: string; altText?: string };
  inventoryItemId?: string;
}

interface BrowseProductsModalProps {
  searchTerm?: string;
  setSearchTerm: (value: string) => void;
  onClose: () => void;
  onSelect: (selected: ProductSearchResult[]) => void;
  existingVariantIds: (string | undefined)[];
  locationName?: string;
}

export default function BrowseProductsModal({
  searchTerm,
  setSearchTerm,
  onClose,
  onSelect,
  existingVariantIds,
  locationName,
}: BrowseProductsModalProps) {
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch products when searchTerm or selectedLocationId changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchTerm || !selectedLocationId) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          limit: '20',
          companyLocationId: selectedLocationId,
        });

        const res = await fetch(`/api/products/list?${params.toString()}`);
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm, selectedLocationId]);

  // Fetch company locations and auto-select location based on locationName prop
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        const locs = data.companyLocations || [];
        setLocations(locs);

        if (locs.length === 0) {
          setSelectedLocationId('');
          return;
        }

        if (locationName) {
          // Find matching location by name (case-insensitive)
          const matched = locs.find(
            (loc: CompanyLocation) =>
              loc.name.toLowerCase() === locationName.toLowerCase()
          );
          if (matched) {
            setSelectedLocationId(matched.id);
            return;
          }
        }

        // Default to first location if no match found
        setSelectedLocationId(locs[0].id);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };
    fetchLocations();
  }, [locationName]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  };

  const handleAdd = () => {
    const selectedProducts = products.filter((p) => selected.has(p.id));
    onSelect(selectedProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-20">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl border border-gray-200">
        {/* Location dropdown removed to auto-select based on locationName */}

        <div className="flex justify-between items-center bg-gray-100 border-b px-6 py-2">
          <h2 className="text-lg font-medium">Select products</h2>
          <button
            onClick={onClose}
            className="text-3xl text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none"
          >
            &times;
          </button>
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
            <ul className="max-h-60 overflow-y-auto divide-y border border-gray-300 rounded px-3 py-2">
              {products.map((p) => {
                const isAlreadyAdded = existingVariantIds.includes(
                  p.variantId ?? undefined
                );
                const displayPrice = p.contextualPrice?.amount ?? p.price;
                return (
                  <li
                    key={p.id}
                    className="flex items-center space-x-4 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      disabled={isAlreadyAdded}
                      onChange={() => toggleSelect(p.id)}
                    />
                    {p.image?.url ? (
                      <img
                        src={p.image.url}
                        alt={p.image.altText || p.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-xs text-gray-400 rounded">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-gray-500">
                        {p.contextualPrice
                          ? `${p.contextualPrice.currencyCode} ${displayPrice.toFixed(
                              2
                            )}`
                          : `USD ${displayPrice.toFixed(2)}` /* default currency */}
                      </div>
                      {isAlreadyAdded && (
                        <span className="text-xs text-green-600">
                          (Item already added)
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={selected.size === 0}
          >
            Add {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
