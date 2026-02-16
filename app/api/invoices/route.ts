import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db as prisma } from "@/lib/db";
import type { Invoice as PrismaInvoice } from "@prisma/client";
import { Prisma } from "@prisma/client";

const createInvoiceSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().min(1, "Description is required"),
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

async function getOrCreateUser(clerkUserId: string, email: string, name?: string | null) {
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        email,
        name: name ?? null,
      },
    });
  }

  return user;
}

function generatePaymentAddress(): string {
  // Placeholder: generate a pseudo-unique wallet address
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

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
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
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

    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    const userEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ??
      `${clerkUserId}@clerk.user`;
    const userName =
      clerkUser?.firstName || clerkUser?.username
        ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          clerkUser.username
        : data.clientName;

    let user;
    try {
      user = await getOrCreateUser(clerkUserId, userEmail, userName);
    } catch (error) {
      console.error("Error getting/creating user:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    let lastInvoice;
    try {
      lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: "desc" },
        select: { invoiceNumber: true },
      });
    } catch (error) {
      console.error("Error fetching last invoice:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    let invoiceNumber: string;
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      const lastNum = match ? parseInt(match[1], 10) : 0;
      invoiceNumber = `INV-${String(lastNum + 1).padStart(4, "0")}`;
    } else {
      invoiceNumber = "INV-0001";
    }

    const paymentAddress = generatePaymentAddress();

    let invoice;
    try {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          status: INVOICE_STATUS.UNPAID,
          description: data.description,
          dueDate,
          paymentAddress,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientWallet: data.clientWallet ?? null,
          userId: user.id,
        },
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({
      ...invoice,
      amount: invoice.amount.toString(),
    });
  } catch (error) {
    console.error("Unexpected error creating invoice:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}


export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Please sign in to view invoices" },
        { status: 401 }
      );
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    if (!user) {
      return NextResponse.json(
        { invoices: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
      );
    }

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

    const totalPages = Math.ceil(total / pageSize);
    const serialized = invoices.map((inv: PrismaInvoice) => ({
      ...inv,
      amount: inv.amount.toString(),
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
