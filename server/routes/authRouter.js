const express = require('express');
const bcrypt = require('bcryptjs');
const { createUser, getUserByUsername } = require('../services/registryService');
const TokenService = require('../services/tokenService');

const router = express.Router();

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

        const tokens = await TokenService.generateTokens(result.user);
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

        const userPayload = { id: user.id, username: user.username };
        const tokens = await TokenService.generateTokens(userPayload);
        
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

        const tokens = await TokenService.regenerateAccessToken(refreshToken);
        res.json({ success: true, accessToken: tokens.accessToken });
    } catch (err) {
        console.error('Refresh error:', err);
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

module.exports = router;
