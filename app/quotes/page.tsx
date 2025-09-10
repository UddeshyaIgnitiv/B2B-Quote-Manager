// app/quotes/page.tsx
import { redirect } from "next/navigation";

export default function QuotesPage() {
  redirect("/quotes/list");
}
