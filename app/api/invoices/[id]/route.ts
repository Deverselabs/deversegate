import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";

type RouteParams = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  context: { params: RouteParams }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - invoice belongs to another user" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...invoice,
      amount: invoice.amount.toString(),
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
