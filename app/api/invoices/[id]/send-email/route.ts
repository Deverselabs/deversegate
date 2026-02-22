import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { sendInvoiceEmail } from "@/lib/email-service";

type RouteParams = Promise<{ id: string }>;

export async function POST(
  _request: Request,
  context: { params: RouteParams }
) {
  try {
    let user;
    try {
      user = await getOrCreateUser();
    } catch {
      return NextResponse.json(
        { error: "Please sign in to send invoice emails" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to send this invoice" },
        { status: 403 }
      );
    }

    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    const fromEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ??
      user.email ??
      "noreply@example.com";

    const result = await sendInvoiceEmail(
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        description: invoice.description ?? "",
        dueDate: invoice.dueDate.toISOString(),
        paymentAddress: null,
        status: invoice.status,
        clientWallet: invoice.clientWallet ?? undefined,
        paymentPageUrl: invoice.paymentPageUrl ?? undefined,
        merchantWallet: invoice.merchantWallet ?? undefined,
      },
      fromEmail
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      yourEmail: fromEmail,
    });
  } catch (error) {
    console.error('Send invoice email error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
