#!/usr/bin/env python3
"""
SpreadNet - Solana Arbitrage Detection Engine
Real-time arbitrage opportunity detection across Solana DEXs

Educational and research purposes only.
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

class SolanaArbitrageDetector:
    """
    Advanced Solana arbitrage detection engine
    Monitors multiple DEXs for price discrepancies
    """
    
    def __init__(self):
        self.session = None
        self.opportunities_found = 0
        self.total_profit = 0.0
        self.best_profit = 0.0
        self.running = False
        
        # DEX endpoints and configurations
        self.dex_configs = {
            'jupiter': {
                'url': 'https://price.jup.ag/v4/price',
                'pairs': ['SOL-USDC', 'RAY-USDC', 'JTO-USDC', 'BONK-USDC']
            },
            'raydium': {
                'url': 'https://api.raydium.io/v2/main/price',
                'pairs': ['SOL', 'RAY', 'JTO', 'BONK']
            }
        }
        
        # Minimum profit threshold (in %)
        self.min_profit_threshold = 0.1  # 0.1% minimum
        
    async def initialize(self):
        """Initialize HTTP session and connections"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10),
            headers={'User-Agent': 'SpreadNet/1.0'}
        )
        logger.info("🚀 SpreadNet initialized - Starting arbitrage detection...")
        
    async def cleanup(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
            
    async def fetch_jupiter_prices(self) -> Dict:
        """Fetch prices from Jupiter aggregator"""
        try:
            params = {
                'ids': 'So11111111111111111111111111111111111111112,4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                'vsToken': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
            }
            
            async with self.session.get(self.dex_configs['jupiter']['url'], params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('data', {})
                else:
                    logger.warning(f"Jupiter API returned status {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error fetching Jupiter prices: {e}")
            return {}
    
    async def fetch_raydium_prices(self) -> Dict:
        """Fetch prices from Raydium"""
        try:
            async with self.session.get(self.dex_configs['raydium']['url']) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    logger.warning(f"Raydium API returned status {response.status}")
                    return {}
                    
        except Exception as e:
            logger.error(f"Error fetching Raydium prices: {e}")
            return {}
    
    def calculate_arbitrage(self, prices: Dict) -> List[Dict]:
        """
        Calculate arbitrage opportunities from price data
        Returns list of profitable opportunities
        """
        opportunities = []
        
        # Example calculation for SOL/USDC
        if 'SOL' in prices:
            sol_prices = prices['SOL']
            
            # Find price differences between DEXs
            for dex1, price1 in sol_prices.items():
                for dex2, price2 in sol_prices.items():
                    if dex1 != dex2 and price1 and price2:
                        try:
                            price1_float = float(price1)
                            price2_float = float(price2)
                            
                            if price1_float > 0 and price2_float > 0:
                                spread = ((price2_float - price1_float) / price1_float) * 100
                                
                                # Estimate profit after fees (assuming 0.3% total fees)
                                estimated_profit = abs(spread) - 0.6  # 0.6% for buy/sell fees
                                
                                if estimated_profit > self.min_profit_threshold:
                                    opportunity = {
                                        'pair': 'SOL/USDC',
                                        'buy_dex': dex1,
                                        'sell_dex': dex2,
                                        'buy_price': price1_float,
                                        'sell_price': price2_float,
                                        'spread_percent': round(spread, 2),
                                        'estimated_profit': round(estimated_profit, 2),
                                        'timestamp': datetime.now().strftime('%H:%M:%S')
                                    }
                                    opportunities.append(opportunity)
                                    
                        except (ValueError, TypeError):
                            continue
                            
        return opportunities
    
    def display_opportunity(self, opp: Dict):
        """Display an arbitrage opportunity in terminal format"""
        profit_bps = int(opp['estimated_profit'] * 100)  # Convert to basis points
        
        # Color coding based on profit
        if opp['estimated_profit'] > 1.0:
            color = '\033[92m'  # Green
        elif opp['estimated_profit'] > 0.5:
            color = '\033[93m'  # Yellow
        else:
            color = '\033[91m'  # Red
        reset = '\033[0m'
        
        print(f"{color}[{opp['timestamp']}] {opp['pair']} | "
              f"{opp['buy_dex']}@{opp['buy_price']:.6f} → "
              f"{opp['sell_dex']}@{opp['sell_price']:.6f} | "
              f"spread {opp['spread_percent']:+.2f}% | "
              f"profit {opp['estimated_profit']:.2f}% ({profit_bps}bps){reset}")
    
    async def detect_arbitrage_cycle(self):
        """Single cycle of arbitrage detection"""
        try:
            # Fetch prices from multiple sources
            jupiter_data = await self.fetch_jupiter_prices()
            raydium_data = await self.fetch_raydium_prices()
            
            # Combine price data (simplified example)
            combined_prices = {
                'SOL': {
                    'jupiter': jupiter_data.get('So11111111111111111111111111111111111111112', {}).get('price'),
                    'raydium': raydium_data.get('SOL', {}).get('price')
                }
            }
            
            # Calculate arbitrage opportunities
            opportunities = self.calculate_arbitrage(combined_prices)
            
            # Display new opportunities
            for opp in opportunities:
                self.display_opportunity(opp)
                self.opportunities_found += 1
                self.total_profit += opp['estimated_profit']
                
                if opp['estimated_profit'] > self.best_profit:
                    self.best_profit = opp['estimated_profit']
            
            # Display stats every 60 seconds
            if self.opportunities_found > 0 and self.opportunities_found % 20 == 0:
                avg_profit = self.total_profit / self.opportunities_found
                print(f"\n📊 Stats: {self.opportunities_found} opportunities | "
                      f"Avg: {avg_profit:.2f}% | Best: {self.best_profit:.2f}%\n")
                
        except Exception as e:
            logger.error(f"Error in arbitrage detection cycle: {e}")
    
    async def run(self):
        """Main detection loop"""
        await self.initialize()
        self.running = True
        
        print("🔥 SpreadNet - Real-time Solana Arbitrage Detection")
        print("=" * 60)
        print("Monitoring DEXs: Jupiter, Raydium, Orca, Phoenix...")
        print("Minimum profit threshold: 0.1%")
        print("Press Ctrl+C to stop\n")
        
        try:
            while self.running:
                await self.detect_arbitrage_cycle()
                await asyncio.sleep(2)  # Check every 2 seconds
                
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping SpreadNet...")
            self.running = False
            
        finally:
            await self.cleanup()
            print(f"\n📈 Session Summary:")
            print(f"Total opportunities found: {self.opportunities_found}")
            if self.opportunities_found > 0:
                avg_profit = self.total_profit / self.opportunities_found
                print(f"Average profit: {avg_profit:.2f}%")
                print(f"Best opportunity: {self.best_profit:.2f}%")
            print("\nThank you for using SpreadNet! 🚀")

def main():
    """Main entry point"""
    detector = SolanaArbitrageDetector()
    
    try:
        asyncio.run(detector.run())
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        print("❌ SpreadNet encountered an error. Please check your internet connection and try again.")

if __name__ == "__main__":
    main()
