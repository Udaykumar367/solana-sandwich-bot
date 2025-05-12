import { 
  Transaction, 
  PublicKey, 
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import { connection, wallet } from '../utils/connection';
import { logger } from '../utils/logger';
import { MAX_COMPUTE_UNITS } from '../config';

/**
 * Ensure the wallet has an associated token account for the given token
 * @param tokenMint Token mint address
 * @returns Associated token account address
 */
export async function ensureTokenAccount(tokenMint: PublicKey): Promise<PublicKey> {
  try {
    // Get the associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      tokenMint,
      wallet.publicKey
    );
    
    // Check if the account exists
    try {
      await getAccount(connection, associatedTokenAddress);
      return associatedTokenAddress;
    } catch (error: any) {
      // Account doesn't exist, create it
      if (error.name === 'TokenAccountNotFoundError') {
        logger.info(`Creating token account for ${tokenMint.toString()}`);
        
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedTokenAddress,
            wallet.publicKey,
            tokenMint
          )
        );
        
        await sendAndConfirmTransaction(connection, transaction, [wallet]);
        return associatedTokenAddress;
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error ensuring token account for ${tokenMint.toString()}:`, error);
    throw error;
  }
}

/**
 * Send SOL to a recipient
 * @param recipient Recipient public key
 * @param amount Amount in SOL
 * @returns Transaction signature
 */
export async function sendSol(recipient: PublicKey, amount: number): Promise<string> {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipient,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    
    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
    logger.info(`Sent ${amount} SOL to ${recipient.toString()}, signature: ${signature}`);
    
    return signature;
  } catch (error) {
    logger.error(`Error sending SOL to ${recipient.toString()}:`, error);
    throw error;
  }
}

/**
 * Add compute budget instructions to a transaction
 * @param transaction Transaction to modify
 * @param units Compute units to request (defaults to MAX_COMPUTE_UNITS)
 * @returns The modified transaction
 */
export function addComputeBudgetInstructions(
  transaction: Transaction, 
  units: number = MAX_COMPUTE_UNITS
): Transaction {
  // Request compute units
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units
  });
  
  // Add to the beginning of the transaction
  transaction.add(computeBudgetIx);
  
  return transaction;
}

/**
 * Set higher transaction priority
 * @param transaction Transaction to modify
 * @param priorityFee Priority fee in micro-lamports
 * @returns The modified transaction
 */
export function setPriorityFee(
  transaction: Transaction,
  priorityFee: number
): Transaction {
  const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFee
  });
  
  transaction.add(priorityFeeIx);
  return transaction;
}