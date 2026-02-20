import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db as prisma } from '@/lib/db';
import { sendInvoiceEmail } from '@/lib/email-service';

type RouteParams = Promise<{ id: string }>;

export async function POST(
  _request: Request,
  context: { params: RouteParams }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Please sign in to send invoice emails' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to send invoice emails' },
        { status: 401 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to send this invoice" },
        { status: 403 }
      );
    }

    const { currentUser } = await import('@clerk/nextjs/server');
    const clerkUser = await currentUser();
    const currentUserEmail =
      clerkUser?.primaryEmailAddress?.emailAddress ?? user.email;

    const result = await sendInvoiceEmail(
      {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount.toString(),
        currency: invoice.currency,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        description: invoice.description,
        dueDate: invoice.dueDate.toISOString(),
        paymentAddress: invoice.paymentAddress,
        status: invoice.status,
        clientWallet: invoice.clientWallet,
        paymentPageUrl: invoice.paymentPageUrl,
        merchantWallet: invoice.merchantWallet,
      },
      currentUserEmail
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
      yourEmail: currentUserEmail,
    });
  } catch (error) {
    console.error('Send invoice email error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
