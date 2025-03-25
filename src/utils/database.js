const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const DB_FILE = path.join(dataDir, 'bot.db');

// Create database connection
const db = new sqlite3.Database(DB_FILE);

// Initialize database tables
db.serialize(() => {
    // User configurations table
    db.run(`CREATE TABLE IF NOT EXISTS user_configs (
        user_id TEXT,
        guild_id TEXT,
        locale TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id)
    )`);

    // Usage limits table
    db.run(`CREATE TABLE IF NOT EXISTS usage_limits (
        guild_id TEXT PRIMARY KEY,
        max_daily_uses INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Unlimited roles table
    db.run(`CREATE TABLE IF NOT EXISTS unlimited_roles (
        guild_id TEXT,
        role_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (guild_id, role_id)
    )`);

    // Usage tracking table
    db.run(`CREATE TABLE IF NOT EXISTS usage_tracking (
        user_id TEXT,
        guild_id TEXT,
        usage_date DATE,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, guild_id, usage_date)
    )`);

    // Create indexes for better performance
    db.run('CREATE INDEX IF NOT EXISTS idx_user_configs_user_id ON user_configs(user_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_user_configs_guild_id ON user_configs(guild_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_guild ON usage_tracking(user_id, guild_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(usage_date)');
});

// Helper function to get user config
function getUserConfig(userId, guildId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT locale FROM user_configs WHERE user_id = ? AND guild_id = ?',
            [userId, guildId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || { locale: null });
            }
        );
    });
}

// Update user configuration
async function updateUserConfig(userId, guildId, config) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO user_configs (user_id, guild_id, locale, updated_at) 
             VALUES (?, ?, ?, datetime('now'))
             ON CONFLICT(user_id, guild_id) 
             DO UPDATE SET locale = ?, updated_at = datetime('now')`,
            [userId, guildId, config.locale, config.locale],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

// Helper function to get usage limit settings
function getUsageLimitSettings(guildId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT max_daily_uses FROM usage_limits WHERE guild_id = ?',
            [guildId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || { max_daily_uses: 10 });
            }
        );
    });
}

// Helper function to set usage limit
function setUsageLimit(guildId, limit) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO usage_limits (guild_id, max_daily_uses, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(guild_id) 
             DO UPDATE SET max_daily_uses = ?, updated_at = CURRENT_TIMESTAMP`,
            [guildId, limit, limit],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// Helper function to get unlimited roles
function getUnlimitedRoles(guildId) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT role_id FROM unlimited_roles WHERE guild_id = ?',
            [guildId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.role_id));
            }
        );
    });
}

// Helper function to add unlimited role
function addUnlimitedRole(guildId, roleId) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT OR IGNORE INTO unlimited_roles (guild_id, role_id) VALUES (?, ?)',
            [guildId, roleId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// Helper function to remove unlimited role
function removeUnlimitedRole(guildId, roleId) {
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM unlimited_roles WHERE guild_id = ? AND role_id = ?',
            [guildId, roleId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// Helper function to get user's usage count
function getUserUsageCount(userId, guildId, date) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT usage_count FROM usage_tracking WHERE user_id = ? AND guild_id = ? AND usage_date = ?',
            [userId, guildId, date],
            (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.usage_count : 0);
            }
        );
    });
}

// Helper function to increment usage count
function incrementUsageCount(userId, guildId, date) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO usage_tracking (user_id, guild_id, usage_date, usage_count, updated_at)
             VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, guild_id, usage_date) 
             DO UPDATE SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP`,
            [userId, guildId, date],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// Helper function to get all usage tracking for a guild
function getGuildUsageTracking(guildId, date) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT user_id, usage_count 
             FROM usage_tracking 
             WHERE guild_id = ? AND usage_date = ?`,
            [guildId, date],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

// Clean up old usage tracking data (older than 30 days)
function cleanupOldUsageData() {
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM usage_tracking WHERE usage_date < date("now", "-30 days")',
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

module.exports = {
    getUserConfig,
    updateUserConfig,
    getUsageLimitSettings,
    setUsageLimit,
    getUnlimitedRoles,
    addUnlimitedRole,
    removeUnlimitedRole,
    getUserUsageCount,
    incrementUsageCount,
    getGuildUsageTracking,
    cleanupOldUsageData
}; 