import { NextResponse } from "next/server";
import { getTransaction } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getTransaction(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = [
    `${doc.txn.number}`,
    doc.contact?.displayName ?? "",
    `Total ${doc.txn.total} ${doc.txn.currency}`,
    `Balance ${doc.txn.balance}`,
    ...doc.lines.map((l) => `${l.description} x ${l.quantity} = ${l.amount}`),
  ].join("\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename=${doc.txn.number}.txt`,
    },
  });
}
