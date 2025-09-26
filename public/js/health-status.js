// Health Status Widget
// Displays a visual health indicator with heartbeat animation
class HealthStatusWidget {
  constructor(options = {}) {
    this.options = {
      position: options.position || "bottom-right", // bottom-right, bottom-left, top-right, top-left
      showDetails: options.showDetails || false, // Show detailed health info on hover
      refreshInterval: options.refreshInterval || 30000, // Refresh every 30 seconds
      endpoint: options.endpoint || "/health",
      ...options,
    };

    this.isHealthy = false;
    this.lastCheck = null;
    this.refreshTimer = null;

    this.init();
  }

  init() {
    this.createWidget();
    this.checkHealth();
    this.startAutoRefresh();
  }

  createWidget() {
    // Create widget container
    this.widget = document.createElement("div");
    this.widget.id = "health-status-widget";
    this.widget.className = `health-widget health-widget--${this.options.position}`;

    // Create heartbeat icon
    this.heartbeat = document.createElement("div");
    this.heartbeat.className = "health-widget__heartbeat";
    this.heartbeat.innerHTML = "💓";

    // Create status text
    this.statusText = document.createElement("span");
    this.statusText.className = "health-widget__text";
    this.statusText.textContent = "Checking...";

    // Create details container (for hover)
    this.details = document.createElement("div");
    this.details.className = "health-widget__details";
    this.details.style.display = "none";

    // Assemble widget
    this.widget.appendChild(this.heartbeat);
    this.widget.appendChild(this.statusText);
    this.widget.appendChild(this.details);

    // Add to page
    document.body.appendChild(this.widget);

    // Add hover event for details
    if (this.options.showDetails) {
      this.widget.addEventListener("mouseenter", () => this.showDetails());
      this.widget.addEventListener("mouseleave", () => this.hideDetails());
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(this.options.endpoint);
      const data = await response.json();

      this.isHealthy = response.ok && data.status === "healthy";
      this.lastCheck = new Date();
      this.healthData = data;

      this.updateDisplay();
    } catch (error) {
      this.isHealthy = false;
      this.lastCheck = new Date();
      this.healthData = null;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    const heartbeat = this.widget.querySelector(".health-widget__heartbeat");
    const statusText = this.widget.querySelector(".health-widget__text");

    if (this.isHealthy) {
      heartbeat.className =
        "health-widget__heartbeat health-widget__heartbeat--healthy";
      statusText.textContent = "All Good";
      this.widget.className = `health-widget health-widget--${this.options.position} health-widget--healthy`;
    } else {
      heartbeat.className =
        "health-widget__heartbeat health-widget__heartbeat--unhealthy";
      statusText.textContent = "Issues";
      this.widget.className = `health-widget health-widget--${this.options.position} health-widget--unhealthy`;
    }
  }

  showDetails() {
    if (!this.healthData) return;

    const details = this.widget.querySelector(".health-widget__details");
    const uptime = this.formatUptime(this.healthData.uptime);
    const memory = this.healthData.memory
      ? `${this.healthData.memory.used} / ${this.healthData.memory.total}`
      : "N/A";

    details.innerHTML = `
      <div class="health-widget__details-content">
        <h4>Service Status</h4>
        <p><strong>Status:</strong> ${this.healthData.status}</p>
        <p><strong>Uptime:</strong> ${uptime}</p>
        <p><strong>Version:</strong> ${this.healthData.version}</p>
        <p><strong>Environment:</strong> ${this.healthData.environment}</p>
        <p><strong>Memory:</strong> ${memory}</p>
        <p><strong>Last Check:</strong> ${this.lastCheck.toLocaleTimeString()}</p>
      </div>
    `;
    details.style.display = "block";
  }

  hideDetails() {
    const details = this.widget.querySelector(".health-widget__details");
    details.style.display = "none";
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  startAutoRefresh() {
    this.refreshTimer = setInterval(() => {
      this.checkHealth();
    }, this.options.refreshInterval);
  }

  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.widget && this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Only initialize if not already present
  if (!document.getElementById("health-status-widget")) {
    new HealthStatusWidget({
      position: "bottom-right",
      showDetails: true,
      refreshInterval: 30000,
    });
  }
});

// Export for manual initialization
window.HealthStatusWidget = HealthStatusWidget;
