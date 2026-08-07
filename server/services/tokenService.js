const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const db = require('../db');
const { logger } = require('../logger');

class TokenService {
    constructor() {
        this.JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback-secret-key-123';
        this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key-456';
        this.db = db;
        this.logger = logger;
    }

    generateRefreshTokenId() {
        return `rtk-${randomUUID()}`;
    }

    generateAccessTokenId() {
        return `atk-${randomUUID()}`;
    }

    generateRefreshToken(user, refreshTokenId) {
        const token = jwt.sign({ user, id: refreshTokenId }, this.JWT_SECRET, { expiresIn: '7d' });
        return token;
    }

    generateAccessToken(user, refreshTokenId, accessTokenId) {
        const token = jwt.sign({ user, id: accessTokenId, refreshTokenId }, this.JWT_SECRET, { expiresIn: '15m' });
        return token;
    }

    async generateTokens(user) {
        const refreshTokenId = this.generateRefreshTokenId();
        const accessTokenId = this.generateAccessTokenId();

        const refreshToken = this.generateRefreshToken(user, refreshTokenId);
        const accessToken = this.generateAccessToken(user, refreshTokenId, accessTokenId);

        // Store token relationship in DB
        await this.db.query(
            'INSERT INTO user_tokens (user_id, refresh_token_id, access_token_id) VALUES ($1, $2, $3)',
            [user.id, refreshTokenId, accessTokenId]
        );

        return { refreshToken, accessToken };
    }

    async regenerateAccessToken(refreshToken) {
        // 1. Verify the refresh token
        const result = await this.verifyToken(refreshToken, 'refresh');
        if (!result.success) {
            throw new Error(result.message);
        }

        const user = result.user;
        const decoded = jwt.decode(refreshToken);
        const refreshTokenId = decoded.id;

        // 2. Generate new access token
        const newAccessTokenId = this.generateAccessTokenId();
        const newAccessToken = this.generateAccessToken(user, refreshTokenId, newAccessTokenId);

        // 3. Update DB
        await this.db.query(
            'UPDATE user_tokens SET access_token_id = $1 WHERE refresh_token_id = $2',
            [newAccessTokenId, refreshTokenId]
        );

        return { accessToken: newAccessToken };
    }

    async verifyToken(token, tokenType = "access") {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET);
            const user = decoded.user;
            
            // Check DB for token existence
            let dbUserToken;
            if (tokenType === "refresh") {
                const res = await this.db.query('SELECT * FROM user_tokens WHERE refresh_token_id = $1', [decoded.id]);
                dbUserToken = res.rows[0];
            } else if (tokenType === "access") {
                const res = await this.db.query('SELECT * FROM user_tokens WHERE access_token_id = $1', [decoded.id]);
                dbUserToken = res.rows[0];
            }

            if (!dbUserToken) {
                this.logger.error("db not have token");
                throw new Error("Invalid or expired token");
            }
            this.logger.info("db tokens found");

            if (tokenType === "refresh") {
                const refreshTokenId = decoded.id;
                if (dbUserToken.refresh_token_id !== refreshTokenId) {
                    throw new Error("Invalid or expired refresh token");
                }
            } else if (tokenType === "access") {
                const refreshTokenId = decoded.refreshTokenId;
                const accessTokenId = decoded.id;
                if (dbUserToken.refresh_token_id !== refreshTokenId || dbUserToken.access_token_id !== accessTokenId) {
                    throw new Error("Invalid or expired access token");
                }
            } else {
                this.logger.error(`Token type ${tokenType} not supported`);
                throw new Error(`Token type ${tokenType} not supported`);
            }

            return { success: true, message: `${tokenType} token is valid`, user };
        } catch (err) {
            this.logger.error("Error occurred while verifying token:", err.message);
            throw new Error(err.message || "Invalid or expired token");
        }
    }
}

module.exports = new TokenService();
