const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getUserConfig: dbGetUserConfig, updateUserConfig: dbUpdateUserConfig } = require('./database');

// Path to the config file
const CONFIG_FILE = path.join(__dirname, '../../data/user_configs.json');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory store for user configurations
const userConfigs = new Collection();

// Default configuration
const defaultConfig = {
    locale: null, // null means use Discord locale
    threadNaming: 'auto', // 'auto' means use locale date format
};

// Load existing configurations from file
try {
    if (fs.existsSync(CONFIG_FILE)) {
        const savedConfigs = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        for (const [userId, config] of Object.entries(savedConfigs)) {
            userConfigs.set(userId, config);
        }
        console.log('Loaded user configurations from file');
    }
} catch (error) {
    console.error('Error loading user configurations:', error);
}

// Debounce timer for saving
let saveTimeout = null;

// Helper function to save configurations to file
function saveConfigs() {
    // Clear any existing timeout
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    // Set a new timeout to save after 5 seconds of no changes
    saveTimeout = setTimeout(() => {
        try {
            const configsObject = {};
            for (const [userId, config] of userConfigs.entries()) {
                configsObject[userId] = config;
            }
            // Write to a temporary file first
            const tempFile = CONFIG_FILE + '.tmp';
            fs.writeFileSync(tempFile, JSON.stringify(configsObject, null, 2));
            // Rename the temporary file to the actual config file
            fs.renameSync(tempFile, CONFIG_FILE);
            console.log('Configurations saved successfully');
        } catch (error) {
            console.error('Error saving user configurations:', error);
        }
    }, 5000);
}

/**
 * Get user's configuration, creating default if none exists
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Object>} User's configuration
 */
async function getUserConfig(userId, guildId) {
    return await dbGetUserConfig(userId, guildId);
}

/**
 * Update user's configuration
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @param {Object} newConfig - New configuration options
 * @returns {Promise<void>}
 */
async function updateUserConfig(userId, guildId, newConfig) {
    await dbUpdateUserConfig(userId, guildId, newConfig);
}

/**
 * Get the effective locale for a user
 * @param {string} userId - Discord user ID
 * @param {string} guildId - Discord guild ID
 * @param {string} discordLocale - User's Discord locale
 * @returns {Promise<string>} Effective locale to use
 */
async function getEffectiveLocale(userId, guildId, discordLocale) {
    const config = await getUserConfig(userId, guildId);
    return config.locale || discordLocale;
}

module.exports = {
    getUserConfig,
    updateUserConfig,
    getEffectiveLocale,
    defaultConfig
}; 