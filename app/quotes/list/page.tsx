"use client";

import { useEffect, useState } from "react";
import { useAppBridge } from "@/app/providers";
import { Quote } from "@/types/quotes";
import Link from "next/link";

export default function QuoteListPage() {
  const app = useAppBridge();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app) return;

    const Toast = require("@shopify/app-bridge/actions").Toast;
    Toast.create(app, { message: "Welcome to the B2B Quote Manager!" }).dispatch(Toast.Action.SHOW);

    fetch("/api/quotes")
      .then((res) => res.json())
      .then((data: Quote[]) => {
        setQuotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [app]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quotes</h1>
          <p className="text-gray-600">Manage all your B2B quotes here.</p>
        </header>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Quote List</h2>
            <Link href="/quotes/create">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Request a Quote
              </button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created At</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6">Loading...</td>
                  </tr>
                ) : quotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6">No quotes found.</td>
                  </tr>
                ) : (
                  quotes.map((quote) => (
                    <tr key={quote.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{quote.id}</td>
                      <td className="px-6 py-4">{quote.customer}</td>
                      <td className="px-6 py-4">{quote.totalPrice}</td>
                      <td className="px-6 py-4">{quote.createdAt}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            quote.status === "Pending"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          {quote.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
