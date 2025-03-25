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

// Admin functions
async function setMaxDailyUses(guildId, limit) {
    await dbSetUsageLimit(guildId, limit);
}

async function addUnlimitedRole(guildId, roleId) {
    await dbAddUnlimitedRole(guildId, roleId);
}

async function removeUnlimitedRole(guildId, roleId) {
    await dbRemoveUnlimitedRole(guildId, roleId);
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