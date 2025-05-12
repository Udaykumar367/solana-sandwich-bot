import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { connection } from '../utils/connection';
import { logger } from '../utils/logger';
import { config, DEX_PROGRAM_IDS } from '../config';
import { analyzeSandwichOpportunity } from '../strategies/sandwich';

// Track seen transactions to avoid duplicates
const seenTransactions = new Set<string>();

/**
 * Setup mempool monitoring to watch for potential sandwich opportunities
 */
export async function setupMempoolMonitoring(): Promise<void> {
  if (!connection.connection._rpcWebSocketConnected) {
    throw new Error('WebSocket connection not available');
  }

  // Subscribe to transaction notifications from the mempool
  const subscriptionId = connection.onLogs(
    'all', // Subscribe to all logs
    (logs, context) => {
      // Process new transaction
      handleTransaction(logs.signature, logs.logs || []);
    },
    'pending'
  );

  logger.info(`Subscribed to mempool with ID: ${subscriptionId}`);
  return;
}

/**
 * Handle an incoming transaction from the mempool
 * @param signature Transaction signature
 * @param logs Transaction logs (if available)
 */
async function handleTransaction(signature: TransactionSignature, logs: string[]): Promise<void> {
  // Skip already seen transactions
  if (seenTransactions.has(signature)) {
    return;
  }
  
  // Add to seen transactions
  seenTransactions.add(signature);
  
  // Clean up seen transactions periodically (prevent memory leaks)
  if (seenTransactions.size > 10000) {
    const oldestEntries = Array.from(seenTransactions).slice(0, 5000);
    oldestEntries.forEach(entry => seenTransactions.delete(entry));
  }

  try {
    // Check if transaction interacts with target DEXs
    const isDexTransaction = checkForDexInteraction(logs);
    if (!isDexTransaction) {
      return;
    }
    
    // Get the full transaction details
    const txInfo = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    });
    
    if (!txInfo || !txInfo.transaction) {
      return;
    }

    // Now we have the full transaction details
    logger.debug(`Analyzing potential sandwich opportunity: ${signature}`);
    
    // Analyze the transaction for sandwich opportunity
    await analyzeSandwichOpportunity(txInfo);
    
  } catch (error) {
    logger.debug(`Error processing transaction ${signature}: ${error}`);
  }
}

/**
 * Check if the transaction logs indicate interaction with our target DEXs
 * @param logs Transaction logs
 * @returns true if the transaction interacts with target DEXs
 */
function checkForDexInteraction(logs: string[]): boolean {
  // Skip if no logs available
  if (!logs || logs.length === 0) {
    return false;
  }
  
  // Check for program invocations matching our target DEXs
  for (const log of logs) {
    for (const dexName of config.targetDexs) {
      const dexProgramId = DEX_PROGRAM_IDS[dexName as keyof typeof DEX_PROGRAM_IDS];
      if (dexProgramId && log.includes(`Program ${dexProgramId.toString()}`)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Clean up mempool monitoring subscriptions
 */
export function cleanupMempoolMonitoring(): void {
  // Implement the logic to clean up any active subscriptions
  // This would be called during shutdown
}