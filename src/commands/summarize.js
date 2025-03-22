const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summarize')
        .setDescription('Summarize recent messages in this channel')
        .setDefaultMemberPermissions(null)
        .setDMPermission(false),

    async execute(interaction) {
        // Create buttons for message count selection
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('summarize_10')
                    .setLabel('Last 10')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('summarize_20')
                    .setLabel('Last 20')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('summarize_50')
                    .setLabel('Last 50')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({
            content: 'How many messages would you like to summarize?',
            components: [row],
            flags: [MessageFlags.Ephemeral]
        });
    }
}; 