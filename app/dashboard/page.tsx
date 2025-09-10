// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAppBridge } from "@/app/providers";

interface DraftOrder {
  id: number;
  name: string;
  email: string;
  total_price: string;
  invoice_sent_at: string | null;
}

export default function DashboardPage() {
  const app = useAppBridge();
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDraftOrders() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/draft-orders");
        if (!response.ok) throw new Error("Failed to fetch draft orders");

        const data = await response.json();
        setDraftOrders(data.draft_orders);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDraftOrders();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Draft Orders</h1>

      {loading && <p>Loading draft orders...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <table className="min-w-full border border-gray-300 rounded-md overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-4 py-2 border-b">ID</th>
            <th className="text-left px-4 py-2 border-b">Name</th>
            <th className="text-left px-4 py-2 border-b">Email</th>
            <th className="text-left px-4 py-2 border-b">Total Price</th>
            <th className="text-left px-4 py-2 border-b">Offer Sent At</th>
          </tr>
        </thead>
        <tbody>
          {draftOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">{order.id}</td>
              <td className="px-4 py-2 border-b">{order.name}</td>
              <td className="px-4 py-2 border-b">{order.email}</td>
              <td className="px-4 py-2 border-b">${order.total_price}</td>
              <td className="px-4 py-2 border-b">
                {order.invoice_sent_at ?? "Not sent"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
