const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, Collection } = require('discord.js');
const { generateSummary } = require('../utils/openrouter');
const { getLocaleString } = require('../utils/locales');
const { getEffectiveLocale } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summarize')
        .setDescription('Summarize recent messages in this channel')
        .setDescriptionLocalizations({
            pl: 'Podsumuj ostatnie wiadomości w tym kanale'
        })
        .setDefaultMemberPermissions(null)
        .setDMPermission(false),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const discordLocale = interaction.locale;
            const effectiveLocale = getEffectiveLocale(userId, discordLocale);

            // Create buttons for specific message counts
            const messageCountRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('summarize_10')
                        .setLabel(getLocaleString(effectiveLocale, 'last10'))
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('summarize_30')
                        .setLabel(getLocaleString(effectiveLocale, 'last30'))
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('summarize_50')
                        .setLabel(getLocaleString(effectiveLocale, 'last50'))
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('summarize_100')
                        .setLabel(getLocaleString(effectiveLocale, 'last100'))
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('summarize_200')
                        .setLabel(getLocaleString(effectiveLocale, 'last200'))
                        .setStyle(ButtonStyle.Primary)
                );

            // Create buttons for time-based options
            const timeBasedRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('summarize_today')
                        .setLabel(getLocaleString(effectiveLocale, 'today'))
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('summarize_yesterday')
                        .setLabel(getLocaleString(effectiveLocale, 'yesterday'))
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('summarize_3days')
                        .setLabel(getLocaleString(effectiveLocale, 'last3Days'))
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('summarize_week')
                        .setLabel(getLocaleString(effectiveLocale, 'lastWeek'))
                        .setStyle(ButtonStyle.Success)
                );

            // Send the initial message with both button rows
            const response = await interaction.reply({
                content: getLocaleString(effectiveLocale, 'chooseMessages'),
                components: [messageCountRow, timeBasedRow],
                flags: [MessageFlags.Ephemeral],
                withResponse: true
            });

            // Create a filter to only accept interactions from the same user
            const filter = i => i.user.id === interaction.user.id;

            try {
                // Wait for a button interaction
                const confirmation = await response.resource.message.awaitMessageComponent({ filter, time: 60000 });

                // Update the original message to show processing
                await interaction.editReply({
                    content: getLocaleString(effectiveLocale, 'generatingSummary'),
                    components: []
                });

                // Get the channel and guild from the original interaction
                const channel = await interaction.channel.fetch();
                const guild = await interaction.guild.fetch();

                // Debug logging
                console.log('Fetched IDs:', { 
                    guildId: guild.id, 
                    channelId: channel.id 
                });

                // Determine the message fetch criteria based on button clicked
                let messages;
                const now = new Date();
                const customId = confirmation.customId;

                if (customId.startsWith('summarize_')) {
                    const option = customId.split('_')[1];
                    
                    switch (option) {
                        case 'today': {
                            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            messages = await fetchMessagesSince(channel, startOfDay);
                            break;
                        }
                        case 'yesterday': {
                            const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                            const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            messages = await fetchMessagesBetween(channel, startOfYesterday, endOfYesterday);
                            break;
                        }
                        case '3days': {
                            const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
                            messages = await fetchMessagesSince(channel, threeDaysAgo);
                            break;
                        }
                        case 'week': {
                            const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                            messages = await fetchMessagesSince(channel, weekAgo);
                            break;
                        }
                        default: {
                            // For numeric options (10, 30, 50, 100, 200)
                            const messageCount = parseInt(option);
                            messages = await fetchMessagesSince(channel, now);
                            break;
                        }
                    }
                }

                if (!messages || messages.size === 0) {
                    await interaction.editReply({
                        content: getLocaleString(effectiveLocale, 'noMessages'),
                        components: []
                    });
                    return;
                }

                const messageArray = Array.from(messages.values()).reverse();

                // Generate the summary with guild and channel IDs and effective locale
                let summaryChunks = await generateSummary(messageArray, guild.id, channel.id, effectiveLocale);

                // Create a thread for the summary using effective locale
                const thread = await channel.threads.create({
                    name: `Summary ${new Date().toLocaleDateString(effectiveLocale)}`,
                    autoArchiveDuration: 1440,
                    reason: 'Summary thread created'
                });

                // Send the first chunk in the thread
                await thread.send(summaryChunks[0]);

                // Send any additional chunks as replies in the thread
                for (let i = 1; i < summaryChunks.length; i++) {
                    await thread.send(summaryChunks[i]);
                }

                // Update the original message to indicate the summary is in the thread
                await interaction.editReply({
                    content: getLocaleString(effectiveLocale, 'summaryCreated', thread),
                    components: []
                });

            } catch (error) {
                console.error('Error in button interaction:', error);
                await interaction.editReply({
                    content: getLocaleString(effectiveLocale, 'errorGenerating'),
                    components: []
                });
            }
        } catch (error) {
            console.error('Error in summarize command:', error);
            await interaction.reply({
                content: getLocaleString(effectiveLocale, 'errorButtons'),
                ephemeral: true
            });
        }
    }
};

// Helper function to fetch messages with filtering
async function fetchFilteredMessages(channel, options = {}) {
    const messages = await channel.messages.fetch(options);
    return messages.filter(msg => !msg.author.bot || msg.author.id !== channel.client.user.id);
}

async function fetchMessagesSince(channel, date) {
    let messages = new Collection();
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) {
            options.before = lastId;
        }

        const batch = await fetchFilteredMessages(channel, options);
        if (batch.size === 0) break;

        // Check if we've gone past our target date
        const oldestInBatch = batch.last();
        if (oldestInBatch && oldestInBatch.createdTimestamp < date.getTime()) {
            // Filter messages newer than our target date
            const relevantMessages = batch.filter(msg => msg.createdTimestamp >= date.getTime());
            messages = messages.concat(relevantMessages);
            break;
        }

        messages = messages.concat(batch);
        lastId = batch.last()?.id;
        if (!lastId) break;
    }

    return messages;
}

async function fetchMessagesBetween(channel, startDate, endDate) {
    let messages = new Collection();
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) {
            options.before = lastId;
        }

        const batch = await fetchFilteredMessages(channel, options);
        if (batch.size === 0) break;

        // Check if we've gone past our start date
        const oldestInBatch = batch.last();
        if (oldestInBatch && oldestInBatch.createdTimestamp < startDate.getTime()) {
            // Filter messages between our target dates
            const relevantMessages = batch.filter(msg => 
                msg.createdTimestamp >= startDate.getTime() && 
                msg.createdTimestamp <= endDate.getTime()
            );
            messages = messages.concat(relevantMessages);
            break;
        }

        // Filter messages older than end date
        const relevantMessages = batch.filter(msg => msg.createdTimestamp <= endDate.getTime());
        messages = messages.concat(relevantMessages);

        lastId = batch.last()?.id;
        if (!lastId) break;
    }

    return messages;
} 