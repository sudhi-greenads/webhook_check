const TokenService = require('../services/tokenService');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const result = await TokenService.verifyToken(token, 'access');
        if (result.success) {
            req.user = result.user;
            next();
        } else {
            res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
    } catch (err) {
        if (err.message.includes('expired')) {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Unauthorized', message: err.message });
    }
}

module.exports = authMiddleware;
