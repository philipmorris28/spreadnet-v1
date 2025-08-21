/**
 * DeltaSol - Advanced Solana Arbitrage Platform
 * Modern JavaScript with navigation, animations, and enhanced UX
 */

class DeltaSol {
    constructor() {
        this.socket = null;
        this.eventSource = null;
        this.useSSE = true; // Prefer SSE on Vercel Edge; fallback to WS locally
        this.opportunities = [];
        this.allOpportunities = [];
        this.profitChart = null;
        this.profitData = [];
        this.activityCount = 0;
        this.startTime = Date.now();
        this.currentSection = 'dashboard';
        
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing DeltaSol Platform...');
        
        // Initialize navigation
        this.initNavigation();
        
        // Initialize real-time channel (SSE first, fallback to WebSocket)
        this.initSSE();
        
        // Charts removed for minimal terminal mode
        
        // Start UI updates
        this.startUIUpdates();
        
        // Add event listeners
        this.addEventListeners();
        
        console.log('✅ DeltaSol Platform initialized successfully');
    }
    
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        const sections = document.querySelectorAll('.section-content');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetSection = link.getAttribute('data-section');
                this.showSection(targetSection);
                
                // Update active nav link
                navLinks.forEach(nl => nl.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // Handle hash changes for direct linking
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && ['dashboard', 'docs', 'roadmap', 'spreadbot'].includes(hash)) {
                this.showSection(hash);
            }
        });
        
        // Initialize based on current hash
        const initialHash = window.location.hash.substring(1);
        if (initialHash && ['dashboard', 'docs', 'roadmap', 'spreadbot'].includes(initialHash)) {
            this.showSection(initialHash);
        }
    }
    
    showSection(sectionName) {
        const sections = document.querySelectorAll('.section-content');
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        
        // Hide all sections
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show target section with animation
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('slide-in-right');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                targetSection.classList.remove('slide-in-right');
            }, 600);
        }
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionName) {
                link.classList.add('active');
            }
        });
        
        this.currentSection = sectionName;
        
        // Update URL hash
        history.pushState(null, null, `#${sectionName}`);
        
        // Pause/resume WebSocket updates based on section
        if (sectionName === 'dashboard') {
            this.resumeUpdates();
        } else {
            this.pauseUpdates();
        }
    }
    
    initWebSocket() {
        console.log('🔌 Connecting to DeltaSol WebSocket...');
        
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected to DeltaSol');
            this.updateConnectionBadge(true);
            this.showConnectionNotification('Connected to DeltaSol (WS)', 'success');
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected from DeltaSol');
            this.updateConnectionBadge(false);
            this.showConnectionNotification('Disconnected from DeltaSol (WS)', 'error');
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

    initSSE() {
        if (!this.useSSE || typeof EventSource === 'undefined') {
            console.warn('SSE not available, falling back to WebSocket');
            this.useSSE = false;
            this.initWebSocket();
            return;
        }
        try {
            console.log('🔌 Connecting to DeltaSol SSE...');
            this.eventSource = new EventSource('/api/stream');
            this.eventSource.onopen = () => {
                console.log('✅ SSE connected to DeltaSol');
                this.updateConnectionBadge(true);
            };
            this.eventSource.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    if (msg && msg.type === 'opportunity') {
                        this.handleNewOpportunity(msg.payload);
                    }
                } catch (e) {
                    // ignore malformed lines
                }
            };
            this.eventSource.onerror = () => {
                console.warn('SSE error - falling back to WebSocket');
                this.updateConnectionBadge(false);
                if (this.eventSource) this.eventSource.close();
                this.useSSE = false;
                this.initWebSocket();
            };
        } catch (e) {
            console.warn('SSE init failed - falling back to WebSocket', e);
            this.useSSE = false;
            this.initWebSocket();
        }
    }
    
    initCharts() {}
    
    handleNewOpportunity(opportunity) {
        console.log('💰 New DeltaSol opportunity:', opportunity);
        
        // Add to opportunities list
        this.opportunities.unshift(opportunity);
        this.allOpportunities.unshift(opportunity);
        if (this.allOpportunities.length > 2000) {
            this.allOpportunities.length = 2000;
        }

        // Append to terminal output
        this.appendTerminalLine(opportunity);
        
        // Keep only last 50 opportunities
        if (this.opportunities.length > 50) {
            this.opportunities = this.opportunities.slice(0, 50);
        }
        
        // Update UI only if on dashboard
        if (this.currentSection === 'dashboard') {
            this.updateOpportunitiesTable();
            this.addActivityFeedItem(opportunity);
        }
        
        // Update local aggregated stats (simulate taking all trades)
        this.updateLocalStats();
        
        // Popups disabled for minimal terminal UX
    }
    
    handleOpportunitiesUpdate(opportunities) {
        console.log('📊 DeltaSol opportunities update:', opportunities.length, 'opportunities');
        
        this.opportunities = opportunities;
        if (this.currentSection === 'dashboard') {
            this.updateOpportunitiesTable();
        }
        // Refresh stats as well
        this.updateLocalStats();
    }
    
    updateConnectionStatus(status) {
        console.log('🔌 DeltaSol connection status update:', status);
        
        // Update RPC status
        const rpcIcon = document.getElementById('rpc-icon');
        const rpcStatus = document.getElementById('rpc-status');
        if (rpcIcon && rpcStatus) {
            rpcIcon.className = `connection-icon ${status.rpc_health ? 'online' : 'offline'}`;
            rpcStatus.textContent = status.rpc_health ? 'Connected' : 'Disconnected';
        }
        
        // Update Jupiter API status
        const jupiterIcon = document.getElementById('jupiter-icon');
        const jupiterStatus = document.getElementById('jupiter-status');
        if (jupiterIcon && jupiterStatus) {
            jupiterIcon.className = `connection-icon ${status.jupiter_api ? 'online' : 'offline'}`;
            jupiterStatus.textContent = status.jupiter_api ? 'Active' : 'Inactive';
        }
        
        // Update WebSocket status
        const wsIcon = document.getElementById('ws-icon');
        const wsStatus = document.getElementById('websocket-status');
        if (wsIcon && wsStatus) {
            wsIcon.className = `connection-icon ${status.websocket ? 'online' : 'offline'}`;
            wsStatus.textContent = status.websocket ? 'Connected' : 'Disconnected';
        }
        
        // Update latest slot
        const latestSlot = document.getElementById('latest-slot');
        if (latestSlot) {
            latestSlot.textContent = status.last_slot ? 
                `#${status.last_slot.toLocaleString()}` : 'Unknown';
        }
        
        // Update last update time
        this.updateLastUpdateTime(status.last_update);
    }
    
    updateSystemStats(stats) {
        console.log('📈 DeltaSol system stats update:', stats);
        
        // Prefer local computed stats for UI consistency; still use uptime
        this.updateUptime(stats.uptime_seconds);
    }

    updateLocalStats() {
        const total = this.allOpportunities.length;
        const totalElement = document.getElementById('total-opportunities');
        const avgElement = document.getElementById('avg-profit');
        const bestElement = document.getElementById('best-profit');
        const opmElement = document.getElementById('opportunities-per-min');
        const lastUpdate = document.getElementById('last-update');
        
        if (!totalElement || !avgElement || !bestElement || !opmElement) return;
        
        // Compute aggregates
        let sum = 0;
        let best = 0;
        for (const opp of this.allOpportunities) {
            sum += Number(opp.profit_percentage) || 0;
            if ((Number(opp.profit_percentage) || 0) > best) best = Number(opp.profit_percentage) || 0;
        }
        const avg = total > 0 ? sum / total : 0;
        const minutes = Math.max(1/60, (Date.now() - this.startTime) / 60000);
        const opm = total / minutes;
        
        // Animate and update
        this.animateNumber('total-opportunities', total);
        avgElement.textContent = avg.toFixed(2) + '%';
        bestElement.textContent = best.toFixed(2) + '%';
        opmElement.textContent = opm.toFixed(1);
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleTimeString();
        }
    }
    
    updateOpportunitiesTable() {
        const tbody = document.getElementById('opportunities-table');
        const liveCount = document.getElementById('live-count');
        
        if (!tbody || !liveCount) return;
        
        // Filter valid opportunities (not expired)
        const currentTime = Date.now() / 1000;
        const validOpportunities = this.opportunities.filter(opp => {
            return (currentTime - opp.timestamp) < opp.ttl_seconds;
        });
        
        liveCount.textContent = `${validOpportunities.length} Active`;
        
        if (validOpportunities.length === 0) {
            tbody.innerHTML = `
                <tr class="text-center">
                    <td colspan="6" class="py-5">
                        <div class="loading-pulse">
                            <i class="fas fa-search fa-3x text-muted mb-3"></i>
                            <p class="text-muted mb-0">No active opportunities found</p>
                            <small class="text-muted">DeltaSol is scanning for new opportunities...</small>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = validOpportunities.map(opp => {
            const age = Math.floor(currentTime - opp.timestamp);
            const profitClass = this.getProfitClass(opp.profit_percentage);
            const timeLeft = Math.max(0, opp.ttl_seconds - age);
            const progressPercent = Math.max(0, (timeLeft / opp.ttl_seconds) * 100);
            
            return `
                <tr class="opportunity-row opportunity-highlight" data-opportunity-id="${opp.id}">
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="fas fa-coins text-warning me-2"></i>
                            <strong class="text-gradient">${opp.pair}</strong>
                        </div>
                    </td>
                    <td>
                        <span class="dex-badge">${opp.buy_dex}</span>
                        <br>
                        <small class="text-muted">${opp.buy_price.toFixed(8)}</small>
                    </td>
                    <td>
                        <span class="dex-badge">${opp.sell_dex}</span>
                        <br>
                        <small class="text-muted">${opp.sell_price.toFixed(8)}</small>
                    </td>
                    <td>
                        <span class="profit-badge ${profitClass}">
                            ${opp.profit_percentage.toFixed(4)}%
                        </span>
                        <br>
                        <small class="text-muted">${opp.profit_bps} bps</small>
                    </td>
                    <td>
                        <span class="text-success fw-bold">${this.formatAmount(opp.profit_amount)}</span>
                        <br>
                        <small class="text-muted">${this.formatAmount(opp.amount)} units</small>
                    </td>
                    <td>
                        <div class="text-center">
                            <small class="text-muted">${timeLeft}s</small>
                            <div class="progress-deltasol mt-1" style="width: 50px;">
                                <div class="progress-bar" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Remove highlight after a short delay for each row (staggered)
        this.fadeOutHighlights();
    }
    
    updateProfitChart() {}
    
    addActivityFeedItem(_) {
        // Sezione rimossa: nessun activity feed
        return;
    }
    
    showOpportunityNotification(_) { /* disabled */ }
    
    showConnectionNotification(message, type) {
        console.log(`🔔 ${message}`);
        // Could implement toast notifications here
    }
    
    updateConnectionBadge(connected) {
        const liveIndicators = document.querySelectorAll('.live-indicator');
        liveIndicators.forEach(indicator => {
            if (connected) {
                indicator.innerHTML = '<i class="fas fa-circle"></i>LIVE';
                indicator.className = 'live-indicator';
            } else {
                indicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i>OFFLINE';
                indicator.style.color = '#ef4444';
            }
        });
    }
    
    updateLastUpdateTime(timestamp) {
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate && timestamp) {
            const date = new Date(timestamp * 1000);
            lastUpdate.textContent = `Last update: ${date.toLocaleTimeString()}`;
        }
    }
    
    updateUptime(seconds) {
        const uptimeElement = document.getElementById('uptime');
        if (!uptimeElement) return;
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        let uptimeStr = 'Uptime: ';
        if (hours > 0) uptimeStr += `${hours}h `;
        if (minutes > 0) uptimeStr += `${minutes}m `;
        uptimeStr += `${secs}s`;
        
        uptimeElement.textContent = uptimeStr;
    }
    
    animateNumber(elementId, targetValue, decimals = 0) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseFloat(element.textContent) || 0;
        if (Math.abs(currentValue - targetValue) < 0.01) return;
        
        const increment = (targetValue - currentValue) / 30;
        let current = currentValue;
        
        const timer = setInterval(() => {
            current += increment;
            
            if ((increment > 0 && current >= targetValue) || 
                (increment < 0 && current <= targetValue)) {
                current = targetValue;
                clearInterval(timer);
            }
            
            element.textContent = decimals > 0 ? 
                current.toFixed(decimals) : 
                Math.round(current).toLocaleString();
        }, 16);
    }
    
    animatePercentage(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        this.animateNumber(elementId.replace('-', '_temp_'), targetValue, 2);
        
        // Update with percentage sign
        setTimeout(() => {
            const tempElement = document.getElementById(elementId.replace('-', '_temp_'));
            if (tempElement) {
                element.textContent = targetValue.toFixed(2) + '%';
            }
        }, 500);
    }
    
    fadeOutHighlights() {
        const rows = document.querySelectorAll('.opportunity-highlight');
        rows.forEach((row, index) => {
            setTimeout(() => {
                row.classList.remove('opportunity-highlight');
            }, 1800 + index * 120);
        });
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
        return Math.round(amount).toLocaleString();
    }
    
    startUIUpdates() {
        // Update time-sensitive elements every second
        this.updateInterval = setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.updateOpportunitiesTable();
            }
        }, 1000);
        
        // Update uptime every second
        this.uptimeInterval = setInterval(() => {
            const currentUptime = (Date.now() - this.startTime) / 1000;
            this.updateUptime(currentUptime);
        }, 1000);
    }

    appendTerminalLine(opp) {
        const out = document.getElementById('terminal-output');
        if (!out) return;
        const now = new Date();
        const time = now.toLocaleTimeString();
        const profitClass = opp.profit_percentage > 1 ? '' : (opp.profit_percentage > 0.5 ? ' med' : ' low');
        const line = document.createElement('div');
        line.className = 'terminal-line';
        const buyPrice = typeof opp.buy_price === 'number' ? opp.buy_price : NaN;
        const sellPrice = typeof opp.sell_price === 'number' ? opp.sell_price : NaN;
        const amount = typeof opp.amount === 'number' ? opp.amount : NaN;
        const pnl = typeof opp.profit_amount === 'number' ? opp.profit_amount : NaN;
        const bps = typeof opp.profit_bps === 'number' ? opp.profit_bps : Math.round((opp.profit_percentage || 0) * 100);
        line.innerHTML = `
            <span class="time">[${time}]</span>
            <span class="pair">${opp.pair}</span>
            <span class="dex">${opp.buy_dex}@${isNaN(buyPrice) ? '-' : buyPrice.toFixed(6)} → ${opp.sell_dex}@${isNaN(sellPrice) ? '-' : sellPrice.toFixed(6)}</span>
            <span class="profit${profitClass}">${Number(opp.profit_percentage || 0).toFixed(3)}% (${bps}bps)</span>
            <span class="size">sz ${isNaN(amount) ? '-' : this.formatAmount(amount)}</span>
            <span class="pnl">pnl ${isNaN(pnl) ? '-' : this.formatAmount(pnl)}</span>
            <span class="ttl">ttl ${opp.ttl_seconds}s</span>
        `;
        out.prepend(line);
        // Trim lines
        while (out.children.length > 150) out.removeChild(out.lastChild);
        // Flash effect
        line.style.filter = 'brightness(1.6)';
        setTimeout(()=>{ line.style.filter='brightness(1)'; }, 250);
    }
    
    pauseUpdates() {
        // Reduce update frequency when not on dashboard
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => {
                // Minimal updates for background sections
            }, 5000);
        }
    }
    
    resumeUpdates() {
        // Resume full update frequency on dashboard
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => {
                this.updateOpportunitiesTable();
            }, 1000);
        }
    }
    
    addEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '1' && e.altKey) {
                e.preventDefault();
                this.showSection('dashboard');
            } else if (e.key === '2' && e.altKey) {
                e.preventDefault();
                this.showSection('about');
            } else if (e.key === '3' && e.altKey) {
                e.preventDefault();
                this.showSection('roadmap');
            }
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize DeltaSol when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.deltasol = new DeltaSol();
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 DeltaSol page hidden - reducing updates');
        if (window.deltasol) {
            window.deltasol.pauseUpdates();
        }
    } else {
        console.log('👀 DeltaSol page visible - resuming full updates');
        if (window.deltasol) {
            window.deltasol.resumeUpdates();
        }
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('❌ DeltaSol error:', e.error);
});

// Smooth page transitions
window.addEventListener('beforeunload', () => {
    console.log('🏁 DeltaSol session ending...');
});

// Export for debugging
window.DeltaSol = DeltaSol;