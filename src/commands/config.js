const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserConfig, updateUserConfig } = require('../utils/config');
const { getLocaleString } = require('../utils/locales');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure your preferences for the AI Summarizer')
        .setDescriptionLocalizations({
            pl: 'Skonfiguruj swoje preferencje dla AI Summarizer'
        })
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show your current configuration')
                .setDescriptionLocalizations({
                    pl: 'Pokaż aktualną konfigurację'
                })
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('language')
                .setDescription('Set your preferred language')
                .setDescriptionLocalizations({
                    pl: 'Ustaw preferowany język'
                })
                .addStringOption(option =>
                    option
                        .setName('locale')
                        .setDescription('Choose your preferred language')
                        .setDescriptionLocalizations({
                            pl: 'Wybierz preferowany język'
                        })
                        .setRequired(true)
                        .addChoices(
                            { name: 'English', value: 'en' },
                            { name: 'Polski', value: 'pl' },
                            { name: 'Auto (Use Discord setting)', value: 'auto' }
                        )
                )
        ),

    async execute(interaction) {
        console.log('Config command started');
        
        try {
            // Defer the reply immediately to prevent timeout
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            console.log('Reply deferred');
            
            const userId = interaction.user.id;
            const discordLocale = interaction.locale;
            const subcommand = interaction.options.getSubcommand();
            console.log(`Processing ${subcommand} for user ${userId} with locale ${discordLocale}`);

            if (subcommand === 'show') {
                const config = getUserConfig(userId);
                const locale = config.locale || 'auto';
                const message = getLocaleString(discordLocale, 'configCurrent').replace('{language}', 
                    locale === 'auto' ? 'Auto (Discord)' : locale.toUpperCase()
                );
                
                console.log('Sending show config response:', message);
                await interaction.editReply({
                    content: message,
                    flags: [MessageFlags.Ephemeral]
                });
                console.log('Show config response sent');
            }
            else if (subcommand === 'language') {
                const newLocale = interaction.options.getString('locale');
                console.log(`Updating locale to: ${newLocale}`);
                
                const config = updateUserConfig(userId, {
                    locale: newLocale === 'auto' ? null : newLocale
                });
                console.log('Config updated:', config);

                const message = getLocaleString(discordLocale, 'configUpdated').replace('{language}', 
                    newLocale === 'auto' ? 'Auto (Discord)' : newLocale.toUpperCase()
                );
                
                console.log('Sending language update response:', message);
                await interaction.editReply({
                    content: message,
                    flags: [MessageFlags.Ephemeral]
                });
                console.log('Language update response sent');
            }
        } catch (error) {
            console.error('Error in config command:', error);
            try {
                await interaction.editReply({
                    content: getLocaleString(interaction.locale, 'errorConfig'),
                    flags: [MessageFlags.Ephemeral]
                });
                console.log('Error response sent');
            } catch (followUpError) {
                console.error('Error sending error response:', followUpError);
                // If editReply fails, try to follow up
                try {
                    await interaction.followUp({
                        content: getLocaleString(interaction.locale, 'errorConfig'),
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch (finalError) {
                    console.error('All response attempts failed:', finalError);
                }
            }
        }
        console.log('Config command completed');
    }
}; 