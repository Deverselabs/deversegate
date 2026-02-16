import { NextRequest, NextResponse } from 'next/server';
import { monitorPayments } from '@/lib/payment-monitor';

/**
 * POST /api/monitor-payments
 * Manually trigger payment monitoring: scan unpaid invoices for blockchain payments
 * and update status. No auth required so it can be called by cron jobs.
 * Returns summary: { checked, detected, updated, errors }.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await monitorPayments();
    return NextResponse.json({
      checked: result.checked,
      detected: result.detected,
      updated: result.updated.length,
      updatedIds: result.updated,
      errors: result.errors,
    });
  } catch (error) {
    console.error('[monitor-payments]', error);
    return NextResponse.json(
      { error: 'Failed to monitor payments' },
      { status: 500 }
    );
  }
}
