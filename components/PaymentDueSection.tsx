'use client';

import React, { useState, useEffect } from 'react';
import type { PaymentDueSectionProps } from "@/types/quotes";
import dayjs from 'dayjs';

export default function PaymentDueSection({ draftOrderId, currentPaymentTermId, draftOrderStatus}: PaymentDueSectionProps) {
  const [enabled, setEnabled] = useState<boolean>(!!currentPaymentTermId);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [issueDate, setIssueDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [dueDays, setDueDays] = useState<number | null>(null);
  const [termName, setTermName] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);


  //console.log("draftOrderStatus", draftOrderStatus, dueDays);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/payment-terms?draftOrderId=${draftOrderId}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        setTemplates(data.templates || []);

        if (data.paymentTerms && data.paymentTerms.id) {
          setEnabled(true);
          setSelectedId(data.paymentTerms.id);
          setDueDays(data.paymentTerms.dueInDays);
          setTermName(data.paymentTerms.translatedName);
        } else if (currentPaymentTermId) {
          setEnabled(true);
          setSelectedId(currentPaymentTermId);
        }
      } catch (err) {
        console.error('Error loading payment terms:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [draftOrderId, currentPaymentTermId]);

  useEffect(() => {
    const sel = templates.find(t => t.id === selectedId);
    if (sel) {
      setDueDays(sel.dueInDays);
      setTermName(sel.translatedName || sel.name);
    } else {
      setDueDays(null);
      setTermName('');
    }
  }, [selectedId, templates]);

  const updateTerms = async () => {
    if (!selectedId) return;
    setStatus('idle');
    try {
      const res = await fetch('/api/payment-terms', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ draftOrderId, templateId: selectedId, }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  // If draft order is completed, show only the payment due info, no controls
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

  // Otherwise, render your original form UI
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
      <p id="payment-terms-desc" className="text-sm text-gray-500 mt-1">
        Enable payment terms to select due date and terms for this order.
      </p>

      {loading && (
        <p className="mt-4 text-gray-500">Loading payment terms...</p>
      )}

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
            disabled={!selectedId || status === 'success'}
            className={`pointer-events-none opacity-50 mt-6 w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
