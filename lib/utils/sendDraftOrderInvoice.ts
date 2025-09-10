// lib/utils/sendDraftOrderInvoice.ts
import type { EmailPayload } from "@/types/quotes";

export async function sendDraftOrderInvoice(
  draftOrderId: string,
  emailPayload: EmailPayload
) {

  if (!emailPayload.to) {
    throw new Error("Recipient email is required.");
  }
  if (!emailPayload.from) {
    throw new Error("Sender email is required.");
  }
  
  const res = await fetch(`/api/quotes/${encodeURIComponent(draftOrderId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailPayload }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.message || "Failed to send offer.");
  }

  return true;
}
