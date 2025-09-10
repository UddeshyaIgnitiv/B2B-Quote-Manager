"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateQuotePage() {
  const router = useRouter();

  const [customer, setCustomer] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [status, setStatus] = useState("Pending");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    alert("Create quote API integration coming soon!");
    // Here you can add API POST request to create a new quote
    // After successful creation, navigate back to list page:
    // router.push("/quotes/list");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Quote</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block font-semibold mb-1">Customer Name</label>
          <input
            type="text"
            required
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Total Price</label>
          <input
            type="text"
            required
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 pointer-events: none; opacity: 0.5; rounded hover:bg-blue-700"
          disabled
        >
          Create Quote
        </button>
      </form>
    </div>
  );
}
