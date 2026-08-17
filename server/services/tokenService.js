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

    async generateTokens(user, { userAgent = null, ip = null, flow_ips = null, location = null } = {}) {
        const refreshTokenId = this.generateRefreshTokenId();
        const accessTokenId = this.generateAccessTokenId();

        const refreshToken = this.generateRefreshToken(user, refreshTokenId);
        const accessToken = this.generateAccessToken(user, refreshTokenId, accessTokenId);

        // Store token relationship & session metadata in DB
        await this.db.query(
            `INSERT INTO user_tokens (user_id, refresh_token_id, access_token_id, user_agent, ip, flow_ips, location, last_used_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [
                user.id,
                refreshTokenId,
                accessTokenId,
                userAgent || null,
                ip || null,
                flow_ips || null,
                location ? JSON.stringify(location) : null
            ]
        );

        return { refreshToken, accessToken };
    }

    async regenerateAccessToken(refreshToken, { userAgent = null, ip = null, flow_ips = null, location = null } = {}) {
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
            `UPDATE user_tokens 
             SET access_token_id = $1, 
                 last_used_at = CURRENT_TIMESTAMP,
                 user_agent = COALESCE($3, user_agent),
                 ip = COALESCE($4, ip),
                 flow_ips = COALESCE($5, flow_ips),
                 location = COALESCE($6, location)
             WHERE refresh_token_id = $2`,
            [
                newAccessTokenId, 
                refreshTokenId,
                userAgent || null,
                ip || null,
                flow_ips || null,
                location ? JSON.stringify(location) : null
            ]
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

            return { 
                success: true, 
                message: `${tokenType} token is valid`, 
                user,
                tokenId: decoded.id,
                refreshTokenId: decoded.refreshTokenId || decoded.id,
                sessionDbId: dbUserToken.id
            };
        } catch (err) {
            this.logger.error("Error occurred while verifying token:", err.message);
            throw new Error(err.message || "Invalid or expired token");
        }
    }

    // Devices & Active Sessions Management
    async getUserDevices(userId, page = 1, limit = 50, search = '') {
        const offset = (page - 1) * limit;
        let sql = `
            SELECT id, refresh_token_id, access_token_id, user_agent, ip, flow_ips, location, created_at, last_used_at,
                   COUNT(*) OVER() AS total_count 
            FROM user_tokens 
            WHERE user_id = $1
        `;
        const params = [userId];
        let paramIdx = 2;

        if (search && search.trim()) {
            sql += ` AND (user_agent ILIKE $${paramIdx} OR ip ILIKE $${paramIdx} OR flow_ips ILIKE $${paramIdx} OR location::text ILIKE $${paramIdx})`;
            params.push(`%${search.trim()}%`);
            paramIdx++;
        }

        sql += `
            ORDER BY last_used_at DESC, created_at DESC
            LIMIT $${paramIdx++} OFFSET $${paramIdx++}
        `;
        params.push(limit, offset);

        const res = await this.db.query(sql, params);
        const total = res.rows.length > 0 ? parseInt(res.rows[0].total_count) : 0;
        const data = res.rows.map(row => {
            const { total_count, ...device } = row;
            return device;
        });

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async revokeDevice(userId, tokenId) {
        const res = await this.db.query(
            'DELETE FROM user_tokens WHERE id = $1 AND user_id = $2 RETURNING id',
            [tokenId, userId]
        );
        return res.rows.length > 0;
    }

    async revokeOtherDevices(userId, currentRefreshTokenId) {
        const res = await this.db.query(
            'DELETE FROM user_tokens WHERE user_id = $1 AND refresh_token_id != $2 RETURNING id',
            [userId, currentRefreshTokenId]
        );
        return res.rows.length;
    }

    async revokeAllDevices(userId) {
        const res = await this.db.query(
            'DELETE FROM user_tokens WHERE user_id = $1 RETURNING id',
            [userId]
        );
        return res.rows.length;
    }
}

module.exports = new TokenService();
