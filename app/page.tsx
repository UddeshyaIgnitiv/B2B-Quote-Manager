"use client";

import { useEffect, useRef, useState } from "react";
import { useAppBridge } from "@/app/providers";
import QuoteDetailsModal from "@/components/QuoteDetailsModal";
import { DraftOrder } from "@/types/quotes";
import { Toast } from "@shopify/app-bridge/actions";
import { FiFilter } from "react-icons/fi";

export default function HomePage() {
  const app = useAppBridge();
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("All Companies");
  const [companyList, setCompanyList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const draftOrdersPerPage = 12;

  // For filter dropdown visibility
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterOpen]);

  // Filtered draft orders based on selected company
  const filteredDraftOrders =
    selectedCompany === "All Companies"
      ? draftOrders
      : draftOrders.filter((order) => order.company === selectedCompany);

  const totalPages = Math.ceil(filteredDraftOrders.length / draftOrdersPerPage);
  const startIndex = (currentPage - 1) * draftOrdersPerPage;
  const currentDraftOrders = filteredDraftOrders.slice(startIndex, startIndex + draftOrdersPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotes");
      const data = await res.json();
      const fetchedQuotes = data.draftOrders || [];

      const requestQuotesOnly = fetchedQuotes.filter(
        (quote: any) =>
          quote.tags?.includes("request_quote") ||
          quote.note2 === "Requested quote from storefront"
      );

      const transformed: DraftOrder[] = requestQuotesOnly.map((quote: any) => {
        //console.log("Quote data", quote);
        let companyName = "";
        const entity = quote.purchasingEntity;
        if (entity?.__typename === "PurchasingCompany") {
          companyName = entity.company?.name || "";
        } else if (entity?.__typename === "Customer") {
          companyName = entity.defaultAddress?.company || "";
        }

        // --- Custom Status Mapping ---
        let statusValue = quote?.metafield?.value;
        try {
          const parsed = JSON.parse(statusValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            statusValue = parsed[0];
          }
        } catch (err) {
          console.warn("Failed to parse metafield value:", statusValue, err);
        }

        if (!statusValue) {
          if (quote.status === "OPEN") statusValue = "submitted";
          else if (quote.status === "INVOICE_SENT") statusValue = "offer_sent";
          else if (quote.status === "COMPLETED") statusValue = "completed";
          else statusValue = "under_review";
        }

        return {
          id: quote.id,
          name: quote.name.replace(/^#?D/, "#Q"),
          customer:
            quote.customer?.firstName || quote.customer?.lastName
              ? `${quote.customer.firstName ?? ""} ${quote.customer.lastName ?? ""}`.trim()
              : quote.customer?.email ?? "N/A",
          company: companyName || "N/A",
          totalPrice: quote.totalPrice ? `$${Number(quote.totalPrice).toFixed(2)}` : "-",
          createdAt: quote.createdAt,
          status: statusValue,
          note2: quote.note2 || "",
          tags: quote.tags || [],
        };
      });

      transformed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const companiesSet = new Set(transformed.map((order) => order.company || "N/A"));
      const companiesArray = ["All Companies", ...Array.from(companiesSet).sort()];
      setCompanyList(companiesArray);

      setDraftOrders(transformed);
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!app) return;

    const toastMsg = Toast.create(app, {
      message: "Welcome to the B2B Quote Manager!",
      duration: 0,
    });
    toastMsg.dispatch(Toast.Action.SHOW);

    fetchQuotes();
  }, [app]);

  const handleCreateDraftOrder = () => {
    alert("Create new quote functionality will be implemented soon.");
  };

  // Handle company selection from dropdown
  const onSelectCompany = (company: string) => {
    setSelectedCompany(company);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to B2B Quote Manager
          </h1>
          <p className="text-lg text-gray-600">Manage your quotes efficiently and easily.</p>
        </div>

        {/* Draft Orders Table */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Quote List</h2>
            <button
              onClick={handleCreateDraftOrder}
              className="bg-blue-600 text-white pointer-events-none opacity-50 px-4 py-2 rounded-md cursor-not-allowed"
              disabled
            >
              Create a Quote
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold relative">
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      {/* Filter Icon */}
                      <div ref={filterRef} className="relative">
                        <button
                          onClick={() => setFilterOpen(!filterOpen)}
                          aria-label="Filter by Company"
                          className="text-gray-600 hover:text-blue-900 bg-blue-100 focus:outline-none"
                        >
                          <FiFilter size={12} />
                        </button>

                        {filterOpen && (
                          <div className="absolute z-50 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                            {companyList.map((company) => (
                              <button
                                key={company}
                                onClick={() => onSelectCompany(company)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none ${
                                  selectedCompany === company
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                {company}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created At</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-600">
                      Loading...
                    </td>
                  </tr>
                ) : currentDraftOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-600">
                      No quotes created via storefront found.
                    </td>
                  </tr>
                ) : (
                  currentDraftOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-300 hover:bg-gray-50 h-[64px] align-middle"
                    >
                      <td
                        className="px-6 py-4 text-sm align-middle text-blue-800 hover:underline hover:text-blue-800 focus:outline-none cursor-pointer"
                        onClick={() => setSelectedQuoteId(order.id)}
                      >
                        {order.name}
                      </td>

                      <td className="px-6 py-4 text-sm align-middle">
                        <div className="flex flex-col justify-center">
                          <span>{order.customer}</span>
                          {order.company && (
                            <span className="text-gray-500 text-xs">{order.company}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm align-middle">{order.totalPrice}</td>

                      <td className="px-6 py-4 text-sm align-middle">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-sm align-middle">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "submitted"
                              ? "bg-yellow-200 text-yellow-800"
                              : order.status === "under_review"
                              ? "bg-blue-200 text-blue-800"
                              : order.status === "offer_sent"
                              ? "bg-purple-200 text-purple-800"
                              : order.status === "accepted"
                              ? "bg-green-200 text-green-800"
                              : order.status === "completed"
                              ? "bg-gray-300 text-gray-800"
                              : order.status === "expired"
                              ? "bg-red-200 text-red-800"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.status
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/^\w/, (c) => c.toUpperCase())}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium border transition
                  ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                aria-label="Previous Page"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 rounded-md text-sm font-medium border transition
                    ${
                      page === currentPage
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  aria-current={page === currentPage ? "page" : undefined}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium border transition
                  ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                aria-label="Next Page"
              >
                Next
              </button>
            </div>
          </div>

          {/* Quote Details Modal */}
          {selectedQuoteId && (
            <QuoteDetailsModal
              quoteId={selectedQuoteId}
              onCloseAction={() => setSelectedQuoteId(null)}
              onSaveSuccess={() => {
                fetchQuotes();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
