import { useState, useEffect } from "react";
import type { SendInvoiceModalProps } from "@/types/quotes";
import dayjs from "dayjs";
import Image from 'next/image';



export default function SendInvoiceModal({
  onClose,
  onSend,
  initialTo = "",
  initialFrom = "",
  senderOptions = [],
  invoiceSent = false,
  quote
}: SendInvoiceModalProps) {
  // Track the modal step: review -> complete -> resend
  const [step, setStep] = useState<"review" | "complete" | "resend">(
    invoiceSent ? "resend" : "review"
  );

  const [to, setTo] = useState(initialTo);
  const [from, setFrom] = useState(initialFrom || (senderOptions.length > 0 ? senderOptions[0] : ""));
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [lockPrices, setLockPrices] = useState(false);
  const [allowDiscounts, setAllowDiscounts] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);


  //console.log("quote Status", quote?.status);
  const quoteName = quote?.name ? quote.name.replace(/^#?D/, '#Q') : '';
  useEffect(() => {
    setTo(initialTo);
  }, [initialTo]);

  useEffect(() => {
    setFrom(initialFrom || (senderOptions.length > 0 ? senderOptions[0] : ""));
  }, [initialFrom, senderOptions]);

  // Called when user clicks "Review Invoice" from form
  const handleReview = () => {
    if (!to.trim()) {
      alert("Recipient email is required.");
      return;
    }
    if (!from.trim()) {
      alert("Sender email is required.");
      return;
    }
    setStep("complete");
  };

  // Called when user confirms send in complete step
  const handleSend = () => {
    onSend({
      to: to.trim(),
      from: from.trim(),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      subject: subject.trim() || undefined,
      customMessage: customMessage.trim() || undefined,
      lockPrices,
      allowDiscounts,
      quoteStatus: quote?.status,
    });
    setStep("resend");
  };

  // Render preview of invoice info for review step
  const renderInvoiceSummary = () => (
    <div className="space-y-4 text-gray-800 text-sm">
        {/* Header Info */}
        <div className="border border-gray-200 rounded-md p-4 space-y-2 bg-white">
        <div className="flex items-center justify-between">
            <p><span className="font-semibold">From:</span> {from}</p>
        </div>
        <div className="flex items-center justify-between">
            <p><span className="font-semibold">To:</span> {to}</p>
        </div>
        <div className="flex items-center justify-between">
            <p><span className="font-semibold">Subject:</span> {subject}</p>
        </div>
        </div>

        {/* Store Banner & Call to Action */}
        <div className="border border-gray-200 rounded-md bg-white p-6 text-center space-y-4">
        <div className="flex items-start justify-between mb-4">
            <div className="text-left">
            <h2 className="text-2xl font-semibold">{quote?.companyName || "Ignitiv-demo-store"}</h2>
            <p className="text-xl font-medium">{quote?.paymentTerms ? "Review and confirm to complete your order" : "Complete your purchase"}</p>
            </div>
            <div className="text-right text-sm text-gray-500 font-medium">
            OFFER
            <span className="ml-1 font-semibold text-gray-700">{quoteName}</span>
            </div>
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition">
            {quote?.paymentTerms ? "Confirm order" : "Complete your purchase"}
        </button>
        <p className="text-sm text-gray-600">
            or <a href="#" className="text-blue-600 underline">Visit our store</a>
        </p>
        </div>

        {/* Order Summary */}
        <div className="border border-gray-200 rounded-md bg-white p-4 space-y-4">
            <h3 className="font-semibold text-base">Order summary</h3>

            {quote?.lineItems?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center">
                    {item.image?.url ? (
                    <Image src={item.image.url} alt={item.image.altText || "Product Image"} width={56} height={56} className="object-cover rounded-md" />
                    ) : (
                    <span className="text-gray-400">🖼️</span>
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-medium leading-snug">
                    {item.title} × {item.quantity}
                    </p>
                </div>
                <div className="text-right font-semibold">
                    ${Number(item.price * item.quantity).toFixed(2)}
                </div>
                </div>
            ))}

            <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${quote?.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                <span>Shipping</span>
                <span>${Number(quote?.shippingLine?.price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                <span>Estimated taxes</span>
                <span>${quote?.taxAmount || "0.00"}</span>
                </div>
            </div>

            <div className="border-t pt-4 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>
                    {isNaN(Number(quote?.totalPrice))
                        ? '—'
                        : `$${Number(quote.totalPrice).toFixed(2)} ${quote?.presentmentCurrencyCode || "USD"}`}
                </span>

            </div>
        </div>

        {/* Customer Information */}
        <div className="border border-gray-200 rounded-md bg-white p-4 space-y-6">
            <h3 className="font-semibold text-base">Customer information</h3>

            {/* Shipping Address */}
            {quote?.shippingAddress && (
                <div>
                <h4 className="font-semibold text-sm mb-1">Shipping address</h4>
                {quote.customer && (
                    <p className="text-sm text-gray-800">
                    {quote.customer.firstName} {quote.customer.lastName}
                    </p>
                )}
                <p className="text-sm text-gray-800">{quote.shippingAddress.address1}</p>
                {quote.shippingAddress.address2 && (
                    <p className="text-sm text-gray-800">{quote.shippingAddress.address2}</p>
                )}
                <p className="text-sm text-gray-800">
                    {quote.shippingAddress.city}, {quote.shippingAddress.provinceCode} {quote.shippingAddress.zip}
                </p>
                <p className="text-sm text-gray-800">{quote.shippingAddress.country}</p>
                {quote.shippingAddress.phone && (
                    <p className="text-sm text-gray-800">{quote.shippingAddress.phone}</p>
                )}
                </div>
            )}

            {/* Billing Address */}
            {quote?.billingAddress && (
                <div>
                <h4 className="font-semibold text-sm mb-1">Billing address</h4>
                <p className="text-sm text-gray-800">{quote.billingAddress.name}</p>
                <p className="text-sm text-gray-800">{quote.billingAddress.address1}</p>
                {quote.billingAddress.address2 && (
                    <p className="text-sm text-gray-800">{quote.billingAddress.address2}</p>
                )}
                <p className="text-sm text-gray-800">
                    {quote.billingAddress.city}, {quote.billingAddress.provinceCode} {quote.billingAddress.zip}
                </p>
                <p className="text-sm text-gray-800">{quote.billingAddress.country}</p>
                {quote.billingAddress.phone && (
                    <p className="text-sm text-gray-800">{quote.billingAddress.phone}</p>
                )}
                </div>
            )}

            {/* Company & Location */}
            {(quote?.companyName || quote?.locationName) && (
                <div>
                <h4 className="font-semibold text-sm mb-1">Company / Location</h4>
                {quote.companyName && (
                    <p className="text-sm text-gray-800">{quote.companyName}</p>
                )}
                {quote.locationName && (
                    <p className="text-sm text-gray-800">{quote.locationName}</p>
                )}
                </div>
            )}

            {/* Company & Location */}
            {(quote?.status === "INVOICE_SENT" && quote?.paymentTerms) && (
            <div>
                <h4 className="font-semibold text-sm mb-1">Payment</h4>
                <p className="text-sm text-gray-800">
                {quote.paymentTerms.translatedName}: Due{" "}
                {dayjs(quote.createdAt).add(quote.paymentTerms.dueInDays, 'day').format("MMMM D, YYYY")}
                </p>
            </div>
            )}


            {/* Company & Location */}
            {/* {(quote?.status === "INVOICE_SENT" && quote?.companyName) && (
                <div>
                <h4 className="font-semibold text-sm mb-1">Shipping method</h4>
                {quote.companyName && (
                    <p className="text-sm text-gray-800">{quote.companyName}</p>
                )}
                {quote.locationName && (
                    <p className="text-sm text-gray-800">{quote.locationName}</p>
                )}
                </div>
            )} */}
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 border-t pt-4">
        If you have any questions, reply to this email or contact us at{" "}
        <a href="mailto:pankit.b@ignitiv.com" className="text-blue-600 underline">pankit.b@ignitiv.com</a>
        </p>
    </div>
    );



  return (
    <div className="fixed inset-0 z-50 bg-gray-300 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl border border-gray-200 relative">
        {/* Modal Header */}
        <div className="p-4 border-b text-lg font-semibold">
          {step === "review" && "Send offer"}
          {step === "complete" && "Complete Your Purchase"}
          {step === "resend" && "Resend offer / Confirm Order"}
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Step: Review - show form */}
          {step === "review" && (
            <>
                {/* To & From Fields */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    >
                    {senderOptions.length > 0 ? (
                        senderOptions.map((email) => (
                        <option key={email} value={email}>
                            {email}
                        </option>
                        ))
                    ) : (
                        <option value="">No sender emails</option>
                    )}
                    </select>
                </div>
                </div>

                {/* Cc and Bcc toggle */}
                <div>
                <button
                    type="button"
                    className="text-blue-600 text-sm font-medium hover:underline mt-2"
                    onClick={() => setShowCcBcc(!showCcBcc)}
                >
                    Cc and Bcc recipients {showCcBcc ? "▲" : "▼"}
                </button>
                {showCcBcc && (
                    <div className="mt-3 space-y-3">
                    <input
                        type="email"
                        placeholder="Cc (optional)"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                        type="email"
                        placeholder="Bcc (optional)"
                        value={bcc}
                        onChange={(e) => setBcc(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    />
                    </div>
                )}
                </div>

                {/* Subject */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                    type="text"
                    value={subject}
                    placeholder="Offer {{name}}"
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
                </div>

                {/* Custom Message */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom message (optional)</label>
                <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none"
                />
                </div>

                {/* Toggles for Lock Prices and Discounts */}
                <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* Lock Prices */}
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setLockPrices(!lockPrices)}
                >
                    <div>
                    <p className="text-sm font-medium text-gray-900">Product prices</p>
                    <p className="text-xs text-gray-500">Lock all product prices so they don’t change</p>
                    </div>
                    <button
                    type="button"
                    role="switch"
                    aria-checked={lockPrices}
                    onClick={(e) => {
                        e.stopPropagation();
                        setLockPrices(!lockPrices);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        lockPrices ? "bg-black" : "bg-gray-300"
                    }`}
                    >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        lockPrices ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                    </button>
                </div>

                {/* Discount Codes */}
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setAllowDiscounts(!allowDiscounts)}
                >
                    <div>
                    <p className="text-sm font-medium text-gray-900">Discount codes</p>
                    <p className="text-xs text-gray-500">Allow your customer to enter discount codes</p>
                    </div>
                    <button
                    type="button"
                    role="switch"
                    aria-checked={allowDiscounts}
                    onClick={(e) => {
                        e.stopPropagation();
                        setAllowDiscounts(!allowDiscounts);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        allowDiscounts ? "bg-black" : "bg-gray-300"
                    }`}
                    >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        allowDiscounts ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                    </button>
                </div>
                </div>
            </>
          )}


          {/* Step: Complete your purchase (Review summary) */}
          {step === "complete" && (
            <>
              <p className="text-gray-600 mb-4">
                Please review the offer details below before confirming your purchase.
              </p>
              {renderInvoiceSummary()}
            </>
          )}

          {/* Step: Resend offer with confirm order */}
          {step === "resend" && (
            <>
              <p className="text-gray-600 mb-4">
                The offer has been sent successfully. You can resend the offer or confirm the order.
              </p>
              {renderInvoiceSummary()}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 flex justify-between items-center border-t bg-gray-50">
            {/* Left side: Back button */}
            <div>
                {step === "complete" && (
                <button
                    onClick={() => setStep("review")}
                    className="text-sm px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                >
                    Back
                </button>
                )}
            </div>

            {/* Right side: Action buttons */}
            <div className="flex gap-2">
                <button
                onClick={onClose}
                className="text-sm px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                Cancel
                </button>

                {quote?.status !== "COMPLETED" && (
                <>
                    {step === "review" && (
                    <button
                        onClick={handleReview}
                        className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Review Offer
                    </button>
                    )}

                    {step === "complete" && (
                    <button
                        onClick={handleSend}
                        className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Send offer
                    </button>
                    )}

                    {step === "resend" && (
                    <>
                        <button
                        onClick={() => setStep("review")}
                        className="text-sm px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                        >
                        Edit
                        </button>
                        <button
                        onClick={handleSend}
                        className="text-sm px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        >
                        Sending
                        </button>
                    </>
                    )}
                </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
