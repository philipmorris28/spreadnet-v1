/**
 * Solana MVP Dashboard JavaScript
 * Handles real-time updates, WebSocket connections, and UI interactions
 */

class SolanaDashboard {
    constructor() {
        this.socket = null;
        this.opportunities = [];
        this.profitChart = null;
        this.profitData = [];
        this.activityCount = 0;
        this.startTime = Date.now();
        
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Solana Dashboard...');
        
        // Initialize WebSocket connection
        this.initWebSocket();
        
        // Initialize charts
        this.initCharts();
        
        // Start UI updates
        this.startUIUpdates();
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('✅ Dashboard initialized successfully');
    }
    
    initWebSocket() {
        console.log('🔌 Connecting to WebSocket...');
        
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.updateConnectionBadge(true);
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.updateConnectionBadge(false);
        });
        
        this.socket.on('new_opportunity', (data) => {
            this.handleNewOpportunity(data);
        });
        
        this.socket.on('opportunities_update', (data) => {
            this.handleOpportunitiesUpdate(data);
        });
        
        this.socket.on('connection_status', (data) => {
            this.updateConnectionStatus(data);
        });
        
        this.socket.on('system_stats', (data) => {
            this.updateSystemStats(data);
        });
    }
    
    initCharts() {
        const ctx = document.getElementById('profitChart').getContext('2d');
        
        this.profitChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High Profit (>1%)', 'Medium Profit (0.5-1%)', 'Low Profit (<0.5%)'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#14F195',
                        '#FFD700', 
                        '#6b7280'
                    ],
                    borderWidth: 2,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
    
    handleNewOpportunity(opportunity) {
        console.log('💰 New opportunity:', opportunity);
        
        // Add to opportunities list
        this.opportunities.unshift(opportunity);
        
        // Keep only last 50 opportunities
        if (this.opportunities.length > 50) {
            this.opportunities = this.opportunities.slice(0, 50);
        }
        
        // Update UI
        this.updateOpportunitiesTable();
        this.updateProfitChart();
        this.addActivityFeedItem(opportunity);
        
        // Show notification
        this.showNotification(opportunity);
    }
    
    handleOpportunitiesUpdate(opportunities) {
        console.log('📊 Opportunities update:', opportunities.length, 'opportunities');
        
        this.opportunities = opportunities;
        this.updateOpportunitiesTable();
        this.updateProfitChart();
    }
    
    updateConnectionStatus(status) {
        console.log('🔌 Connection status update:', status);
        
        // Update RPC status
        const rpcStatus = document.getElementById('rpc-status');
        rpcStatus.className = `badge ${status.rpc_health ? 'status-online' : 'status-offline'}`;
        rpcStatus.innerHTML = `<i class="fas fa-circle"></i> ${status.rpc_health ? 'Online' : 'Offline'}`;
        
        // Update Jupiter API status
        const jupiterStatus = document.getElementById('jupiter-status');
        jupiterStatus.className = `badge ${status.jupiter_api ? 'status-online' : 'status-offline'}`;
        jupiterStatus.innerHTML = `<i class="fas fa-circle"></i> ${status.jupiter_api ? 'Online' : 'Offline'}`;
        
        // Update WebSocket status
        const wsStatus = document.getElementById('websocket-status');
        wsStatus.className = `badge ${status.websocket ? 'status-online' : 'status-offline'}`;
        wsStatus.innerHTML = `<i class="fas fa-circle"></i> ${status.websocket ? 'Connected' : 'Disconnected'}`;
        
        // Update latest slot
        const latestSlot = document.getElementById('latest-slot');
        latestSlot.textContent = status.last_slot ? status.last_slot.toLocaleString() : '-';
        
        // Update last update time
        this.updateLastUpdateTime(status.last_update);
    }
    
    updateSystemStats(stats) {
        console.log('📈 System stats update:', stats);
        
        // Update total opportunities with animation
        this.animateNumber('total-opportunities', stats.total_opportunities);
        
        // Update average profit
        document.getElementById('avg-profit').textContent = `${stats.avg_profit_percentage.toFixed(2)}%`;
        
        // Update opportunities per minute
        document.getElementById('opportunities-per-min').textContent = stats.opportunities_per_minute.toFixed(1);
        
        // Update best profit
        document.getElementById('best-profit').textContent = `${stats.best_profit.toFixed(2)}%`;
        
        // Update uptime
        this.updateUptime(stats.uptime_seconds);
    }
    
    updateOpportunitiesTable() {
        const tbody = document.getElementById('opportunities-table');
        const liveCount = document.getElementById('live-count');
        
        // Filter valid opportunities (not expired)
        const currentTime = Date.now() / 1000;
        const validOpportunities = this.opportunities.filter(opp => {
            return (currentTime - opp.timestamp) < opp.ttl_seconds;
        });
        
        liveCount.textContent = validOpportunities.length;
        
        if (validOpportunities.length === 0) {
            tbody.innerHTML = `
                <tr class="text-center">
                    <td colspan="6" class="py-4">
                        <i class="fas fa-search fa-2x text-muted mb-3"></i>
                        <p class="mb-0 text-muted">No active opportunities found</p>
                        <small class="text-muted">Keep monitoring for new opportunities...</small>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = validOpportunities.map(opp => {
            const age = Math.floor(currentTime - opp.timestamp);
            const profitClass = this.getProfitClass(opp.profit_percentage);
            
            return `
                <tr class="opportunity-row" data-opportunity-id="${opp.id}">
                    <td>
                        <strong class="text-primary">${opp.pair}</strong>
                    </td>
                    <td>
                        <span class="badge bg-info">${opp.buy_dex}</span>
                        <br>
                        <small class="text-muted">${opp.buy_price.toFixed(8)}</small>
                    </td>
                    <td>
                        <span class="badge bg-success">${opp.sell_dex}</span>
                        <br>
                        <small class="text-muted">${opp.sell_price.toFixed(8)}</small>
                    </td>
                    <td>
                        <span class="fw-bold ${profitClass}">
                            ${opp.profit_percentage.toFixed(4)}%
                        </span>
                        <br>
                        <small class="text-muted">${opp.profit_bps} bps</small>
                    </td>
                    <td>
                        <span class="text-warning">${this.formatAmount(opp.profit_amount)}</span>
                        <br>
                        <small class="text-muted">${this.formatAmount(opp.amount)} units</small>
                    </td>
                    <td>
                        <span class="badge bg-secondary">${age}s</span>
                        <br>
                        <div class="progress" style="height: 3px; width: 40px;">
                            <div class="progress-bar bg-warning" 
                                 style="width: ${Math.max(0, (1 - age / opp.ttl_seconds) * 100)}%">
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Highlight new opportunities
        this.highlightNewOpportunities();
    }
    
    updateProfitChart() {
        const profitCounts = [0, 0, 0]; // high, medium, low
        
        this.opportunities.forEach(opp => {
            if (opp.profit_percentage > 1.0) {
                profitCounts[0]++;
            } else if (opp.profit_percentage > 0.5) {
                profitCounts[1]++;
            } else {
                profitCounts[2]++;
            }
        });
        
        this.profitChart.data.datasets[0].data = profitCounts;
        this.profitChart.update('none');
    }
    
    addActivityFeedItem(opportunity) {
        const feed = document.getElementById('activity-feed');
        const timestamp = new Date().toLocaleTimeString();
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong class="text-primary">${opportunity.pair}</strong>
                    <span class="text-success ms-2">${opportunity.profit_percentage.toFixed(4)}% profit</span>
                    <br>
                    <small class="text-muted">
                        ${opportunity.buy_dex} → ${opportunity.sell_dex}
                    </small>
                </div>
                <small class="activity-time">${timestamp}</small>
            </div>
        `;
        
        // Add to top of feed
        if (feed.children.length === 1 && feed.children[0].classList.contains('text-muted')) {
            feed.innerHTML = '';
        }
        
        feed.insertBefore(activityItem, feed.firstChild);
        
        // Keep only last 10 items
        while (feed.children.length > 10) {
            feed.removeChild(feed.lastChild);
        }
        
        this.activityCount++;
    }
    
    showNotification(opportunity) {
        // Create a subtle notification for high-profit opportunities
        if (opportunity.profit_percentage > 1.0) {
            const notification = document.createElement('div');
            notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
            notification.style.cssText = 'top: 80px; right: 20px; z-index: 1050; max-width: 300px;';
            notification.innerHTML = `
                <strong>High Profit Alert!</strong><br>
                ${opportunity.pair}: ${opportunity.profit_percentage.toFixed(4)}% profit
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }
    }
    
    highlightNewOpportunities() {
        // Add highlight effect to new opportunities
        document.querySelectorAll('.opportunity-row').forEach((row, index) => {
            if (index < 5) { // Highlight first 5 (most recent)
                setTimeout(() => {
                    row.classList.add('new-opportunity');
                    setTimeout(() => {
                        row.classList.remove('new-opportunity');
                    }, 3000);
                }, index * 100);
            }
        });
    }
    
    updateConnectionBadge(connected) {
        const badge = document.getElementById('connection-badge');
        if (connected) {
            badge.className = 'badge bg-success me-2';
            badge.innerHTML = '<i class="fas fa-circle pulse"></i> LIVE';
        } else {
            badge.className = 'badge bg-danger me-2';
            badge.innerHTML = '<i class="fas fa-circle"></i> OFFLINE';
        }
    }
    
    updateLastUpdateTime(timestamp) {
        const lastUpdate = document.getElementById('last-update');
        if (timestamp) {
            const date = new Date(timestamp * 1000);
            lastUpdate.textContent = `Last update: ${date.toLocaleTimeString()}`;
        }
    }
    
    updateUptime(seconds) {
        const uptimeElement = document.getElementById('uptime');
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        let uptimeStr = '';
        if (hours > 0) uptimeStr += `${hours}h `;
        if (minutes > 0) uptimeStr += `${minutes}m `;
        uptimeStr += `${secs}s`;
        
        uptimeElement.textContent = `Uptime: ${uptimeStr}`;
    }
    
    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue === targetValue) return;
        
        const increment = targetValue > currentValue ? 1 : -1;
        const duration = Math.min(Math.abs(targetValue - currentValue) * 50, 1000);
        const steps = Math.abs(targetValue - currentValue);
        const stepDuration = duration / steps;
        
        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            element.classList.add('counter-animate');
            
            if (current === targetValue) {
                clearInterval(timer);
                setTimeout(() => {
                    element.classList.remove('counter-animate');
                }, 500);
            }
        }, stepDuration);
    }
    
    getProfitClass(profitPercentage) {
        if (profitPercentage > 1.0) return 'profit-high';
        if (profitPercentage > 0.5) return 'profit-medium';
        return 'profit-low';
    }
    
    formatAmount(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(1) + 'K';
        }
        return amount.toString();
    }
    
    startUIUpdates() {
        // Update time-sensitive elements every second
        setInterval(() => {
            this.updateOpportunitiesTable();
        }, 1000);
        
        // Update uptime every second
        setInterval(() => {
            const currentUptime = (Date.now() - this.startTime) / 1000;
            this.updateUptime(currentUptime);
        }, 1000);
    }
    
    addEventListeners() {
        // Add any additional event listeners here
        
        // Example: Refresh button
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                location.reload();
            }
        });
        
        // Add tooltips to elements
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new SolanaDashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Page hidden - reducing updates');
    } else {
        console.log('👀 Page visible - resuming full updates');
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('❌ Dashboard error:', e.error);
});

// Export for debugging
window.SolanaDashboard = SolanaDashboard;