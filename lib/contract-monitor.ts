import { ethers } from 'ethers';
import { db } from './db';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY!;
const NETWORK = process.env.CONTRACT_NETWORK || 'sepolia';
const WSS_URL = `wss://eth-${NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

const CONTRACT_ABI = [
  "event InvoicePaid(string indexed invoiceNumber, address indexed payer, address indexed recipient, uint256 amount, uint256 timestamp)"
];

let provider: ethers.providers.WebSocketProvider | null = null;
let contract: ethers.Contract | null = null;

export async function startContractMonitoring() {
  try {
    console.log('[contract-monitor] 🚀 Starting...');
    console.log('[contract-monitor] 📍 Contract:', CONTRACT_ADDRESS);
    console.log('[contract-monitor] 🌐 Network:', NETWORK);
    
    provider = new ethers.providers.WebSocketProvider(WSS_URL);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    contract.on('InvoicePaid', async (invoiceNumberIndexed, payer, recipient, amount, timestamp, event) => {
      console.log('[contract-monitor] 🎉 Payment received!');
      
      // Parse the actual invoice number from the transaction data
      // Since invoiceNumber is indexed, we need to get it from the transaction input data
      const tx = await provider!.getTransaction(event.transactionHash);
      const iface = new ethers.utils.Interface([
        "function payInvoice(string memory invoiceNumber, address payable recipient) external payable"
      ]);
      const decodedData = iface.parseTransaction({ data: tx.data, value: tx.value });
      const invoiceNumber = decodedData.args.invoiceNumber;
      
      console.log('[contract-monitor] 📋 Invoice:', invoiceNumber);
      console.log('[contract-monitor] 💰 Amount:', ethers.utils.formatEther(amount), 'ETH');
      console.log('[contract-monitor] 👤 Payer:', payer);
      console.log('[contract-monitor] 📥 Recipient:', recipient);
      
      try {
        const invoice = await db.invoice.findUnique({
          where: { invoiceNumber }
        });
        
        if (!invoice) {
          console.log('[contract-monitor] ⚠️ Invoice not found:', invoiceNumber);
          return;
        }
        
        if (invoice.status === 'PAID') {
          console.log('[contract-monitor] ℹ️ Already marked as paid');
          return;
        }
        
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: 'PAID',
            paymentTxHash: event.transactionHash,
            paidAt: new Date(timestamp.toNumber() * 1000),
            paidViaContract: true,
          }
        });
        
        console.log('[contract-monitor] ✅ Invoice marked as PAID!');
        
      } catch (error) {
        console.error('[contract-monitor] ❌ Error:', error);
      }
    });
    
    console.log('[contract-monitor] ✅ Monitoring active');
    
  } catch (error) {
    console.error('[contract-monitor] ❌ Failed to start:', error);
    throw error;
  }
}

export async function stopContractMonitoring() {
  if (contract) {
    contract.removeAllListeners();
  }
  if (provider) {
    await provider.destroy();
  }
  console.log('[contract-monitor] 🛑 Stopped');
}

process.on('SIGTERM', stopContractMonitoring);
process.on('SIGINT', stopContractMonitoring);