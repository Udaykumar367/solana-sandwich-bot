import { PublicKey, TransactionInstruction, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { connection, wallet } from './connection';
import { logger } from './logger';
import { config } from '../config';
import Decimal from 'decimal.js';

/**
 * Calculate the estimated profit for a sandwich trade
 * @param buyPrice Price when buying
 * @param sellPrice Price when selling
 * @param amount Amount to trade
 * @param estimatedGas Gas cost for the transactions
 * @returns Estimated profit in SOL
 */
export function calculateEstimatedProfit(
  buyPrice: number,
  sellPrice: number,
  amount: number,
  estimatedGas: number
): number {
  const buyAmount = amount * buyPrice;
  const sellAmount = amount * sellPrice;
  const grossProfit = sellAmount - buyAmount;
  const netProfit = grossProfit - estimatedGas;
  
  return netProfit;
}

/**
 * Estimate the gas cost for a set of transactions
 * @param instructionCount Approximate number of instructions
 * @returns Estimated gas cost in SOL
 */
export function estimateGasCost(instructionCount: number): number {
  // Basic estimation - can be refined with more data
  const baseCost = 0.000005 * instructionCount; // SOL
  return baseCost * config.gasMultiplier;
}

/**
 * Get the current SOL balance of the wallet
 * @returns SOL balance
 */
export async function getSolBalance(): Promise<number> {
  const balance = await connection.getBalance(wallet.publicKey);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Get the token balance for a given mint
 * @param mint Token mint address
 * @returns Token balance
 */
export async function getTokenBalance(mint: PublicKey): Promise<number> {
  try {
    const accounts = await connection.getTokenAccountsByOwner(
      wallet.publicKey,
      { mint }
    );
    
    if (accounts.value.length === 0) {
      return 0;
    }
    
    const balance = await connection.getTokenAccountBalance(
      accounts.value[0].pubkey
    );
    
    return Number(balance.value.amount) / Math.pow(10, balance.value.decimals);
  } catch (error) {
    logger.error(`Error getting token balance for ${mint.toString()}:`, error);
    return 0;
  }
}

/**
 * Create a timeout promise
 * @param ms Timeout in milliseconds
 * @returns Promise that resolves after the timeout
 */
export function timeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep for a given number of milliseconds
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the sleep
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format a number with specified number of decimal places
 * @param num Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 6): string {
  return new Decimal(num).toFixed(decimals);
}

/**
 * Check if a transaction is likely to succeed based on simulation
 * @param transaction Transaction to simulate
 * @returns True if simulation succeeds, false otherwise
 */
export async function simulateTransaction(transaction: Transaction): Promise<boolean> {
  try {
    const simulation = await connection.simulateTransaction(transaction);
    return !simulation.value.err;
  } catch (error) {
    logger.error('Transaction simulation failed:', error);
    return false;
  }
}