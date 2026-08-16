const express = require('express');
const bcrypt = require('bcryptjs');
const { createUser, getUserByUsername } = require('../services/registryService');
const TokenService = require('../services/tokenService');
const geoIpService = require('../services/geoIpService');
const { getClientIp, getFlowIps, getUserAgent } = require('../utils/ipUtil');
const { authRateLimiter } = require('../utils/rateLimiter');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

// Apply auth rate limiter to authentication endpoints
router.use('/register', authRateLimiter);
router.use('/login', authRateLimiter);

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await createUser(username, hashedPassword);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        // Extract IP, flow chain, and User Agent
        const ip = getClientIp(req);
        const flow_ips = getFlowIps(req);
        const userAgent = getUserAgent(req);

        // Lookup GeoIP location safely
        let location = null;
        try {
            location = await geoIpService.lookupIp(ip);
        } catch (e) {
            // Ignore error
        }

        const tokens = await TokenService.generateTokens(result.user, {
            userAgent,
            ip,
            flow_ips,
            location
        });

        res.json({ success: true, user: result.user, ...tokens });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Extract IP, flow chain, and User Agent
        const ip = getClientIp(req);
        const flow_ips = getFlowIps(req);
        const userAgent = getUserAgent(req);

        // Lookup GeoIP location safely
        let location = null;
        try {
            location = await geoIpService.lookupIp(ip);
        } catch (e) {
            // Ignore error
        }

        const userPayload = { id: user.id, username: user.username };
        const tokens = await TokenService.generateTokens(userPayload, {
            userAgent,
            ip,
            flow_ips,
            location
        });
        
        res.json({ success: true, user: userPayload, ...tokens });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/regenerate-accesstoken', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const ip = getClientIp(req);
        const flow_ips = getFlowIps(req);
        const userAgent = getUserAgent(req);

        let location = null;
        try {
            location = await geoIpService.lookupIp(ip);
        } catch (e) {
            // Ignore error
        }

        const tokens = await TokenService.regenerateAccessToken(refreshToken, {
            userAgent,
            ip,
            flow_ips,
            location
        });
        res.json({ success: true, accessToken: tokens.accessToken });
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

// Devices / Active Sessions Endpoints
router.get('/devices', authMiddleware, async (req, res) => {
    try {
        const rawDevices = await TokenService.getUserDevices(req.user.id);
        const devices = rawDevices.map((device) => ({
            id: device.id,
            user_agent: device.user_agent,
            ip: device.ip,
            flow_ips: device.flow_ips,
            location: device.location,
            created_at: device.created_at,
            last_used_at: device.last_used_at,
            is_current: device.id === req.sessionDbId || device.refresh_token_id === req.refreshTokenId
        }));

        res.json({ success: true, devices });
    } catch (err) {
        console.error('Fetch devices error:', err);
        res.status(500).json({ error: 'Failed to fetch active devices' });
    }
});

router.delete('/devices/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await TokenService.revokeDevice(req.user.id, parseInt(id));
        if (!deleted) {
            return res.status(404).json({ error: 'Device session not found or already revoked' });
        }
        res.json({ success: true, message: 'Device session revoked successfully' });
    } catch (err) {
        console.error('Revoke device error:', err);
        res.status(500).json({ error: 'Failed to revoke device session' });
    }
});

router.post('/devices/revoke-others', authMiddleware, async (req, res) => {
    try {
        const count = await TokenService.revokeOtherDevices(req.user.id, req.refreshTokenId);
        res.json({ success: true, count, message: 'All other device sessions revoked successfully' });
    } catch (err) {
        console.error('Revoke others error:', err);
        res.status(500).json({ error: 'Failed to revoke other device sessions' });
    }
});

router.post('/devices/revoke-all', authMiddleware, async (req, res) => {
    try {
        const count = await TokenService.revokeAllDevices(req.user.id);
        res.json({ success: true, count, message: 'All device sessions revoked' });
    } catch (err) {
        console.error('Revoke all error:', err);
        res.status(500).json({ error: 'Failed to revoke device sessions' });
    }
});

module.exports = router;
