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
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('summarize_')) {
                try {
                    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                    
                    const messageCount = parseInt(interaction.customId.split('_')[1]);
                    
                    // Debug logs
                    console.log('Interaction details:', {
                        guildId: interaction.guildId,
                        channelId: interaction.channelId,
                        userId: interaction.user.id,
                        botId: client.user.id,
                        guildsCount: client.guilds.cache.size
                    });

                    // Get the guild directly from the interaction
                    if (!interaction.guild) {
                        console.error('Guild not found in interaction');
                        await interaction.editReply({
                            content: 'Error: Cannot access the server. Please make sure the bot is properly invited with the correct permissions.',
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }

                    // Get the channel directly from the guild
                    const channel = interaction.guild.channels.cache.get(interaction.channelId);
                    if (!channel) {
                        console.error('Channel not found:', interaction.channelId);
                        await interaction.editReply({
                            content: 'Error: Cannot access the channel. Please make sure the bot has access to this channel.',
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }

                    // Debug log
                    console.log('Channel details:', {
                        name: channel.name,
                        type: channel.type,
                        permissions: channel.permissionsFor(client.user)?.toArray()
                    });

                    // Check if it's a text channel
                    if (![ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread].includes(channel.type)) {
                        await interaction.editReply({
                            content: 'Error: This command can only be used in a text channel or thread.',
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }

                    // Check required permissions
                    const requiredPermissions = [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.CreatePublicThreads,
                        PermissionsBitField.Flags.SendMessagesInThreads
                    ];

                    const botPermissions = channel.permissionsFor(client.user);
                    if (!botPermissions) {
                        console.error('Cannot get bot permissions for channel');
                        await interaction.editReply({
                            content: 'Error: Cannot verify bot permissions. Please check the bot\'s role and channel permissions.',
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }

                    const missingPermissions = requiredPermissions.filter(perm => !botPermissions.has(perm));
                    
                    if (missingPermissions.length > 0) {
                        const missingPermsString = missingPermissions
                            .map(perm => perm.toString().replace(/BigInt\((\d+)\)/, '$1'))
                            .join(', ');
                            
                        console.error('Missing permissions:', missingPermsString);
                        await interaction.editReply({
                            content: `Error: Bot is missing the following permissions: ${missingPermsString}`,
                            flags: [MessageFlags.Ephemeral]
                        });
                        return;
                    }

                    try {
                        // Fetch messages from the channel
                        const messages = await channel.messages.fetch({ 
                            limit: messageCount 
                        });

                        if (!messages || messages.size === 0) {
                            await interaction.editReply({
                                content: 'No messages found to summarize.',
                                flags: [MessageFlags.Ephemeral]
                            });
                            return;
                        }

                        // Generate summary
                        const summary = await generateSummary(Array.from(messages.values()).reverse());

                        // Create a new message and thread
                        const summaryMsg = await channel.send({
                            content: `Summarizing last ${messageCount} messages...`
                        });

                        const thread = await summaryMsg.startThread({
                            name: `Summary of last ${messageCount} messages`,
                            autoArchiveDuration: 1440 // 24 hours
                        });

                        await thread.send(`Hey ${interaction.user}, here's your summary of the last ${messageCount} messages:\n\n${summary}`);
                        
                        // Edit the original reply
                        await interaction.editReply({ 
                            content: 'Summary generated! Check the thread below.',
                            flags: [MessageFlags.Ephemeral]
                        });

                    } catch (error) {
                        console.error('Error fetching messages or generating summary:', error);
                        await interaction.editReply({ 
                            content: 'There was an error accessing the messages or generating the summary. Please ensure the bot has proper permissions.',
                            flags: [MessageFlags.Ephemeral]
                        });
                    }

                } catch (error) {
                    console.error('Error handling button interaction:', error);
                    if (interaction.deferred) {
                        await interaction.editReply({ 
                            content: 'There was an error processing your request. Please try again later.',
                            flags: [MessageFlags.Ephemeral]
                        });
                    } else {
                        await interaction.reply({ 
                            content: 'There was an error processing your request. Please try again later.',
                            flags: [MessageFlags.Ephemeral]
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN); 