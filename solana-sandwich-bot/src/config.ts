import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

// Configuration interface
export interface BotConfig {
  // Solana connection
  rpcUrl: string;
  websocketUrl: string | undefined;
  
  // Trading parameters
  profitThreshold: number;
  gasMultiplier: number;
  slippageTolerance: number;
  
  // Targets
  targetDexs: string[];
  targetTokens: PublicKey[];
  
  // Execution settings
  maxConcurrentTrades: number;
  executionTimeoutMs: number;
}

// Parse target tokens from environment
const parseTargetTokens = (): PublicKey[] => {
  const tokenAddresses = process.env.TARGET_TOKENS?.split(',') || [];
  return tokenAddresses
    .filter(address => address.trim() !== '')
    .map(address => new PublicKey(address.trim()));
};

// Configuration object
export const config: BotConfig = {
  // Solana connection
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  websocketUrl: process.env.SOLANA_WEBSOCKET,
  
  // Trading parameters
  profitThreshold: parseFloat(process.env.PROFIT_THRESHOLD || '0.01'),
  gasMultiplier: parseFloat(process.env.GAS_MULTIPLIER || '1.5'),
  slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE || '0.5'),
  
  // Targets
  targetDexs: (process.env.TARGET_DEXS?.split(',') || ['RAYDIUM']).map(dex => dex.trim()),
  targetTokens: parseTargetTokens(),
  
  // Execution settings
  maxConcurrentTrades: parseInt(process.env.MAX_CONCURRENT_TRADES || '3', 10),
  executionTimeoutMs: parseInt(process.env.EXECUTION_TIMEOUT_MS || '15000', 10),
};

// Well-known DEX program IDs
export const DEX_PROGRAM_IDS = {
  RAYDIUM: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
  ORCA: new PublicKey('9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP'),
  // Add more DEXs as needed
};

// Native SOL mint address (placeholder for SOL)
export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Important constants
export const DEFAULT_COMPUTE_UNITS = 200000;
export const MAX_COMPUTE_UNITS = 1400000;