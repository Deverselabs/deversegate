import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db as prisma } from "@/lib/db";

type RouteParams = Promise<{ id: string }>;

function handlePrismaError(error: unknown): { message: string; status: number } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("Prisma error:", error.code, error.message);
    switch (error.code) {
      case "P2002":
        return { message: "A record with this data already exists", status: 400 };
      case "P2003":
        return { message: "Invalid reference", status: 400 };
      case "P2025":
        return { message: "Invoice not found", status: 404 };
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

const updateInvoiceSchema = z.object({
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

export async function GET(
  _request: NextRequest,
  context: { params: RouteParams }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Please sign in to view this invoice" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
    } catch (error) {
      console.error("Error fetching user for invoice:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to view this invoice" },
        { status: 401 }
      );
    }

    let invoice;
    try {
      invoice = await prisma.invoice.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this invoice" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...invoice,
      amount: invoice.amount.toString(),
    });
  } catch (error) {
    console.error("Unexpected error fetching invoice:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: RouteParams }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Please sign in to edit invoices" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });
    } catch (error) {
      console.error("Error fetching user for update:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to edit invoices" },
        { status: 401 }
      );
    }

    let invoice;
    try {
      invoice = await prisma.invoice.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error("Error fetching invoice for update:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this invoice" },
        { status: 403 }
      );
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Paid invoices cannot be edited" },
        { status: 400 }
      );
    }

    if (invoice.status !== "UNPAID") {
      return NextResponse.json(
        { error: "Only unpaid invoices can be edited" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error("Invalid JSON body in update invoice request");
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parseResult = updateInvoiceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const dueDate = new Date(data.dueDate);

    let updated;
    try {
      updated = await prisma.invoice.update({
        where: { id },
        data: {
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          description: data.description,
          dueDate,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientWallet: data.clientWallet ?? null,
        },
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
      const { message, status } = handlePrismaError(error);
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({
      ...updated,
      amount: updated.amount.toString(),
    });
  } catch (error) {
    console.error("Unexpected error updating invoice:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
