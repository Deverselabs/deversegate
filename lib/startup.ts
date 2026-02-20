import { startContractMonitoring } from './contract-monitor';

let initialized = false;

export async function initializeBackgroundServices() {
  if (initialized) {
    console.log('[startup] Services already initialized');
    return;
  }

  console.log('[startup] 🚀 Initializing background services...');
  
  try {
    // Start contract monitoring
    await startContractMonitoring();
    initialized = true;
    console.log('[startup] ✅ All services initialized');
  } catch (error) {
    console.error('[startup] ❌ Failed to initialize services:', error);
  }
}