import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params;

    const invoice = await db.invoice.findUnique({
      where: { invoiceNumber },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      clientName: invoice.clientName,
      description: invoice.description,
      merchantWallet: invoice.merchantWallet,
      contractAddress: invoice.contractAddress,
      network: invoice.network,
      status: invoice.status,
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}