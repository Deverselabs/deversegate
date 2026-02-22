import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import type { Invoice as PrismaInvoice } from "@prisma/client";
import { Prisma } from "@prisma/client";

const createInvoiceSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().optional(),
  dueDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Invalid due date format",
  }),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid client email"),
  clientWallet: z.string().optional(),
});

const INVOICE_STATUS = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
} as const;

function handlePrismaError(error: unknown): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("Prisma error:", error.code, error.message);
    switch (error.code) {
      case "P2002":
        return { message: "A record with this data already exists", status: 400 };
      case "P2003":
        return { message: "Invalid reference - related record not found", status: 400 };
      default:
        return { message: "Database operation failed", status: 500 };
    }
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error:", error.message);
    return { message: "Invalid data provided", status: 400 };
  }
  return { message: "An unexpected error occurred", status: 500 };
}

export async function POST(request: NextRequest) {
  try {
    let user;
    try {
      user = await getOrCreateUser();
    } catch {
      return NextResponse.json(
        { error: "Please sign in to create invoices" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error("Invalid JSON body in create invoice request");
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parseResult = createInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const dueDate = new Date(data.dueDate);
    const currentYear = new Date().getFullYear();

    let lastInvoice;
    try {
      lastInvoice = await prisma.invoice.findFirst({
        where: {
          userId: user.id,
          invoiceNumber: { startsWith: `INV-${currentYear}-` },
        },
        orderBy: { invoiceNumber: "desc" },
        select: { invoiceNumber: true },
      });
    } catch (error) {
      console.error("Error fetching last invoice:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    let invoiceNumber: string;
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-\d{4}-(\d+)/);
      const lastNum = match ? parseInt(match[1], 10) : 0;
      invoiceNumber = `INV-${currentYear}-${String(lastNum + 1).padStart(4, "0")}`;
    } else {
      invoiceNumber = `INV-${currentYear}-0001`;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentPageUrl = `${appUrl}/pay/${invoiceNumber}`;
    const merchantWallet = process.env.MERCHANT_WALLET_ADDRESS ?? undefined;

    let invoice;
    try {
      invoice = await prisma.invoice.create({
        data: {
          userId: user.id,
          invoiceNumber,
          amount: String(data.amount),
          currency: data.currency,
          status: INVOICE_STATUS.UNPAID,
          description: data.description ?? null,
          dueDate,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientWallet: data.clientWallet ?? null,
          paymentPageUrl,
          merchantWallet,
        },
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({
      ...invoice,
      amount: invoice.amount,
    });
  } catch (error) {
    console.error("Unexpected error creating invoice:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    let user;
    try {
      user = await getOrCreateUser();
    } catch {
      return NextResponse.json(
        { error: "Please sign in to view invoices" },
        { status: 401 }
      );
    }

    console.log("📊 Fetching invoices for database user:", user.id, user.email);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const status = searchParams.get("status") ?? undefined;
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const where = {
      userId: user.id,
      ...(status && status in INVOICE_STATUS ? { status } : {}),
    };

    let invoices: PrismaInvoice[];
    let total: number;
    try {
      [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.invoice.count({ where }),
      ]);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    console.log(`✅ Found ${invoices.length} invoices for user ${user.id}`);

    const totalPages = Math.ceil(total / pageSize);
    const serialized = invoices.map((inv: PrismaInvoice) => ({
      ...inv,
      amount: inv.amount,
    }));

    return NextResponse.json({
      invoices: serialized,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Unexpected error fetching invoices:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}