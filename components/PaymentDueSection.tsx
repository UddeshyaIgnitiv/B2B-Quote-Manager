'use client';

import React, { useState, useEffect } from 'react';
import type { PaymentDueSectionProps, PaymentTerms } from "@/types/quotes";
import dayjs from 'dayjs';

export default function PaymentDueSection({ draftOrderId, currentPaymentTermId, draftOrderStatus }: PaymentDueSectionProps) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [issueDate, setIssueDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [displayedIssueDate, setDisplayedIssueDate] = useState(issueDate);
  const [dueDays, setDueDays] = useState<number | null>(null);
  const [termName, setTermName] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasExistingTerms, setHasExistingTerms] = useState<boolean>(false);

  console.log("displayedIssueDate", displayedIssueDate);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/payment-terms?draftOrderId=${draftOrderId}`);
        const data = await res.json();

        console.log("⚙️ API Response:", data);

        setTemplates(data.templates || []);

        if (data.paymentTerms && data.paymentTerms.id) {
          setHasExistingTerms(true);

          // Find matching template by dueInDays and translatedName to get correct template id for dropdown
        const matchingTemplate = (data.templates || []).find(
          (template: PaymentTerms) =>
            template.dueInDays === data.paymentTerms.dueInDays &&
            (template.translatedName === data.paymentTerms.translatedName || template.name === data.paymentTerms.translatedName)
        );

        if (matchingTemplate) {
          setSelectedId(matchingTemplate.id); // preselect the matching template ID
        } else {
          setSelectedId(''); // fallback if no match
        }


          //setSelectedId(data.paymentTerms.id);

          // ALWAYS set dueDays from response
          const dd = data.paymentTerms.dueInDays;
          console.log("⚙️ API: dueInDays:", dd);
          setDueDays(dd ?? null);

          const tn = data.paymentTerms.translatedName || '';
          setTermName(tn);

          // If API gives schedules, pick issuedAt
          const schedule = data.paymentTerms.paymentSchedules?.edges?.[0]?.node;
          if (schedule && schedule.issuedAt) {
            const iso = schedule.issuedAt.substring(0, 10);
            setIssueDate(iso);
            console.log("⚙️ API schedule issuedAt:", schedule.issuedAt, "->", iso);
          }

          // Keep form collapsed initially
          setEnabled(false);
        } else {
          console.log("⚙️ No existing paymentTerms in API");
          setHasExistingTerms(false);
          if (currentPaymentTermId) {
            setSelectedId(currentPaymentTermId);
          }
        }

      } catch (err) {
        console.error("❌ Error loading payment terms:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [draftOrderId, currentPaymentTermId]);

  // Logging the internal state each render
  console.log("🔍 State:", {
    enabled,
    hasExistingTerms,
    dueDays,
    termName,
    issueDate,
    selectedId,
    templatesLength: templates.length,
  });

  const updateTerms = async () => {
    if (!selectedId) return;
    setStatus('idle');
    try {
      const res = await fetch('/api/payment-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftOrderId, templateId: selectedId, issueDate }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStatus('success');
      setHasExistingTerms(true);
      setEnabled(false);
      // Update displayedIssueDate immediately:
      setTimeout(() => {
        setDisplayedIssueDate(issueDate); // Ensure immediate update
      }, 100);

      console.log("✅ updateTerms success:", data);
    } catch (err) {
      console.error("❌ updateTerms error:", err);
      setStatus('error');
    }
  };

  if (draftOrderStatus === 'COMPLETED') {
    return (
      <section aria-labelledby="payment-terms-section">
        {dueDays !== null ? (
          <p className="text-sm text-gray-700 font-semibold">
            Payment due on {dayjs(issueDate).add(dueDays, 'day').format('MMMM D, YYYY')} ({termName})
          </p>
        ) : (
          <p className="text-sm text-gray-700">Payment terms are not available.</p>
        )}
      </section>
    );
  }

  return (
  <section aria-labelledby="payment-terms-section">
    <label htmlFor="enable-payment-terms" className="flex items-center space-x-3 cursor-pointer">
      <input
        id="enable-payment-terms"
        type="checkbox"
        checked={enabled}
        onChange={() => setEnabled(!enabled)}
        className="form-checkbox h-5 w-4 text-blue-600"
        aria-describedby="payment-terms-desc"
      />
      <span className="text-md font-semibold">Payment due later</span>
    </label>

    {/* 🔁 Dynamic message block */}
    {!enabled && hasExistingTerms && dueDays !== null ? (
      <div className="mt-3 flex items-center justify-start text-sm text-gray-700">
        <svg
          className="inline w-4 h-4 text-blue-500 mr-1"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <title>{`Payment term ${termName} is already set.`}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <p><strong>Payment due on {dayjs(displayedIssueDate).add(dueDays, 'day').format('MMMM D, YYYY')} ({termName}).</strong> You’ll be able to collect the balance from the order page.</p>
      </div>
    ) : !enabled ? (
      <p id="payment-terms-desc" className="text-sm text-gray-500 mt-1">
        Enable payment terms to select due date and terms for this order.
      </p>
    ) : (
      <p id="payment-terms-desc" className="text-sm text-gray-700 mt-1">
        <strong>Payment due when invoice is sent. </strong>You’ll be able to collect the balance from the order page.
      </p>
    )}

    {/* 🧾 Form shows only when enabled */}
    {enabled && !loading && (
      <>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="payment-terms-select" className="block text-sm font-medium text-gray-700 mb-1">
              Payment terms
            </label>
            <select
              id="payment-terms-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>Select a term...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.translatedName || t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="issue-date" className="block text-sm font-medium text-gray-700 mb-1">
              Issue date
            </label>
            <input
              id="issue-date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {dueDays !== null && (
          <p className="mt-4 text-sm text-gray-700">
            <strong>
              Payment due on {dayjs(issueDate).add(dueDays, 'day').format('MMMM D, YYYY')} ({termName}).
            </strong> You’ll be able to collect the balance from the order page.
          </p>
        )}

        <button
          onClick={updateTerms}
          className={`mt-6 w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            !selectedId || status === 'success' ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {status === 'success' ? 'Saved!' : 'Save Terms'}
        </button>

        {status === 'error' && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            Error saving payment terms. Please try again.
          </p>
        )}
      </>
    )}
  </section>
);
}
