/**
 * Utility functions for extracting client IP, flow proxy chain, and user agent.
 */

function cleanIp(ip) {
  if (!ip || typeof ip !== 'string') return '';
  let cleaned = ip.trim();
  if (cleaned.startsWith('::ffff:')) {
    cleaned = cleaned.substring(7);
  }
  return cleaned;
}

function getClientIp(req) {
  if (!req || !req.headers) return '';

  // 1. Cloudflare header
  if (req.headers['cf-connecting-ip']) {
    return cleanIp(req.headers['cf-connecting-ip']);
  }

  // 2. Standard X-Forwarded-For header (client IP is the first entry)
  if (req.headers['x-forwarded-for']) {
    const xff = req.headers['x-forwarded-for'];
    const firstIp = typeof xff === 'string' ? xff.split(',')[0] : Array.isArray(xff) ? xff[0] : '';
    if (firstIp) return cleanIp(firstIp);
  }

  // 3. True-Client-IP / X-Real-IP headers
  if (req.headers['true-client-ip']) {
    return cleanIp(req.headers['true-client-ip']);
  }
  if (req.headers['x-real-ip']) {
    return cleanIp(req.headers['x-real-ip']);
  }

  // 4. Express / Node request IP
  if (req.ip) {
    return cleanIp(req.ip);
  }
  if (req.socket && req.socket.remoteAddress) {
    return cleanIp(req.socket.remoteAddress);
  }
  if (req.connection && req.connection.remoteAddress) {
    return cleanIp(req.connection.remoteAddress);
  }

  return '';
}

function getFlowIps(req) {
  if (!req || !req.headers) return '';

  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    return typeof xff === 'string' ? xff.trim() : Array.isArray(xff) ? xff.join(', ') : '';
  }

  const clientIp = getClientIp(req);
  return clientIp || '';
}

function getUserAgent(req) {
  if (!req || !req.headers) return 'Unknown';
  return req.headers['user-agent'] || 'Unknown';
}

module.exports = {
  cleanIp,
  getClientIp,
  getFlowIps,
  getUserAgent
};
