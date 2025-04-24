/**
 * Production configuration for Phoenix Reaper Esports website
 * Used with PM2 for process management
 */
module.exports = {
  apps : [{
    name: "phoenix-reaper-esports",
    script: "server.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 80,
      DOMAIN: "www.phoenixreaperesports.com"
    },
    watch: false,
    max_memory_restart: "1G"
  }]
}; 