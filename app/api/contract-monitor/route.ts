import { NextResponse } from 'next/server';
import { startContractMonitoring } from '@/lib/contract-monitor';

let monitoringStarted = false;

export async function POST() {
  try {
    if (!monitoringStarted) {
      await startContractMonitoring();
      monitoringStarted = true;
    } else {
      console.log('[api] Monitoring already active');
    }
    
    return NextResponse.json({ 
      status: 'monitoring',
      contract: process.env.CONTRACT_ADDRESS,
      network: process.env.CONTRACT_NETWORK,
      alreadyRunning: monitoringStarted
    });
  } catch (error) {
    console.error('[api] Error:', error);
    return NextResponse.json({ error: 'Failed to start monitoring' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    monitoring: monitoringStarted,
    contract: process.env.CONTRACT_ADDRESS,
    network: process.env.CONTRACT_NETWORK
  });
}