# 🔥 SpreadNet - Advanced Solana Arbitrage Platform

> **The first open-source Solana arbitrage detection engine built for speed, transparency, and profit.**

![SpreadNet Banner](https://img.shields.io/badge/Solana-Arbitrage-blueviolet?style=for-the-badge&logo=solana)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![Real-time](https://img.shields.io/badge/Real--Time-WebSocket-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## 🚀 What is SpreadNet?

SpreadNet is a **cutting-edge arbitrage detection platform** that monitors Solana DEXs in real-time to identify profitable trading opportunities. Built with institutional-grade performance and transparency in mind.

### ⚡ Key Features

- **🔴 LIVE ARBITRAGE FEED** - Real-time opportunity detection across multiple DEXs
- **⚡ Sub-100ms Latency** - Lightning-fast detection and alert system  
- **🎯 Smart Filtering** - Advanced algorithms to filter noise and surface profitable opportunities
- **📊 Performance Analytics** - Track profit potential, success rates, and market dynamics
- **🔒 Non-Custodial** - Your funds, your keys, your control
- **🌐 Modern UI** - Clean, terminal-inspired interface for clarity and focus

## 🎯 What You'll See

When you run SpreadNet, you'll get:

### 📈 Live Arbitrage Opportunities
```
[16:15:02] SOL/USDC  | Raydium@0.008822 → Lifinity@0.003801 | spread -56.91% | profit 1.20% (120bps) | size...
[16:15:01] RAY/USDC  | Phoenix@0.004879 → Meteora@0.000537  | spread -89.00%  | profit 0.50% (50bps)  | size...
[16:14:58] JTO/USDC  | Orca@0.003708 → Meteora@0.004368     | spread 17.82%   | profit 0.80% (80bps) | size...
```

### 📊 Real-Time Statistics
- **Total Opportunities Detected**: Live counter of all opportunities found
- **Average Profit %**: Rolling average of profit potential
- **Opportunities/Minute**: Detection rate and market activity
- **Best Profit**: Highest profit opportunity detected
- **Connection Status**: Real-time health of all data sources

### 🎮 Interactive Dashboard
- **Navigation**: Dashboard, Docs, Roadmap, SpreadBot sections
- **Live Feed**: Continuously updating arbitrage opportunities
- **System Stats**: Performance metrics and uptime tracking
- **Connection Monitor**: RPC health, Jupiter API status, WebSocket status

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.8+** 
- **Stable internet connection** (for real-time data)
- **8GB+ RAM recommended** (for optimal performance)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/philipmorris28/spreadnet-v1.git
cd spreadnet-v1
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Launch SpreadNet**
```bash
python app.py
```

4. **Open your browser**
```
http://localhost:8080
```

That's it! SpreadNet will immediately start detecting arbitrage opportunities.

## 💡 How It Works

### 🔍 Data Sources
SpreadNet connects to multiple Solana data sources:
- **Solana RPC Nodes** - Direct blockchain data
- **Jupiter Aggregator API** - Cross-DEX price quotes  
- **DEX APIs** - Real-time liquidity and pricing data

### ⚙️ Detection Engine
1. **Ingest** - Streams price quotes and on-chain data across multiple DEXs
2. **Normalize** - Unifies quotes, pairs, and liquidity metadata  
3. **Score** - Computes probability-weighted profit with TTL and path constraints
4. **Emit** - Pushes minimal, real-time updates via WebSocket to the UI

### 🎯 Opportunity Scoring
Each opportunity is scored based on:
- **Profit Percentage** - Net profit after fees and slippage
- **Spread Size** - Price difference between DEXs
- **Liquidity Depth** - Available volume for execution
- **TTL (Time To Live)** - How long the opportunity remains valid
- **Execution Path** - Optimal routing for maximum profit

## 📊 Understanding the Feed

### Opportunity Format
```
[Timestamp] PAIR | BuyDEX@Price → SellDEX@Price | spread X% | profit Y% (Zbps) | size...
```

### Key Metrics
- **Spread %**: Raw price difference between DEXs
- **Profit %**: Net profit after estimated fees/slippage  
- **Basis Points (bps)**: Profit in basis points (100 bps = 1%)
- **Size**: Available liquidity for the opportunity

### Color Coding
- 🟢 **Green**: High-profit opportunities (>1%)
- 🟡 **Yellow**: Medium-profit opportunities (0.5-1%)  
- 🔴 **Red**: Low-profit or negative spread

## ⚠️ Important Disclaimers

### 🚨 Educational Use Only
SpreadNet is designed for **educational and research purposes**. It provides market data and analysis but:
- **Does NOT execute trades automatically**
- **Does NOT provide financial advice**
- **Does NOT guarantee profitable outcomes**

### 💰 Trading Risks
Arbitrage trading involves significant risks:
- **Market Volatility** - Prices can change rapidly
- **Execution Risk** - Opportunities may disappear before execution
- **Slippage** - Actual execution prices may differ from quotes
- **Gas Fees** - Transaction costs can erode profits
- **MEV Competition** - Other bots may capture opportunities first

### 🔒 Security Best Practices
- **Never share private keys** with any application
- **Use testnet first** to understand the system
- **Start with small amounts** when testing strategies
- **Monitor gas prices** and network congestion

## 🎮 Advanced Features

### 🤖 SpreadBot Integration (Coming Soon)
For qualified holders of SPREAD tokens, SpreadBot offers:
- **Automated Execution** - AI-driven trade execution
- **Risk Management** - Advanced position sizing and stop-losses
- **Portfolio Tracking** - Performance analytics and reporting
- **Access Requirements**: Minimum 10,000,000 SPREAD tokens

### 📈 Custom Strategies
SpreadNet's modular architecture allows for:
- **Custom Filters** - Define your own opportunity criteria
- **Portfolio Integration** - Track performance across strategies
- **Risk Metrics** - Analyze drawdown and volatility
- **Backtesting** - Test strategies on historical data

## 🛠️ Troubleshooting

### Common Issues

**🔴 "Connection Failed" Error**
- Check internet connection
- Verify RPC endpoints are accessible
- Try restarting the application

**📊 "No Opportunities Detected"**
- Market may be efficient (normal during low volatility)
- Adjust profit thresholds in settings
- Check DEX connectivity status

**⚡ Slow Performance**
- Close other applications to free RAM
- Use wired internet connection
- Consider upgrading hardware

**🌐 Browser Issues**
- Use Chrome/Firefox for best WebSocket support
- Disable ad blockers that may block WebSocket connections
- Clear browser cache and refresh

### Performance Optimization

For optimal performance:
- **Dedicated Hardware** - Run on a dedicated machine
- **Fast Internet** - Minimum 50Mbps stable connection
- **Monitor Resources** - Watch CPU and memory usage
- **Regular Restarts** - Restart every 24-48 hours

## 🎯 Expected Performance

### Typical Metrics
- **Opportunities/Hour**: 50-200 (depending on market conditions)
- **Average Profit**: 0.5-2% per opportunity
- **Detection Latency**: <100ms from price change
- **False Positive Rate**: <5% with default filters

### Market Conditions Impact
- **High Volatility**: More opportunities, higher profits
- **Low Volatility**: Fewer opportunities, lower profits  
- **High Network Congestion**: Slower execution, higher gas costs
- **Peak Trading Hours**: Increased competition from other bots

## 🤝 Contributing

SpreadNet is open-source and welcomes contributions:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Submit a pull request**

### Areas for Contribution
- **New DEX Integrations** - Add support for additional DEXs
- **Performance Optimizations** - Improve latency and throughput
- **UI Enhancements** - Better data visualization and UX
- **Documentation** - Improve guides and examples

## 📜 License

MIT License - See LICENSE file for details.

## ⚖️ Legal Notice

This software is provided "as is" without warranty. Users are responsible for complying with local financial regulations and tax obligations. Always consult with financial and legal professionals before engaging in trading activities.

---

**Ready to start monitoring Solana arbitrage opportunities?**

```bash
python app.py
```

**Welcome to the future of decentralized arbitrage detection! 🚀**
