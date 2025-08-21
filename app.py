#!/usr/bin/env python3
# -------------------------------------------------------------------------------------------------
#  Copyright (C) 2015-2025 Nautech Systems Pty Ltd. All rights reserved.
#  https://nautechsystems.io
#
#  Licensed under the GNU Lesser General Public License Version 3.0 (the "License");
#  You may not use this file except in compliance with the License.
#  You may obtain a copy of the License at https://www.gnu.org/licenses/lgpl-3.0.en.html
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
# -------------------------------------------------------------------------------------------------

"""
Solana MVP Frontend Application

Modern web interface for monitoring Solana arbitrage opportunities in real-time.
Features:
- Real-time dashboard with WebSocket updates
- Connection status monitoring
- Performance statistics
- Opportunity visualization
- Mobile-responsive design
"""

import asyncio
import time
import json
import logging
import ssl
import time
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import threading

import aiohttp
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SpreadNet")

app = Flask(__name__)
app.config['SECRET_KEY'] = 'spreadnet_secret_2025'
# Dev caching controls to ensure latest UI is served
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
socketio = SocketIO(app, cors_allowed_origins="*")


@dataclass
class ArbitrageOpportunity:
    """Real-time arbitrage opportunity."""
    id: str
    pair: str
    input_mint: str
    output_mint: str
    amount: int
    buy_dex: str
    sell_dex: str
    buy_price: float
    sell_price: float
    profit_bps: int
    profit_percentage: float
    profit_amount: int
    timestamp: float
    ttl_seconds: int
    
    def to_dict(self):
        return asdict(self)
    
    def is_valid(self, current_time: float) -> bool:
        return (current_time - self.timestamp) < self.ttl_seconds


@dataclass
class ConnectionStatus:
    """Connection status for various services."""
    rpc_health: bool
    jupiter_api: bool
    websocket: bool
    last_slot: int
    last_update: float
    
    def to_dict(self):
        return asdict(self)


@dataclass
class SystemStats:
    """System performance statistics."""
    total_opportunities: int
    avg_profit_percentage: float
    opportunities_per_minute: float
    uptime_seconds: float
    last_opportunity_time: float
    top_pair: str
    best_profit: float
    
    def to_dict(self):
        return asdict(self)


