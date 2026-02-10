
module.exports = {
  apps: [{
    name: 'certificate-api',
    script: './src/server.js',
    cwd: '/var/www/certificate-app/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,  
      DB_USER: 'your_db_user',
      DB_PASSWORD: 'your_db_password',
      DB_HOST: 'localhost',
      DB_NAME: 'certificate_db',
      DB_PORT: 5433,  
      JWT_SECRET: 'your_jwt_secret_here'
    },
    error_file: '/var/log/pm2/certificate-api-error.log',
    out_file: '/var/log/pm2/certificate-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    listen_timeout: 3000,
    kill_timeout: 5000,
  }]
};
