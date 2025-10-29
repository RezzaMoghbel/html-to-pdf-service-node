// routes/health.js
// Health check endpoints for monitoring and load balancers
// Provides system status and basic diagnostics

const express = require("express");
const router = express.Router();
const { version } = require("../package.json");
const { nodeEnv, port } = require("../config/environment");

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns basic service status and system information. Requires API key authentication.
 *     tags: [Health]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
router.get("/", (req, res) => {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: version,
    environment: nodeEnv,
    port: port,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    },
  };

  res.status(200).json(healthCheck);
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns detailed system information for monitoring. Requires API key authentication.
 *     tags: [Health]
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 system:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                     memory:
 *                       type: object
 *                     cpu:
 *                       type: object
 *                 service:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     port:
 *                       type: number
 */
router.get("/detailed", (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const detailedHealth = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
        external: Math.round(memoryUsage.external / 1024 / 1024) + " MB",
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      platform: process.platform,
      nodeVersion: process.version,
    },
    service: {
      version: version,
      environment: nodeEnv,
      port: port,
      pid: process.pid,
    },
  };

  res.status(200).json(detailedHealth);
});

module.exports = router;
