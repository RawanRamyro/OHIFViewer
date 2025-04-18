module.exports = {
  apps: [
    {
      name: 'ohif-viewer',
      script: 'npx',
      args: 'serve -s build -l 3000',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_restarts: 10,
      restart_delay: 5000,
      log_date_format: 'YYYY-MM-DD HH:mm:SS',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
    },
  ],
};
