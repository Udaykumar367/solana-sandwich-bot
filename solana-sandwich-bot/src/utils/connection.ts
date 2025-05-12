import { Connection, Keypair, PublicKey, Commitment } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import { logger } from './logger';
import dotenv from 'dotenv';

dotenv.config();

// Check and validate required environment variables
if (!process.env.SOLANA_RPC_URL) {
  throw new Error('SOLANA_RPC_URL is not defined in the environment');
}

if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error('WALLET_PRIVATE_KEY is not defined in the environment');
}

// Connection options
const commitment: Commitment = 'confirmed';
const connectionConfig = {
  commitment,
  confirmTransactionInitialTimeout: 60000, // 60 seconds
  disableRetryOnRateLimit: false,
  wsEndpoint: process.env.SOLANA_WEBSOCKET || undefined,
};

// Create a Connection to the Solana network
export const connection = new Connection(
  process.env.SOLANA_RPC_URL,
  connectionConfig
);

// Create a Keypair from the private key
const privateKeyUint8Array = bs58.decode(process.env.WALLET_PRIVATE_KEY);
export const wallet = Keypair.fromSecretKey(privateKeyUint8Array);

/**
 * Get the associated token account for a specific token
 * @param tokenMint The token mint address
 * @returns The associated token account public key
 */
export async function getTokenAccount(tokenMint: string): Promise<PublicKey> {
  try {
    const mint = new PublicKey(tokenMint);
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );
    return tokenAccount.address;
  } catch (error) {
    logger.error(`Error getting token account for ${tokenMint}:`, error);
    throw error;
  }
}

/**
 * Check connection to Solana network
 * @returns true if connected, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const version = await connection.getVersion();
    logger.info(`Connected to Solana ${version['solana-core']}`);
    return true;
  } catch (error) {
    logger.error('Failed to connect to Solana network:', error);
    return false;
  }
}

/**
 * Log wallet information
 */
export function logWalletInfo(): void {
  logger.info(`Wallet public key: ${wallet.publicKey.toString()}`);
}