class SolanaMonitor:
    """Backend monitor for Solana arbitrage opportunities."""
    
    def __init__(self):
        self.running = False
        self.opportunities: List[ArbitrageOpportunity] = []
        self.connection_status = ConnectionStatus(
            rpc_health=False,
            jupiter_api=False,
            websocket=False,
            last_slot=0,
            last_update=0
        )
        self.stats = SystemStats(
            total_opportunities=0,
            avg_profit_percentage=0.0,
            opportunities_per_minute=0.0,
            uptime_seconds=0.0,
            last_opportunity_time=0.0,
            top_pair="",
            best_profit=0.0
        )
        self.start_time = time.time()
        
        # Solana connection config
        self.devnet_rpc = "https://api.devnet.solana.com"
        self.jupiter_api = "https://quote-api.jup.ag/v6"
        
        # SSL context for macOS
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
        
        # Trading pairs
        self.trading_pairs = [
            ("So11111111111111111111111111111111111111112", 
             "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 
             "SOL/USDC"),
            ("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", 
             "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 
             "RAY/USDC"),
        ]
    
    async def create_session(self):
        """Create HTTP session."""
        connector = aiohttp.TCPConnector(ssl=self.ssl_context, limit=10)
        return aiohttp.ClientSession(
            connector=connector,
            timeout=aiohttp.ClientTimeout(total=30)
        )
    
    async def check_rpc_health(self) -> bool:
        """Check Solana RPC health."""
        try:
            async with await self.create_session() as session:
                payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getHealth"
                }
                
                async with session.post(self.devnet_rpc, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("result") == "ok"
        except Exception as e:
            logger.error(f"RPC health check failed: {e}")
        return False
    
    async def get_current_slot(self) -> Optional[int]:
        """Get current Solana slot."""
        try:
            async with await self.create_session() as session:
                payload = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getSlot"
                }
                
                async with session.post(self.devnet_rpc, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("result")
        except Exception as e:
            logger.error(f"Error getting slot: {e}")
        return None
    
    async def get_jupiter_quote(self, input_mint: str, output_mint: str, amount: int) -> Optional[dict]:
        """Get Jupiter price quote."""
        try:
            async with await self.create_session() as session:
                params = {
                    "inputMint": input_mint,
                    "outputMint": output_mint,
                    "amount": str(amount),
                    "slippageBps": "50"
                }
                
                async with session.get(f"{self.jupiter_api}/quote", params=params) as response:
                    if response.status == 200:
                        return await response.json()
        except Exception as e:
            logger.debug(f"Jupiter API error: {e}")
        return None
    
    async def check_jupiter_health(self) -> bool:
        """Check Jupiter API health."""
        quote = await self.get_jupiter_quote(
            "So11111111111111111111111111111111111111112",  # SOL
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  # USDC
            1_000_000_000
        )
        return quote is not None and "outAmount" in quote
    
    async def detect_arbitrage_opportunities(self) -> List[ArbitrageOpportunity]:
        """Detect arbitrage opportunities."""
        opportunities = []
        current_time = time.time()

        for input_mint, output_mint, pair_name in self.trading_pairs:
            quote = await self.get_jupiter_quote(input_mint, output_mint, 1_000_000_000)
            
            if quote and "outAmount" in quote:
                in_amount = int(quote["inAmount"])
                out_amount = int(quote["outAmount"])
                jupiter_price = out_amount / in_amount
                
                # Simulate price differences from other DEXs
                price_variations = [0.995, 1.005, 0.998, 1.012, 0.992]
                dex_names = ["Raydium", "Orca", "Phoenix", "Serum", "Aldrin"]
                
                for i, (variation, dex_name) in enumerate(zip(price_variations, dex_names)):
                    simulated_price = jupiter_price * variation
                    
                    if abs(simulated_price - jupiter_price) / jupiter_price > 0.005:  # >0.5%
                        profit_pct = abs(simulated_price - jupiter_price) / jupiter_price * 100
                        profit_bps = int(profit_pct * 100)
                        
                        if simulated_price > jupiter_price:
                            buy_dex, sell_dex = "Jupiter", dex_name
                            buy_price, sell_price = jupiter_price, simulated_price
                        else:
                            buy_dex, sell_dex = dex_name, "Jupiter"
                            buy_price, sell_price = simulated_price, jupiter_price
                        
                        opportunity = ArbitrageOpportunity(
                            id=f"{pair_name}_{buy_dex}_{sell_dex}_{int(current_time)}",
                            pair=pair_name,
                            input_mint=input_mint,
                            output_mint=output_mint,
                            amount=in_amount,
                            buy_dex=buy_dex,
                            sell_dex=sell_dex,
                            buy_price=buy_price,
                            sell_price=sell_price,
                            profit_bps=profit_bps,
                            profit_percentage=profit_pct,
                            profit_amount=int((sell_price - buy_price) * in_amount),
                            timestamp=current_time,
                            ttl_seconds=30,
                        )
                        
                        opportunities.append(opportunity)

        return opportunities
    
    async def update_connection_status(self):
        """Update connection status."""
        current_time = time.time()
        
        # Check RPC health
        self.connection_status.rpc_health = await self.check_rpc_health()
        
        # Check Jupiter API
        self.connection_status.jupiter_api = await self.check_jupiter_health()
        
        # Get current slot
        slot = await self.get_current_slot()
        if slot:
            self.connection_status.last_slot = slot
        
        # WebSocket is simulated as always connected for this demo
        self.connection_status.websocket = True
        self.connection_status.last_update = current_time
    
    def update_stats(self, new_opportunities: List[ArbitrageOpportunity]):
        """Update system statistics."""
        current_time = time.time()
        
        if new_opportunities:
            self.stats.total_opportunities += len(new_opportunities)
            self.stats.last_opportunity_time = current_time
            
            # Calculate average profit
            all_profits = [opp.profit_percentage for opp in self.opportunities[-100:]]  # Last 100
            if all_profits:
                self.stats.avg_profit_percentage = sum(all_profits) / len(all_profits)
            
            # Find best opportunity
            best_opp = max(new_opportunities, key=lambda x: x.profit_percentage)
            if best_opp.profit_percentage > self.stats.best_profit:
                self.stats.best_profit = best_opp.profit_percentage
                self.stats.top_pair = best_opp.pair
        
        # Calculate uptime and opportunities per minute
        self.stats.uptime_seconds = current_time - self.start_time
        if self.stats.uptime_seconds > 0:
            self.stats.opportunities_per_minute = (
                self.stats.total_opportunities / (self.stats.uptime_seconds / 60)
            )
    
    async def monitor_loop(self):
        """Main monitoring loop."""
        logger.info("🚀 Starting SpreadNet monitoring engine...")
        iteration = 0
        
        while self.running:
            try:
                iteration += 1
                logger.info(f"🔄 Monitoring cycle #{iteration}")
                
                # Update connection status
                await self.update_connection_status()
                
                # Detect new opportunities
                new_opportunities = await self.detect_arbitrage_opportunities()
                
                # Update opportunities list (keep last 50)
                self.opportunities.extend(new_opportunities)
                self.opportunities = self.opportunities[-50:]
                
                # Update statistics
                self.update_stats(new_opportunities)
                
                # Emit updates to frontend
                if new_opportunities:
                    for opp in new_opportunities:
                        socketio.emit('new_opportunity', opp.to_dict())
                        logger.info(f"💰 New opportunity: {opp.pair} {opp.profit_percentage:.4f}%")
                
                socketio.emit('connection_status', self.connection_status.to_dict())
                socketio.emit('system_stats', self.stats.to_dict())
                
                # Wait before next cycle
                await asyncio.sleep(8)  # 8 second cycles
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)
    
    def start_monitoring(self):
        """Start monitoring in background thread."""
        def run_loop():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            self.running = True
            loop.run_until_complete(self.monitor_loop())
        
        thread = threading.Thread(target=run_loop, daemon=True)
        thread.start()
        logger.info("✅ Background monitoring started")
    
    def stop_monitoring(self):
        """Stop monitoring."""
        self.running = False
        logger.info("🛑 Monitoring stopped")


