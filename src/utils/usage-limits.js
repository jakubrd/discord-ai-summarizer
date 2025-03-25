const { 
    getUsageLimitSettings: dbGetUsageLimitSettings,
    setUsageLimit: dbSetUsageLimit,
    getUnlimitedRoles: dbGetUnlimitedRoles,
    addUnlimitedRole: dbAddUnlimitedRole,
    removeUnlimitedRole: dbRemoveUnlimitedRole,
    getUserUsageCount: dbGetUserUsageCount,
    incrementUsageCount: dbIncrementUsageCount,
    getGuildUsageTracking: dbGetGuildUsageTracking,
    cleanupOldUsageData: dbCleanupOldUsageData
} = require('./database');

// Check if user has unlimited usage based on roles
async function hasUnlimitedUsage(member) {
    const unlimitedRoles = await dbGetUnlimitedRoles(member.guild.id);
    return member.roles.cache.some(role => unlimitedRoles.includes(role.id));
}

// Check if user has reached their daily limit
async function hasReachedLimit(userId, guildId) {
    const today = new Date().toISOString().split('T')[0];
    const settings = await dbGetUsageLimitSettings(guildId);
    const usageCount = await dbGetUserUsageCount(userId, guildId, today);
    return usageCount >= settings.max_daily_uses;
}

// Increment user's usage count
async function incrementUsage(userId, guildId) {
    const today = new Date().toISOString().split('T')[0];
    await dbIncrementUsageCount(userId, guildId, today);
}

// Get user's remaining uses for the day
async function getRemainingUses(userId, guildId) {
    const today = new Date().toISOString().split('T')[0];
    const settings = await dbGetUsageLimitSettings(guildId);
    const usageCount = await dbGetUserUsageCount(userId, guildId, today);
    return Math.max(0, settings.max_daily_uses - usageCount);
}

// Add rate limiting for admin commands
const ADMIN_COMMAND_COOLDOWN = 5000; // 5 seconds
const adminCommandCooldowns = new Map();

function isAdminCommandOnCooldown(userId) {
    const lastUse = adminCommandCooldowns.get(userId) || 0;
    const now = Date.now();
    if (now - lastUse < ADMIN_COMMAND_COOLDOWN) {
        return true;
    }
    adminCommandCooldowns.set(userId, now);
    return false;
}

// Add audit logging
async function logAdminAction(guildId, userId, action, details) {
    try {
        await db.run(`
            INSERT INTO admin_audit_log (guild_id, user_id, action, details, timestamp)
            VALUES (?, ?, ?, ?, datetime('now'))
        `, [guildId, userId, action, JSON.stringify(details)]);
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}

// Update admin functions to include rate limiting and audit logging
async function setMaxDailyUses(guildId, maxUses, userId) {
    if (isAdminCommandOnCooldown(userId)) {
        throw new Error('Please wait before using another admin command');
    }
    
    try {
        await db.run(`
            INSERT OR REPLACE INTO usage_limits (guild_id, max_daily_uses)
            VALUES (?, ?)
        `, [guildId, maxUses]);
        
        await logAdminAction(guildId, userId, 'set_max_daily_uses', { maxUses });
        return true;
    } catch (error) {
        console.error('Error setting max daily uses:', error);
        throw error;
    }
}

async function addUnlimitedRole(guildId, roleId, userId) {
    if (isAdminCommandOnCooldown(userId)) {
        throw new Error('Please wait before using another admin command');
    }
    
    try {
        await db.run(`
            INSERT INTO unlimited_roles (guild_id, role_id)
            VALUES (?, ?)
        `, [guildId, roleId]);
        
        await logAdminAction(guildId, userId, 'add_unlimited_role', { roleId });
        return true;
    } catch (error) {
        console.error('Error adding unlimited role:', error);
        throw error;
    }
}

async function removeUnlimitedRole(guildId, roleId, userId) {
    if (isAdminCommandOnCooldown(userId)) {
        throw new Error('Please wait before using another admin command');
    }
    
    try {
        await db.run(`
            DELETE FROM unlimited_roles
            WHERE guild_id = ? AND role_id = ?
        `, [guildId, roleId]);
        
        await logAdminAction(guildId, userId, 'remove_unlimited_role', { roleId });
        return true;
    } catch (error) {
        console.error('Error removing unlimited role:', error);
        throw error;
    }
}

async function getSettings(guildId) {
    const settings = await dbGetUsageLimitSettings(guildId);
    const unlimitedRoles = await dbGetUnlimitedRoles(guildId);
    const today = new Date().toISOString().split('T')[0];
    const usageTracking = await dbGetGuildUsageTracking(guildId, today);

    return {
        maxDailyUses: settings.max_daily_uses,
        unlimitedRoles,
        usageTracking,
        lastReset: today
    };
}

// Clean up old usage data
async function cleanupOldUsageData() {
    await dbCleanupOldUsageData();
}

module.exports = {
    hasUnlimitedUsage,
    hasReachedLimit,
    incrementUsage,
    getRemainingUses,
    setMaxDailyUses,
    addUnlimitedRole,
    removeUnlimitedRole,
    getSettings,
    cleanupOldUsageData
}; 