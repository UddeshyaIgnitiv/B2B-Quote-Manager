'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import BrowseProductsModal from '@/components/BrowseProductsModal';
import AddDiscountModal from '@/components/AddDiscountModal';
import AddShippingDeliveryModal from '@/components/AddShippingOrDeliveryModal';
import { sendDraftOrderInvoice } from "@/lib/utils/sendDraftOrderInvoice";
import SendInvoiceModal from './SendInvoiceModal';
import PaymentDueSection from '@/components/PaymentDueSection';
import type { EmailPayload, QuoteDetailsModalProps, ProductSearchResult, 
LineItem, LineItemExtended, Quote, Alert } from "@/types/quotes";


export default function QuoteDetailsModal({ quoteId, onCloseAction, onSaveSuccess }: QuoteDetailsModalProps) {
  const [editPromptVisible, setEditPromptVisible] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const encodedGid = encodeURIComponent(quoteId);

  // --- NEW: Product Search states
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchAbortController = useRef<AbortController | null>(null);

  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showSendInvoiceModal, setShowSendInvoiceModal] = useState(false);
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [isPaymentDueLater, setIsPaymentDueLater] = useState(false);

  const [showShippingOrDeliveryModal, setShippingOrDeliveryModal] = useState(false);
  //const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [alert, setAlert] = useState<Alert | null>(null);
  
 useEffect(() => {
    async function fetchQuoteDetails() {
      //console.log("quote data", quote);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quotes/${encodedGid}`);
        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
        const data = await res.json();
        //console.log("quote data data", data);
        setQuote(data.quote);
        //console.log("Data quote", data.quote);

        // Map backend appliedDiscount to customDiscount
        const customDiscount = data.quote.appliedDiscount
          ? {
              type: data.quote.appliedDiscount.valueType === 'PERCENTAGE' ? 'percentage' : 'fixed',
              value: data.quote.appliedDiscount.value,
              reason: data.quote.appliedDiscount.description || '',
            }
          : undefined;

        // Map backend shippingLine to shippingMethod
        const shippingMethod = data.quote.shippingLine
          ? {
              name: data.quote.shippingLine.title || "Shipping",
              price: Number(data.quote.shippingLine.price) || 0,
              type: data.quote.shippingLine.type
            }
          : undefined;

        setEditedQuote({
          ...structuredClone(data.quote),
          customDiscount,
          shippingMethod,
        });
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchQuoteDetails();
  }, [encodedGid]);


  // --- NEW: Debounced product search
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setBrowseModalOpen(true);

    // Cancel previous fetch if any
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    const controller = new AbortController();
    searchAbortController.current = controller;

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/products/list?search=${encodeURIComponent(searchTerm)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
        
        const data = await res.json();
        setSearchResults(data.products || []); // Adjust key based on your API
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSearchError(err.message || 'Search error');
        }
      } finally {
        setSearchLoading(false);
      }
    }, 400); // debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);
  
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
  if (editedQuote?.paymentTerms) {
    setIsPaymentDueLater(true);
  }
}, [editedQuote]);

  function formatCurrency(amount?: number | string) {
    if (amount == null) return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '-' : num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  function handleDiscard() {
    setEditedQuote(structuredClone(quote)); // reset to original
    setIsEditing(false);
  }

  async function handleSave() {
    if (!editedQuote) return;

    setSaving(true);
    try {
      // Build lineItems payload
      const lineItems = (editedQuote.lineItems as LineItemExtended[]).map(item => {
        if (item.variantId?.startsWith("gid://shopify/ProductVariant/")) {
          return {
            variantId: item.variantId,
            quantity: item.quantity,
            requiresShipping: item.requiresShipping ?? false,
            taxable: item.taxable ?? false,
          };
        } else if (item.title && typeof item.price === 'number') {
          return {
            title: item.title,
            quantity: item.quantity,
            originalUnitPriceWithCurrency: {
              amount: item.price.toFixed(2),
              currencyCode: "USD",
            },
            requiresShipping: item.requiresShipping ?? false,
            taxable: item.taxable ?? false,
          };
        }
        return null;
      }).filter(Boolean);

      const payload: any = { lineItems };

      // Add custom discount if available
      if (editedQuote?.customDiscount && typeof editedQuote.customDiscount.value === 'number') {
        const isPercentage = editedQuote.customDiscount.type === 'percentage';
        payload.appliedDiscount = {
          description: editedQuote.customDiscount.reason || "",
          valueType: isPercentage ? 'PERCENTAGE' : 'FIXED_AMOUNT',
          value: editedQuote.customDiscount.value,
        };
      }

      // Add shipping line if available
      if (editedQuote.shippingMethod && typeof editedQuote.shippingMethod.price === 'number') {
        payload.shippingLine = {
          title: editedQuote.shippingMethod.name || "Shipping",
          price: editedQuote.shippingMethod.price,
          type: editedQuote.shippingLine?.type ?? 'custom'
        };
      }

      // Add tax lines if provided
      if (Array.isArray(editedQuote.taxLines) && editedQuote.taxLines.length > 0) {
        payload.taxLines = editedQuote.taxLines.map(tax => ({
          title: tax.title || "Tax",
          price: parseFloat(tax.priceSet?.shopMoney.amount ?? "0"),
          rate: tax.rate ?? undefined,
        }));
      }

      // Submit the update to the backend
      const encodedGid = encodeURIComponent(editedQuote.id);

      const res = await fetch(`/api/quotes/${encodedGid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save quote.");
      }

      // ✅ Refetch the updated quote immediately
      const updatedQuoteResponse = await fetch(`/api/quotes/${encodedGid}`);
      if (!updatedQuoteResponse.ok) {
        throw new Error("Failed to fetch updated quote after saving.");
      }

      const updatedQuoteData = await updatedQuoteResponse.json();
      const updatedQuote = updatedQuoteData.quote;
      //console.log("updatedQuote", updatedQuote);

      // ✅ Update both quote (view) and editedQuote (edit mode) state
      setQuote(updatedQuote);
      setEditedQuote({
            ...updatedQuote,
        customDiscount: updatedQuote.appliedDiscount
          ? {
              type: updatedQuote.appliedDiscount.valueType === 'PERCENTAGE' ? 'percentage' : 'fixed',
              value: updatedQuote.appliedDiscount.value,
              reason: updatedQuote.appliedDiscount.description || '',
            }
          : undefined,
        shippingMethod: updatedQuote.shippingLine
          ? {
              name: updatedQuote.shippingLine.title || 'Shipping',
              price: Number(updatedQuote.shippingLine.price) || 0,
            }
          : undefined,
      });

      // ✅ Exit editing mode
      setIsEditing(false);

      // ✅ Show success alert
      setAlert({ message: "Quote saved successfully!", type: "success" });

      // Optional callback
      if (onSaveSuccess) onSaveSuccess();

    } catch (error) {
      console.error("Failed to save quote:", error);
      setAlert({ message: "Failed to save the quote. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }


  function removeLineItem(index: number) {
    if (!editedQuote?.lineItems) return;
    const updatedItems = [...editedQuote.lineItems];
    updatedItems.splice(index, 1);
    setEditedQuote({ ...editedQuote, lineItems: updatedItems });
  }

  function updateQuantity(index: number, quantity: number) {
    if (!editedQuote?.lineItems) return;
    const updatedItems = [...editedQuote.lineItems];
    updatedItems[index].quantity = quantity;
    setEditedQuote({ ...editedQuote, lineItems: updatedItems });
  }

  function areAddressesEqual(addr1: any, addr2: any): boolean {
  if (!addr1 || !addr2) return false;

  const fieldsToCompare = [
    'company',
    'name',
    'address1',
    'address2',
    'city',
    'provinceCode',
    'zip',
    'country',
    'phone',
  ];

  return fieldsToCompare.every(field => {
    const a = addr1[field]?.trim?.() || '';
    const b = addr2[field]?.trim?.() || '';
    return a === b;
  });
}
//console.log("editedQuote?.lineItems", editedQuote?.lineItems);
// 1. Subtotal (already correct)
  const subtotal = Array.isArray(editedQuote?.lineItems)
  ? editedQuote.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  : 0;

//console.log("Subtotal:", subtotal);

//  console.log("Item price", quote, quote?.subtotalPrice, subtotal);

// 2. Custom Discount Amount (if any)
const customDiscountAmount = editedQuote?.customDiscount
  ? editedQuote.customDiscount.type === 'fixed'
    ? editedQuote.customDiscount.value
    : (editedQuote.customDiscount.value / 100) * subtotal
  : 0;
const discount = isNaN(customDiscountAmount) ? 0 : customDiscountAmount;

//console.log("editedQuote.customDiscount.value", editedQuote?.customDiscount);
// 3. Shipping and tax (ensure they’re numbers too)
const shipping = editedQuote?.shippingMethod?.price ?? 0;

const tax = typeof quote?.taxAmount === 'number' ? quote.taxAmount : 0;

// 4. Final Total
const total = subtotal + shipping + tax - discount;
// console.log("Subtotal:", subtotal, typeof subtotal);
// console.log("Discount:", discount, typeof discount);
// console.log("Shipping:", shipping, typeof shipping);
// console.log("Tax:", tax, typeof tax);
// console.log("Final total:", total, typeof total);
const senderEmails = ["pankit.b@ignitiv.com", "uddeshya.k@ignitiv.com"];
//console.log("!!editedQuote?.paymentTerms;", !!editedQuote?.paymentTerms);

// Prefill the 'from' with storeEmail or any default
  const defaultEmailPayload: EmailPayload = {
    from: senderEmails[0],   // e.g. "no-reply@yourshop.com"
    to: editedQuote?.customer?.email || "",
    subject: `Offer for Quote #${editedQuote?.id}`,
    customMessage: "",
    cc: "",
    bcc: "",
    lockPrices: false,
    allowDiscounts: false,
  };

//  console.log("quote", quote);
  const formattedQuoteId = quote?.name ? quote.name.replace(/^#?D/, '#Q') : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-details-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-gray-300 bg-opacity-50 flex items-start justify-center p-6 overflow-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onCloseAction();
      }}
    >
      <div className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        {isEditing && (
            <div className="flex justify-center mt-4 mb-4">
                <div className="flex w-100 flex-col sm:flex-row sm:items-center sm:justify-between bg-yellow-100 border border-yellow-200 text-yellow-900 rounded-lg px-2 py-2">
                  <div className="flex items-center mb-3 sm:mb-0">
                    <svg
                      className="w-5 h-5 text-yellow-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.58 16.89A9 9 0 1118.42 7.11 9 9 0 015.58 16.89z" />
                    </svg>
                    <span className="text-sm font-medium">Unsaved changes</span>
                  </div>
                  <div className="flex gap-3 justify-center sm:justify-end">
                    <button
                      onClick={handleDiscard}
                      disabled={saving}
                      className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-1 rounded text-sm transition"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`text-white px-4 py-1 rounded text-sm transition ${
                        saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
            </div>
          )}
        <header className="flex justify-between items-center px-8 py-5 border-b border-gray-200 sticky top-0 bg-white z-20">
          {/* Left section: Quote ID + Edit */}
          <div className="flex items-center gap-4">
            <h2 id="quote-details-title" className="text-xl font-semibold text-gray-900 select-text flex items-center gap-2">
              Quote Details:
              {formattedQuoteId ? (
                <span>{formattedQuoteId}</span>
              ) : (
                <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
              )}
            </h2>

            <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setEditPromptVisible(false);
                }}
                className={`text-sm hover:underline cursor-pointer ${
                  !isEditing && editPromptVisible ? 'text-red-600 font-bold' : 'text-indigo-600'
                }`}
              >
                {isEditing ? 'Cancel' : 'Edit'}
            </button>
            {/* Display the alert message if it's set */}
            {alert && (
              <div
                className={`px-4 py-2 mb-4 text-sm rounded-lg border ${
                  alert.type === 'success'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}
                role="alert"
              >
                <span className="font-medium">
                  {alert.type === 'success' ? 'Success' : 'Error'}!
                </span>
                <span className="block sm:inline ml-1">{alert.message}</span>
              </div>

            )}
            {editPromptVisible && !isEditing && (
              <div
                className={`flex items-center text-red-500 text-xs bg-red-50 border border-red-400 rounded-full px-3 py-1 whitespace-nowrap transition-opacity duration-500 ease-in-out ${
                  editPromptVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0 text-red-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l5.516 9.8c.75 1.332-.213 2.992-1.742 2.992H4.483c-1.53 0-2.492-1.66-1.742-2.992l5.516-9.8zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-2a.75.75 0 01-.75-.75v-2.5a.75.75 0 011.5 0v2.5A.75.75 0 0110 11z"
                    clipRule="evenodd"
                  />
                </svg>
                Please click <span className="font-bold mx-1">Edit</span> button to make changes.
              </div>
            )}
          </div>

          {/* Right section: Close button */}
          <button
            onClick={onCloseAction}
            aria-label="Close modal"
            className="p-2 rounded-full outline cursor-pointer ring-indigo-500 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex flex-grow overflow-hidden">
          {/* Left Panel: Products + Payment + Metafields */}
          <section className="flex flex-col flex-grow overflow-y-auto p-8 space-y-10 border-r border-gray-200">

            {/* Products */}
           <section className="border border-gray-300 bg-white rounded-lg shadow-md p-4">
              {/* Heading */}
              <div className="mb-4 flex justify-between items-center">
                <h4 className="font-bold text-gray-900">Products</h4>
              </div>

              {/* Search + Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <input
                  type="search"
                  placeholder="Search products"
                  className="border border-gray-300 rounded-md px-4 py-2 text-sm w-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  value={searchTerm}
                  onChange={(e) => {
                    if (!isEditing) {
                      setEditPromptVisible(true);
                      setTimeout(() => setEditPromptVisible(false), 3000);
                      return;
                    }
                    setSearchTerm(e.target.value);
                  }}
                  disabled={!isEditing}
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) {
                      setEditPromptVisible(true);
                      setTimeout(() => setEditPromptVisible(false), 3000);
                      return;
                    }
                    setBrowseModalOpen(true);
                  }}
                  className="hover:bg-gray-100 px-5 py-2 border border-gray-300 rounded-lg shadow-md text-sm transition disabled:opacity-50"
                  disabled={!isEditing}
                >
                Browse
                </button>

                {browseModalOpen && (
                  <BrowseProductsModal
                    onClose={() => {
                      setBrowseModalOpen(false);
                      setSearchTerm('');
                      setSearchResults([]);
                      setSearchError(null);
                    }}
                    onSelect={(selectedProducts) => {
                      //console.log("[QuoteDetailsModal] Products selected from modal:", selectedProducts);
                      const newItems: LineItem[] = selectedProducts.map((p) => ({
                        id:p.id,
                        title: p.title,
                        quantity: 1,
                        price: p.price,
                        variantId: p.variantId ?? undefined,
                        image: p.image,
                        isCustom: false,
                      }));
                      

                      setEditedQuote((prev) => ({
                        ...prev!,
                        lineItems: [...(prev?.lineItems || []), ...newItems],
                      }));

                      setBrowseModalOpen(false);
                      setSearchTerm(''); // reset after selection
                      setSearchResults([]);
                    }}
                    setSearchTerm={setSearchTerm} 
                    searchTerm={searchTerm}
                  />
                )}
                {/* <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) {
                      setEditPromptVisible(true);
                      setTimeout(() => setEditPromptVisible(false), 3000);
                      return;
                    }
                    setShowAddCustomModal(true);
                  }}
                  className="hover:bg-gray-100 px-5 py-2 border border-gray-300 rounded-lg shadow-md text-sm transition disabled:opacity-50"
                  disabled={!isEditing}
                >
                  Add custom item
                </button> */}

                {/* {showAddCustomModal && (
                  <AddCustomItemModal
                    onClose={() => setShowAddCustomModal(false)}
                    onAdd={(customItem) => {
                      const newItem: LineItem = {
                        id: `custom-${Date.now()}`,
                        title: customItem.title,
                        price: customItem.price,
                        quantity: customItem.quantity,
                        isCustom: true,
                        image: undefined,
                      };

                      setEditedQuote((prev) => ({
                        ...prev!,
                        lineItems: [...(prev?.lineItems || []), newItem],
                      }));
                    }}
                  />
                )}  */}
              </div>

              {/* Loading & Error states */}
              {loading && (
                <p className="text-gray-500 text-center py-10">Loading products…</p>
              )}
              {error && (
                <p className="text-red-600 text-center py-10">{error}</p>
              )}

              {/* Product Table */}
              {!loading && !error && (
                <>
                  {/* Product Table */}
                {editedQuote?.lineItems && editedQuote.lineItems.length > 0 ? (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 items-center bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 border-b border-gray-300">
                      <div className="col-span-8">Product</div>
                      <div className="col-span-2 text-center">Quantity</div>
                      <div className="col-span-2 text-center">Total</div>
                    </div>

                    {/* Line Items */}
                    {editedQuote.lineItems.map((item, idx) => (
                      <div
                        key={item.id + '-' + idx}
                        className="grid grid-cols-12 items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50"
                      >
                        {/* Product (Image + Title + Price) */}
                        <div className="col-span-8 flex items-center space-x-4">
                          {item.image?.url ? (
                            <img
                              src={item.image.url}
                              alt={item.image.altText || item.title}
                              className="w-14 h-14 object-contain rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gray-100 flex items-center justify-center text-gray-400 text-xs rounded border border-gray-200">
                              No Image
                            </div>
                          )}

                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-blue-600 cursor-pointer"
                                onClick={() => {
                                  if (!isEditing) {
                                    setEditPromptVisible(true);
                                    setTimeout(() => setEditPromptVisible(false), 3000);
                                  }
                                }}
                              >
                                ${item.price.toFixed(2)}
                              </div>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2 text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                            readOnly={!isEditing}
                            className={`w-16 text-center border rounded-md py-1 px-2 text-sm ${
                              isEditing ? 'border-gray-300' : 'border-transparent bg-transparent'
                            }`}
                          />
                        </div>

                        {/* Total */}
                        <div className="col-span-2 text-center text-sm font-medium text-gray-900 flex items-center justify-center space-x-3">
                          <span>${(item.quantity * item.price).toFixed(2)}</span>
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(idx)}
                              className="text-gray-400 hover:text-red-600 text-xl font-bold"
                              aria-label="Remove item"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center italic text-gray-500 py-8">No products found.</p>
                )}
                </>
              )}
           </section>

            {/* Payment */}
            <section className="border border-gray-300 bg-white rounded-lg shadow-md p-4">
              <h4 className="font-bold mb-6">Payment</h4>

              {/* Payment Summary */}
              <div className="space-y-3 text-gray-700 text-sm rounded-lg border border-gray-300 p-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isEditing) {
                            setEditPromptVisible(true);
                            setTimeout(() => setEditPromptVisible(false), 3000); // Reset after 3s
                            return;
                          }
                          setShowDiscountModal(true);
                        }}
                        className="text-blue-600 hover:underline focus:outline-none text-sm"
                        aria-label="Edit discount"
                      >
                        Add discount
                      </button>
                    </div>
                    {editedQuote?.customDiscount && (
                      <div className="text-sm text-gray-700">
                        {editedQuote.customDiscount.reason?.trim()
                          ? editedQuote.customDiscount.reason
                          : 'Custom discount'}
                      </div>
                    )}

                    <div className="text-sm text-gray-900 font-medium">
                      {formatCurrency(customDiscountAmount ? -customDiscountAmount : customDiscountAmount)}
                    </div>
                  </div>

                {/* Custom discount modal only */}
                {showDiscountModal && (
                  <AddDiscountModal
                    onClose={() => setShowDiscountModal(false)}
                    subtotal={subtotal}
                    formatCurrency={formatCurrency}
                    initialDiscount={
                      editedQuote?.customDiscount
                        ? {
                            type: editedQuote.customDiscount.type,
                            value: editedQuote.customDiscount.value,
                            reason: editedQuote.customDiscount.reason ?? '', // 👈 ensure string
                          }
                        : null
                    }
                    onApplyDiscount={({ customDiscount }) => {
                      if (!customDiscount) return;

                      setEditedQuote((prev) =>
                        prev
                          ? {
                              ...prev,
                              customDiscount: {
                                type: customDiscount.type,
                                value: customDiscount.value,
                                reason: customDiscount.reason ?? '',
                              },
                              // Future: discountCode: discountCode ?? prev.discountCode,
                            }
                          : prev
                      );
                    }}
                  />
                )}
                <div className="flex justify-between items-start">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditing) {
                        setEditPromptVisible(true);
                        setTimeout(() => setEditPromptVisible(false), 3000); // auto hide
                        return;
                      }
                      setShippingOrDeliveryModal(true);
                    }}
                    className="text-blue-600 hover:underline focus:outline-none text-sm"
                    aria-label="Add shipping or delivery"
                  >
                    Add shipping or delivery
                  </button>


                  {editedQuote?.shippingMethod && (
                    <div className="text-sm text-gray-700">
                      {editedQuote.shippingMethod.name?.trim()
                        ? editedQuote.shippingMethod.name
                        : 'Custom shipping'}
                    </div>
                  )}

                  <span>{formatCurrency(shipping)}</span>
                </div>
                {showShippingOrDeliveryModal && (
                  <>
                  {console.log('initialShipping:', editedQuote?.shippingMethod)}
                  <AddShippingDeliveryModal
                    onClose={() => setShippingOrDeliveryModal(false)}
                    onApply={(shippingOption) => {
                      //console.log('Selected shipping:', shippingOption);

                      // Example update:
                      setEditedQuote((prev) => ({
                        ...prev!,
                        shippingMethod: shippingOption,
                      }));
                      setShippingOrDeliveryModal(false);
                    }}
                    initialShipping={editedQuote?.shippingMethod || null}
                  />
                  </>
                )}

                <div className="flex justify-between items-center">
                  <span>
                    Estimated tax{' '}
                    <span
                      className="cursor-default text-gray-400"
                      title="Estimated tax is not calculated"
                      aria-label="Estimated tax info"
                    >
                      &#9432;
                    </span>
                  </span>
                  <span>{formatCurrency(quote?.taxAmount ?? 'Not calculated')}</span>
                </div>
                <div className="border-t border-gray-300 pt-4 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Payment Settings (Checkbox only) */}
              
              <div className="mt-6 rounded-lg border border-gray-300 p-3">
                {/* <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPaymentDueLater}
                    onChange={(e) => setIsPaymentDueLater(e.target.checked)}
                    className="form-checkbox rounded"
                  />
                  <span>Payment due later</span>
                </label> */}
                {editedQuote?.id && (
                    <PaymentDueSection 
                    draftOrderId={editedQuote.id} 
                    currentPaymentTermId={editedQuote?.paymentTerms?.id || ''}
                    draftOrderStatus={editedQuote?.status}
                    />
                )}
              </div>



              {/* Action Buttons */}
              {editedQuote?.status !== "COMPLETED" && (
                <div className="mt-4 flex justify-end gap-4">
                  <button 
                      onClick={() => {
                        setShowSendInvoiceModal(true);
                      }}
                      className="hover:bg-gray-100 px-5 py-2 border border-gray-300 rounded-lg shadow-md text-sm transition"
                    >
                      {editedQuote?.status === "INVOICE_SENT" ? "Resend offer" : "Send offer"}
                  </button>

                  <>
                    {/* Your other UI */}

                    {showSendInvoiceModal && editedQuote && (
                      <SendInvoiceModal
                        initialTo={defaultEmailPayload.to}
                        initialFrom={defaultEmailPayload.from}
                        senderOptions={senderEmails}
                        invoiceSent={false} // or true if needed
                        quote={editedQuote}
                        onClose={() => setShowSendInvoiceModal(false)}
                        onSend={async (emailPayload: EmailPayload & { from: string }) => {
                          if (!emailPayload.to) {
                            setAlert({ message: "Recipient email is required.", type: "error" });
                            return;
                          }

                          if (!emailPayload.from) {
                            setAlert({ message: "Sender email is required.", type: "error" });
                            return;
                          }

                          setInvoiceSending(true);
                          try {
                            await sendDraftOrderInvoice(editedQuote.id, emailPayload);
                            setAlert({ message: "Offer sent successfully!", type: "success" });
                            setShowSendInvoiceModal(false);
                            setTimeout(() => setAlert(null), 5000);
                          } catch (err: any) {
                            console.error("Error message", err);
                            setAlert({ message: err.message || "Failed to send offer.", type: "error" });
                            setTimeout(() => setAlert(null), 5000);
                          } finally {
                            setInvoiceSending(false);
                          }
                        }}
                      />

                    )}
                  </>


                  {/* <div className="relative">
                    <button className="bg-black text-white hover:bg-gray-800 text-white px-5 py-2 border border-gray-300 rounded-lg shadow-md text-sm transition">
                      Collect payment ▼
                    </button>
                  </div> */}
                </div>
              )} 
            </section>

            {/* Metafields */}
            <section className="border border-gray-300 bg-white rounded-lg shadow-md p-4">
              <h4 className="font-bold mb-3">Metafields</h4>
              <label
                htmlFor="latest-draft-order"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Latest Draft Order
              </label>
              <input
                id="latest-draft-order"
                type="text"
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-600 placeholder-gray-400"
                value="" // Bind metafield value here if available
                placeholder="No value"
              />
              <a
                href="#"
                className="text-indigo-600 text-sm mt-3 inline-block hover:underline"
                tabIndex={0}
              >
                View all
              </a>
            </section>
          </section>

          {/* Right Sidebar */}
          <aside className="w-96 border-l border-gray-200 p-6 flex flex-col space-y-8 overflow-y-auto">
            {/* Notes */}
            <section className="border border-gray-300 bg-white rounded-lg shadow-md p-4">
              <h4 className="font-bold mb-3">Notes</h4>
              {quote?.notes ? (
                <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
              ) : (
                <p className="text-gray-400 italic">No notes provided</p>
              )}
            </section>

            {/* Customer Info */}
            <section className="border border-gray-300 bg-white rounded-lg shadow-md p-4">
              
              {quote?.customer ? (
                <>
                  <div className="mb-4">
                    <h4 className="font-bold mb-2">Customer</h4>
                    <p className="text-blue-600 text-sm">
                      <a href={`mailto:${quote.customer.email}`} className="hover:underline">
                        {[quote.customer.firstName, quote.customer.lastName].filter(Boolean).join(' ') || '—'}
                      </a>
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-bold mb-2 text-sm">Contact Information</h4>
                    <p className="text-blue-600 text-sm mb-3">
                      <a href={`mailto:${quote.customer.email}`} className="hover:underline">
                        {quote.customer.email}
                      </a>
                    </p>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-bold mb-2 text-sm">Company</h4>
                    <p className="text-blue-600 text-sm mb-2">{quote.companyName || '-'}</p>
                    <p className="text-blue-600 text-sm mb-2">{quote.locationName || '-'}</p> 
                  </div>
                  <div className="mb-4">
                    <h4 className="font-bold mb-2 text-sm">Shipping address</h4>
                    <address className="not-italic mb-3 text-sm leading-relaxed">
                        {quote.shippingAddress ? (
                          <>
                            {quote.shippingAddress.company && <>{quote.shippingAddress.company}<br /></>}
                            {quote.shippingAddress.name && <>{quote.shippingAddress.name}<br /></>}
                            {quote.shippingAddress.address1 && <>{quote.shippingAddress.address1}<br /></>}
                            {quote.shippingAddress.address2 && <>{quote.shippingAddress.address2}<br /></>}
                            {[quote.shippingAddress.city, quote.shippingAddress.provinceCode, quote.shippingAddress.zip]
                              .filter(Boolean)
                              .join(' ')}
                            <br />
                            {quote.shippingAddress.country}
                            <br />
                            {quote.shippingAddress.phone && <>{quote.shippingAddress.phone}<br /></>}
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(
                                [
                                  quote.shippingAddress.address1,
                                  quote.shippingAddress.address2,
                                  quote.shippingAddress.city,
                                  quote.shippingAddress.provinceCode,
                                  quote.shippingAddress.zip,
                                  quote.shippingAddress.country,
                                ].filter(Boolean).join(', ')
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm inline-block hover:text-blue-800"
                            >
                              View map
                            </a>
                          </>
                        ) : (
                          <em>No shipping address provided.</em>
                        )}
                    </address>
                  </div>
                  <div className="mb-2">
                    <h4 className="font-bold mb-2 text-sm">Billing address</h4>
                    <address className="not-italic mb-3 text-sm leading-relaxed">
                      {quote.billingAddress ? (
                        areAddressesEqual(quote.billingAddress, quote.shippingAddress) ? (
                          <span>Same as shipping address</span>
                        ) : (
                          <>
                            {quote.billingAddress.company && <>{quote.billingAddress.company}<br /></>}
                            {quote.billingAddress.name && <>{quote.billingAddress.name}<br /></>}
                            {quote.billingAddress.address1 && <>{quote.billingAddress.address1}<br /></>}
                            {quote.billingAddress.address2 && <>{quote.billingAddress.address2}<br /></>}
                            {[quote.billingAddress.city, quote.billingAddress.provinceCode, quote.billingAddress.zip]
                              .filter(Boolean)
                              .join(' ')}
                            <br />
                            {quote.billingAddress.country}
                            <br />
                            {quote.billingAddress.phone && <>{quote.billingAddress.phone}<br /></>}
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(
                                [
                                  quote.billingAddress.address1,
                                  quote.billingAddress.address2,
                                  quote.billingAddress.city,
                                  quote.billingAddress.provinceCode,
                                  quote.billingAddress.zip,
                                  quote.billingAddress.country,
                                ].filter(Boolean).join(', ')
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm inline-block hover:text-blue-800"
                            >
                              View map
                            </a>
                          </>
                        )
                      ) : (
                        <em>No billing address provided.</em>
                      )}
                    </address>

                  </div>
                </>
              ) : (
                <p className="italic text-gray-500">No customer information available.</p>
              )}
            </section>

            {/* Markets and Currency */}
            <section className="border border-gray-300 bg-white rounded-lg shadow-md p-4">
              <h4 className="font-bold mb-3">Markets</h4>
              <div className="flex flex-col space-y-3 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{quote?.locationName || 'Global'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L6.75 17.25" />
                  </svg>
                  <span>{quote?.presentmentCurrencyCode || 'USD'}</span>
                </div>
              </div>
            </section>

            {/* Tags */}
            <section className="border border-gray-300 bg-white rounded-lg shadow-md p-4">
              <h4 className="font-bold mb-3">Tags</h4>
              {quote?.tags && quote.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {quote.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer hover:bg-indigo-100 transition"
                    >
                      {tag}
                      <button
                        type="button"
                        aria-label={`Remove tag ${tag}`}
                        className="ml-1 text-gray-400 hover:text-indigo-600 cursor-pointer focus:outline-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No tags assigned.</p>
              )}
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}

