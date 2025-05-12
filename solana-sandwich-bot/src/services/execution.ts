import { 
  Transaction,
  TransactionSignature,
  sendAndConfirmTransaction,
  Keypair,
  Connection,
  PublicKey
} from '@solana/web3.js';
import { connection, wallet } from '../utils/connection';
import { logger } from '../utils/logger';
import { config } from '../config';
import { addComputeBudgetInstructions, setPriorityFee } from './wallet';
import { sleep, timeout } from '../utils/helpers';

// Track ongoing executions
const activeExecutions = new Set<string>();

/**
 * Send a transaction with high priority
 * @param transaction Transaction to send
 * @param priorityLevel Priority level (higher = more priority fee)
 * @returns Transaction signature
 */
export async function sendPriorityTransaction(
  transaction: Transaction,
  priorityLevel: number = 1
): Promise<TransactionSignature> {
  try {
    // Add compute budget for more complex transactions
    addComputeBudgetInstructions(transaction);
    
    // Add priority fee based on level
    const microLamports = 1_000_000 * priorityLevel; // Base priority * level
    setPriorityFee(transaction, microLamports);
    
    // Recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    
    // Sign and send
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      { commitment: 'confirmed' }
    );
    
    logger.debug(`Transaction sent with priority level ${priorityLevel}: ${signature}`);
    return signature;
  } catch (error) {
    logger.error('Failed to send priority transaction:', error);
    throw error;
  }
}

/**
 * Execute a sandwich trade
 * @param frontrunTx Front-run transaction (buy)
 * @param backrunTx Back-run transaction (sell)
 * @param targetTxSignature Target transaction signature to sandwich
 * @param tokenMint Token mint being traded
 * @returns Object with execution results
 */
export async function executeSandwichTrade(
  frontrunTx: Transaction,
  backrunTx: Transaction,
  targetTxSignature: string,
  tokenMint: PublicKey
): Promise<{ success: boolean; profit: number | null; error?: string }> {
  // Generate an execution ID
  const executionId = `sandwich-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Check if we have too many active executions
  if (activeExecutions.size >= config.maxConcurrentTrades) {
    return { 
      success: false, 
      profit: null,
      error: 'Too many concurrent trades active'
    };
  }
  
  // Add to active executions
  activeExecutions.add(executionId);
  
  try {
    // Start execution with timeout
    const result = await Promise.race([
      executeTrade(frontrunTx, backrunTx, targetTxSignature, tokenMint),
      timeout(config.executionTimeoutMs).then(() => {
        throw new Error('Execution timed out');
      })
    ]);
    
    return result;
  } catch (error: any) {
    logger.error(`Sandwich execution ${executionId} failed:`, error);
    return {
      success: false,
      profit: null,
      error: error.message || 'Unknown execution error'
    };
  } finally {
    // Remove from active executions
    activeExecutions.delete(executionId);
  }
}

/**
 * Execute the actual sandwich trade
 * @param frontrunTx Front-run transaction
 * @param backrunTx Back-run transaction
 * @param targetTxSignature Target transaction signature
 * @param tokenMint Token mint being traded
 * @returns Execution result
 */
async function executeTrade(
  frontrunTx: Transaction,
  backrunTx: Transaction,
  targetTxSignature: string,
  tokenMint: PublicKey
): Promise<{ success: boolean; profit: number | null; error?: string }> {
  let frontrunSignature: string | null = null;
  
  try {
    // 1. Execute front-run transaction (buy)
    logger.info(`Executing front-run transaction for ${tokenMint.toString()}`);
    frontrunSignature = await sendPriorityTransaction(frontrunTx, 2);
    
    // 2. Wait for target transaction
    logger.info(`Waiting for target transaction ${targetTxSignature}`);
    await waitForTransaction(targetTxSignature);
    
    // 3. Execute back-run transaction (sell)
    logger.info('Executing back-run transaction');
    const backrunSignature = await sendPriorityTransaction(backrunTx, 2);
    
    // 4. Wait for back-run confirmation
    await connection.confirmTransaction(backrunSignature, 'confirmed');
    
    // 5. Calculate profit (this would be done more accurately in a real system)
    const profit = 0.01; // Placeholder
    
    logger.info(`Sandwich trade completed successfully. Est. profit: ${profit} SOL`);
    return {
      success: true,
      profit
    };
  } catch (error: any) {
    logger.error('Sandwich trade execution failed:', error);
    
    // Try to clean up by selling tokens if front-run went through
    if (frontrunSignature) {
      try {
        logger.info('Attempting to recover funds by selling tokens');
        await sendPriorityTransaction(backrunTx, 3);
      } catch (cleanupError) {
        logger.error('Failed to clean up after failed sandwich:', cleanupError);
      }
    }
    
    return {
      success: false,
      profit: null,
      error: error.message || 'Unknown execution error'
    };
  }
}

/**
 * Wait for a transaction to be confirmed
 * @param signature Transaction signature to wait for
 * @param maxRetries Maximum number of retries
 * @returns Promise that resolves when the transaction is confirmed
 */
async function waitForTransaction(
  signature: string,
  maxRetries: number = 30
): Promise<void> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const status = await connection.getSignatureStatus(signature);
      
      if (status && status.value && status.value.confirmationStatus === 'confirmed') {
        return;
      }
      
      // Wait before checking again
      await sleep(1000);
      retries++;
    } catch (error) {
      logger.debug(`Error checking transaction status (retry ${retries}):`, error);
      await sleep(1000);
      retries++;
    }
  }
  
  throw new Error(`Transaction ${signature} not confirmed after ${maxRetries} retries`);
}