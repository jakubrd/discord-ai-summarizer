require('dotenv').config();
const { Client, GatewayIntentBits, Collection, MessageFlags, PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { generateSummary } = require('./utils/openrouter');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Create a collection for commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Bot is ready!');
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Bot is in ${client.guilds.cache.size} servers`);
});

// Handle interactions
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        content: 'There was an error executing this command!',
                        flags: [MessageFlags.Ephemeral]
                    });
                } else {
                    await interaction.reply({ 
                        content: 'There was an error executing this command!',
                        flags: [MessageFlags.Ephemeral]
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN); 