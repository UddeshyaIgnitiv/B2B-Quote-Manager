"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Quote {
  id: string;
  customer: string;
  totalPrice: string;
  createdAt: string;
  status: string;
}

export default function QuoteDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/quotes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: Quote) => {
        setQuote(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setQuote(null);
      });
  }, [id]);

  if (loading) return <div className="p-6">Loading quote details...</div>;
  if (!quote) return <div className="p-6 text-red-600">Quote not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Quote Details - {quote.id}</h1>
      <div className="bg-white p-6 rounded shadow">
        <p><strong>Customer:</strong> {quote.customer}</p>
        <p><strong>Total Price:</strong> {quote.totalPrice}</p>
        <p><strong>Created At:</strong> {quote.createdAt}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              quote.status === "Pending"
                ? "bg-yellow-200 text-yellow-800"
                : "bg-green-200 text-green-800"
            }`}
          >
            {quote.status}
          </span>
        </p>
      </div>

      <button
        onClick={() => router.back()}
        className="mt-6 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
      >
        Back to List
      </button>
    </div>
  );
}
