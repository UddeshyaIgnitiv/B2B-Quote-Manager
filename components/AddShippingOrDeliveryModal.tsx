import React, { useState, useEffect } from 'react';

interface ShippingOption {
  type: 'rate' | 'custom';
  name: string;
  price: number;
}

interface AddShippingDeliveryModalProps {
  onClose: () => void;
  onApply: (shipping: ShippingOption) => void;
  initialShipping?: ShippingOption | null;
}

const predefinedRates: { label: string; price: number }[] = [
  { label: 'International Shipping', price: 0.34 },
  { label: 'Standard Shipping', price: 4.99 },
  { label: 'Express Shipping', price: 14.99 },
];

export default function AddShippingDeliveryModal({
  onClose,
  onApply,
  initialShipping,
}: AddShippingDeliveryModalProps) {
  const [mode, setMode] = useState<'rate' | 'custom'>('rate');
  const [selectedRate, setSelectedRate] = useState(predefinedRates[0]);
  const [customName, setCustomName] = useState('');
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [customPrice, setCustomPrice] = useState(0);

  const isCustomValid = !isNaN(customPrice) && customPrice > 0;

  useEffect(() => {
    console.log('initialShipping received in modal:', initialShipping);
    if (initialShipping) {
      if (initialShipping.type === 'rate') {
        const match = predefinedRates.find(r => r.label === initialShipping.name);
        if (match) {
          setMode('rate');
          setSelectedRate(match);
        }
      } else if (initialShipping.type === 'custom') {
        setMode('custom');
        setCustomName(initialShipping.name || '');
        setCustomPrice(initialShipping.price);
        setCustomPriceInput(initialShipping.price.toFixed(2));
      }
    } else {
      // Reset fields when no initialShipping (fresh add)
      setMode('rate');
      setSelectedRate(predefinedRates[0]);
      setCustomName('');
      setCustomPrice(0);
      setCustomPriceInput('');
    }
  }, [initialShipping]);

  const handleApply = () => {
    if (mode === 'rate') {
      onApply({
        type: 'rate',
        name: selectedRate.label,
        price: selectedRate.price,
      });
    } else if (isCustomValid) {
      onApply({
        type: 'custom',
        name: customName.trim() || 'Custom Shipping',
        price: customPrice,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-300 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg border border-gray-200 relative">
        {/* Header */}
        <div className="p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
          <h2 className="text-base font-semibold text-gray-900">Shipping and delivery options</h2>
          <button
            onClick={onClose}
            className="text-3xl text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Option 1: Shipping rates */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'rate'}
              onChange={() => setMode('rate')}
              className="mt-1 h-4 w-4"
            />
            <div>
              <div className="font-medium text-sm text-gray-900">Shipping rates</div>
              <p className="text-sm text-gray-600">
                Select eligible shipping rates based on your Shipping settings
              </p>
              {mode === 'rate' && (
                <select
                  className="mt-3 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={selectedRate.label}
                  onChange={(e) => {
                    const rate = predefinedRates.find(r => r.label === e.target.value);
                    if (rate) setSelectedRate(rate);
                  }}
                >
                  {predefinedRates.map((rate, i) => (
                    <option key={i} value={rate.label}>
                      {rate.label} - ${rate.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>

          {/* Option 2: Custom shipping */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'custom'}
              onChange={() => setMode('custom')}
              className="mt-1 h-4 w-4"
            />
            <div className="w-full">
              <div className="font-medium text-sm text-gray-900">Custom shipping</div>
              {mode === 'custom' && (
                <div className="mt-3 grid grid-cols-12 gap-4">
                  {/* Name */}
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Free shipping"
                    />
                  </div>

                  {/* Price */}
                  <div className="col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
                      <span className="text-gray-500 text-sm mr-1">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className="w-full rounded-md px-1 py-1 text-sm outline-none bg-transparent"
                        value={customPriceInput}
                        onChange={(e) => setCustomPriceInput(e.target.value)}
                        onBlur={() => {
                          const parsed = parseFloat(customPriceInput);
                          if (!isNaN(parsed)) {
                            setCustomPrice(parsed);
                            setCustomPriceInput(parsed.toFixed(2));
                          } else {
                            setCustomPrice(0);
                            setCustomPriceInput('0.00');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </label>
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
            onClick={handleApply}
            disabled={mode === 'custom' && !isCustomValid}
            className={`text-sm px-4 py-2 rounded-md text-white transition ${
              mode === 'rate' || isCustomValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
