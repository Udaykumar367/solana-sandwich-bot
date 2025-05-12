# Solana Sandwich Trading Bot

A bot for executing sandwich trades on Solana DEXs for memecoins and DeFi tokens.

## ⚠️ Disclaimer

This bot is provided for educational purposes only. Sandwich trading may be considered a form of price manipulation on some platforms and may violate the terms of service of certain DEXs. Use at your own risk. The authors take no responsibility for any financial losses or legal consequences resulting from the use of this software.

## What is Sandwich Trading?

Sandwich trading is a strategy that involves executing trades before and after a target transaction to profit from the price impact of the target transaction. It works as follows:

1. **Monitor the mempool** for pending large transactions (swaps) that will impact token prices
2. **Front-run** by placing a buy order right before the target transaction
3. **Back-run** by placing a sell order immediately after the target transaction executes

When a large buy order is detected, the sandwich trader quickly buys the token first (causing a slight price increase), lets the large order execute (pushing the price higher), then immediately sells for a profit.

## Features

- Mempool monitoring for swap detection
- Automatic transaction analysis
- Profitability calculation
- Configurable slippage tolerance and profit thresholds
- Support for multiple DEXs (Raydium, Orca)
- Transaction prioritization for faster execution
- Error handling and recovery mechanisms

## Prerequisites

- Node.js v16 or higher
- A Solana wallet with SOL for gas fees
- RPC endpoint with WebSocket support (preferably a dedicated one with mempool access)

## Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/solana-sandwich-bot.git
cd solana-sandwich-bot
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file by copying the example

```bash
cp .env.example .env
```

4. Configure your `.env` file with your RPC URL and wallet private key:

```
SOLANA_RPC_URL=your_rpc_url_here
SOLANA_WEBSOCKET=your_websocket_url_here
WALLET_PRIVATE_KEY=your_private_key_here
```

5. Build the project

```bash
npm run build
```

## Usage

1. Start the bot:

```bash
npm start
```

The bot will:
- Connect to the Solana network
- Start monitoring the mempool for potential sandwich opportunities
- Execute trades when profitable opportunities are detected

## Configuration

You can configure the bot through the `.env` file:

### Connection Settings
- `SOLANA_RPC_URL`: Your Solana RPC endpoint URL
- `SOLANA_WEBSOCKET`: WebSocket endpoint for mempool monitoring

### Wallet Configuration
- `WALLET_PRIVATE_KEY`: Private key for your Solana wallet (in base58 format)

### Trading Parameters
- `PROFIT_THRESHOLD`: Minimum profit (in SOL) to execute a sandwich trade
- `GAS_MULTIPLIER`: Multiplier for gas prices to ensure transaction execution
- `SLIPPAGE_TOLERANCE`: Maximum slippage tolerance in percentage

### Target Settings
- `TARGET_DEXS`: Comma-separated list of DEXs to monitor (e.g., "RAYDIUM,ORCA")
- `TARGET_TOKENS`: Optional comma-separated list of token addresses to target

### Execution Settings
- `MAX_CONCURRENT_TRADES`: Maximum number of concurrent trades
- `EXECUTION_TIMEOUT_MS`: Timeout for trade execution in milliseconds

## Advanced Usage

### Targeting Specific Tokens

To target specific tokens, add their addresses to the `TARGET_TOKENS` environment variable:

```
TARGET_TOKENS=So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### Custom RPC Endpoints

For best performance, use a dedicated RPC endpoint with mempool access. Some options include:
- Quicknode
- RunNode
- Triton

## Development

### Project Structure

```
solana-sandwich-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration
│   ├── utils/                # Utility functions
│   │   ├── connection.ts     # Solana connection
│   │   ├── logger.ts         # Logging
│   │   └── helpers.ts        # Helper functions
│   ├── services/             # Core services
│   │   ├── mempool.ts        # Mempool monitoring
│   │   ├── wallet.ts         # Wallet operations
│   │   └── execution.ts      # Transaction execution
│   └── strategies/           # Trading strategies
│       └── sandwich.ts       # Sandwich trading logic
└── README.md
```

### Extending the Bot

To add support for additional DEXs or trading strategies:

1. Add the DEX program ID to `config.ts`
2. Implement the DEX-specific swap detection in `strategies/sandwich.ts`
3. Create swap instruction builders for the new DEX

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Solana and SPL Token developers
- Raydium and Orca teams for their public APIs and SDKs