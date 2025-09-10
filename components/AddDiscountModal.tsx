import React, { useState, useMemo, useEffect } from 'react';

interface CustomDiscount {
  type: 'fixed' | 'percentage';
  value: number;
  reason: string; // ✅ made required
}

interface AddDiscountModalProps {
  onClose: () => void;
  onApplyDiscount: (data: {
    // discountCode?: string;
    customDiscount?: CustomDiscount;
  }) => void;
  initialDiscount?: CustomDiscount | null;
  subtotal: number;
  formatCurrency: (amount: number) => string;
}

const discountTypes = [
  { value: 'fixed', label: 'Amount' },
  { value: 'percentage', label: 'Percentage' },
];

export default function AddDiscountModal({
  onClose,
  onApplyDiscount,
  initialDiscount,
  subtotal,
  formatCurrency,
}: AddDiscountModalProps) {
  // const [discountCode, setDiscountCode] = useState('');
  const [applyCustomDiscount, setApplyCustomDiscount] = useState(true); // Show directly
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<string>(''); // ✅ always store as string for formatting
  const [discountReason, setDiscountReason] = useState('');

  // const [filteredDiscounts, setFilteredDiscounts] = useState<Discount[]>([]);
  // const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialDiscount) {
      setApplyCustomDiscount(true);
      setDiscountType(initialDiscount.type);
      setDiscountValue(initialDiscount.value.toFixed(2)); // ✅ format as "34.00"
      setDiscountReason(initialDiscount.reason || '');
    } else {
      setDiscountType('fixed');
      setDiscountValue('');
      setDiscountReason('');
    }
  }, [initialDiscount]);

  // Future autocomplete logic commented
  // useEffect(() => {
  //   if (discountCode.trim()) {
  //     const filtered = allDiscounts.filter((d) =>
  //       d.code.toLowerCase().includes(discountCode.toLowerCase())
  //     );
  //     setFilteredDiscounts(filtered);
  //   } else {
  //     setFilteredDiscounts(allDiscounts); // Show all on focus
  //   }
  // }, [discountCode]);

  // const handleSelectDiscount = (discount: Discount) => {
  //   setDiscountCode(discount.code);
  //   setFilteredDiscounts([]);
  // };

  
  const calculatedDiscount = useMemo(() => {
    const parsedValue = parseFloat(discountValue);
    if (discountValue === '' || isNaN(parsedValue)) return 0;
    return discountType === 'fixed'
      ? Math.min(parsedValue, subtotal)
      : subtotal * (parsedValue / 100);
  }, [discountValue, discountType, subtotal]);

  const finalTotal = subtotal - calculatedDiscount;

  console.log("finalTotal", finalTotal);

  const handleApply = () => {
    const parsedValue = parseFloat(discountValue);
    if (discountValue !== '' && parsedValue > 0) {
      onApplyDiscount({
        customDiscount: {
          type: discountType,
          value: parseFloat(parsedValue.toFixed(2)),
          reason: discountReason,
        },
      });
      onClose();
    }
  };

  const parsedValue = parseFloat(discountValue);
  const isApplyDisabled =
    !applyCustomDiscount || discountValue === '' || isNaN(parsedValue) || parsedValue <= 0;

  return (
    <div className="fixed inset-0 z-50 bg-gray-300 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg border border-gray-200 relative">
        {/* Header */}
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
          <h2 className="text-base font-semibold text-gray-900">Add discount</h2>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            className="text-3xl text-gray-500 cursor-pointer hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-3 space-y-5">
          {/* --- Discount code field (commented for future use) --- */}
          {/* <div>
            <label htmlFor="discount-code" className="block font-semibold text-gray-900 mb-1">
              Discount codes
            </label>
            <input
              id="discount-code"
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder="Enter a discount code"
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(isFocused || discountCode) && (
            <div className="border border-gray-200 rounded-md shadow-md bg-white overflow-y-auto max-h-60">
              {filteredDiscounts.length > 0 ? (
                filteredDiscounts.map((discount, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectDiscount(discount)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 transition"
                  >
                    <div className="font-medium text-sm text-gray-900">{discount.code}</div>
                    <div className="text-xs text-gray-600 mt-1">{discount.description}</div>
                  </button>
                ))
              ) : (
                <div className="text-gray-500 text-sm px-4 py-3">No matching discounts</div>
              )}
            </div>
          )} */}

          {/* --- Custom discount only --- */}
          <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-lg">Add custom order discount</h4>

            {/* Discount Type */}
            <div>
              <label className="block font-semibold mb-1">Discount type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                className="w-full border border-gray-300 rounded-md px-4 py-2"
              >
                {discountTypes.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block font-semibold mb-1">Value</label>
              <div className="relative">
                {discountType === 'fixed' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                )}
                <input
                  type="text"
                  inputMode="decimal"
                  value={discountValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (discountType === 'fixed') {
                      if (/^\d*\.?\d{0,2}$/.test(val) || val === '') {
                        setDiscountValue(val);
                      }
                    } else {
                      // Percentage validation: max 100 and 2 decimals
                      if ((/^\d{0,3}(\.\d{0,2})?$/.test(val) && Number(val) <= 100) || val === '') {
                        setDiscountValue(val);
                      }
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(discountValue);
                    if (!isNaN(parsed)) {
                      setDiscountValue(parsed.toFixed(2));
                    }
                  }}
                  className={`w-full border border-gray-300 rounded-md px-4 py-2 ${
                    discountType === 'fixed' ? 'pl-7 pr-12' : 'pr-8'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {discountType === 'fixed' ? 'USD' : '%'}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold mb-1">Reason for discount</label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2"
                placeholder="Visible to customer"
              />
            </div>
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
            onClick={handleApply}
            disabled={isApplyDisabled}
            className={`text-sm px-4 py-2 rounded-md text-white transition ${
              isApplyDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Apply discount
          </button>
        </div>
      </div>
    </div>
  );
}