# Global monitor instance
monitor = SolanaMonitor()


@app.route('/')
def dashboard():
    """Main SpreadNet dashboard page."""
    return render_template('dashboard_new.html')


@app.route('/api/opportunities')
def get_opportunities():
    """Get current arbitrage opportunities."""
    current_time = time.time()
    valid_opportunities = [
        opp.to_dict() for opp in monitor.opportunities 
        if opp.is_valid(current_time)
    ]
    return jsonify(valid_opportunities)


@app.route('/api/connection-status')
def get_connection_status():
    """Get connection status."""
    return jsonify(monitor.connection_status.to_dict())


@app.route('/api/stats')
def get_stats():
    """Get system statistics."""
    return jsonify(monitor.stats.to_dict())


@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    logger.info(f"🔌 Client connected: {request.sid}")
    
    # Send initial data
    emit('connection_status', monitor.connection_status.to_dict())
    emit('system_stats', monitor.stats.to_dict())
    
    # Send recent opportunities
    current_time = time.time()
    valid_opportunities = [
        opp.to_dict() for opp in monitor.opportunities 
        if opp.is_valid(current_time)
    ]
    emit('opportunities_update', valid_opportunities)


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    logger.info(f"🔌 Client disconnected: {request.sid}")


if __name__ == '__main__':
    """
    Solana MVP Frontend Application
    
    Features:
    - Real-time arbitrage opportunity monitoring
    - WebSocket-based live updates
    - Connection status tracking
    - Performance statistics
    - Modern responsive web interface
    
    Usage:
        python solana_mvp_frontend/app.py
        
    Then open: http://localhost:5000
    """
    
    # Start background monitoring
    monitor.start_monitoring()
    
    try:
        logger.info("🌐 Starting SpreadNet Platform Server...")
        logger.info("📊 SpreadNet Dashboard available at: http://localhost:8080")
        logger.info("⚡ Real-time arbitrage monitoring active")
        
        # Run Flask app with SocketIO
        socketio.run(
            app, 
            host='0.0.0.0', 
            port=8080, 
            debug=False,
            allow_unsafe_werkzeug=True
        )
        
    except KeyboardInterrupt:
        logger.info("\n🛑 Shutting down frontend server...")
        monitor.stop_monitoring()
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
        monitor.stop_monitoring()