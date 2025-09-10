// components/AddCustomItemModal.tsx
import React, { useEffect, useState } from 'react';

interface AddCustomItemModalProps {
  onClose: () => void;
  onAdd: (item: {
    title: string;
    price: number;
    quantity: number;
    taxable: boolean;
    physical: boolean;
    weight?: number;
    weightUnit?: string;
  }) => void;
}

export default function AddCustomItemModal({ onClose, onAdd }: AddCustomItemModalProps) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [taxable, setTaxable] = useState(true);
  const [physical, setPhysical] = useState(true);
  const [weight, setWeight] = useState(0);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [priceInput, setPriceInput] = useState<string>('0.00');

  const isValid = title.trim() !== '' && price >= 0 && quantity > 0;

  const handleAdd = () => {
    onAdd({ title, price, quantity, taxable, physical, weight, weightUnit });
    onClose();
  };

  useEffect(() => {
    setPriceInput(price.toFixed(2));
  }, []);

  return (
   <div className="fixed inset-0 z-50 bg-gray-300 bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="p-4 bg-gray-100 border border-gray-200 flex justify-between items-center px-6 py-3 rounded-lg">
                <h2 className="text-base font-semibold text-gray-900">Add custom item</h2>
                <button
                    onClick={onClose}
                    className="text-3xl text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none"
                    aria-label="Close modal"
                >
                    &times;
                </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">

            {/* Inputs */}
            <div className="grid grid-cols-12 gap-4">
                {/* Item name (2/3 width) */}
                <div className="col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item name</label>
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                </div>

                {/* Price (1/6) */}
                <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
                        <span className="text-gray-500 text-sm mr-1">$</span>
                        <input
                        type="text"
                        inputMode="decimal"
                        className="w-full rounded-md px-1 py-1 text-sm outline-none bg-transparent"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        onBlur={() => {
                            const parsed = parseFloat(priceInput);
                            if (!isNaN(parsed)) {
                            const formatted = parsed.toFixed(2);
                            setPrice(parsed);
                            setPriceInput(formatted);
                            } else {
                            setPrice(0);
                            setPriceInput(''); // or '0.00' if you prefer default fallback
                            }
                        }}
                        />
                    </div>
                </div>
                {/* Quantity (1/6) */}
                <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
                <label className="flex items-center text-sm text-gray-800 gap-2">
                <input type="checkbox" checked={taxable} onChange={() => setTaxable(!taxable)} />
                Item is taxable
                </label>
                <label className="flex items-center text-sm text-gray-800 gap-2">
                <input type="checkbox" checked={physical} onChange={() => setPhysical(!physical)} />
                Item is a physical product
                </label>
            </div>

            {/* Weight section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item weight (optional)</label>
                <div className="flex items-center gap-2">
                    <input
                    type="number"
                    min={0}
                    value={isNaN(weight) ? '' : weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                    <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Used to calculate shipping rates accurately</p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
            <button
                onClick={onClose}
                className="text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
            >
                Cancel
            </button>
            <button
                onClick={handleAdd}
                disabled={!isValid}
                className={`text-sm px-4 py-2 rounded-md text-white transition ${
                isValid
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
                Add item
            </button>
            </div>
        </div>
    </div>
  );
}
