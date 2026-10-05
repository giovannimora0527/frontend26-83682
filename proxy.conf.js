const backendHost = process.env.API_HOST || 'http://localhost:8080';

module.exports = {
  '/clinica': {
    target: backendHost,
    changeOrigin: true,
    secure: false
  }
};
