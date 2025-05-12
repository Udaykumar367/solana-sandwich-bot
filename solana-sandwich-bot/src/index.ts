import { connection, checkConnection, logWalletInfo } from './utils/connection';
import { logger } from './utils/logger';
import { config } from './config';
import { setupMempoolMonitoring } from './services/mempool';

/**
 * Main function to start the bot
 */
async function main() {
  logger.info('Starting Solana Sandwich Bot...');
  
  // Check Solana connection
  const isConnected = await checkConnection();
  if (!isConnected) {
    logger.error('Failed to connect to Solana. Exiting...');
    process.exit(1);
  }
  
  // Log wallet info
  logWalletInfo();
  
  // Log configuration
  logger.info(`Profit threshold: ${config.profitThreshold} SOL`);
  logger.info(`Target DEXs: ${config.targetDexs.join(', ')}`);
  logger.info(`Target tokens count: ${config.targetTokens.length}`);
  
  // Setup mempool monitoring
  try {
    logger.info('Setting up mempool monitoring...');
    await setupMempoolMonitoring();
    logger.info('Mempool monitoring active. Waiting for trading opportunities...');
  } catch (error) {
    logger.error('Failed to setup mempool monitoring:', error);
    process.exit(1);
  }
  
  // Handle shutdown
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Graceful shutdown function
 */
function shutdown() {
  logger.info('Shutting down Solana Sandwich Bot...');
  // Close any open connections or pending operations here
  process.exit(0);
}

// Start the bot
main().catch((error) => {
  logger.error('Fatal error in main process:', error);
  process.exit(1);
});