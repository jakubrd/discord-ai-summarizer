const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { 
    setMaxDailyUses, 
    addUnlimitedRole, 
    removeUnlimitedRole, 
    getSettings,
    hasUnlimitedUsage
} = require('../utils/usage-limits');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin commands for managing the AI Summarizer')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setlimit')
                .setDescription('Set the maximum number of daily uses per user')
                .addIntegerOption(option =>
                    option
                        .setName('limit')
                        .setDescription('The new daily usage limit')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addrole')
                .setDescription('Add a role that has unlimited usage')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removerole')
                .setDescription('Remove a role from unlimited usage')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Show current usage limit settings')
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'setlimit': {
                    const limit = interaction.options.getInteger('limit');
                    await setMaxDailyUses(interaction.guildId, limit);
                    await interaction.editReply(`Daily usage limit set to ${limit} uses per user.`);
                    break;
                }

                case 'addrole': {
                    const role = interaction.options.getRole('role');
                    await addUnlimitedRole(interaction.guildId, role.id);
                    await interaction.editReply(`Added ${role.name} to unlimited usage roles.`);
                    break;
                }

                case 'removerole': {
                    const role = interaction.options.getRole('role');
                    await removeUnlimitedRole(interaction.guildId, role.id);
                    await interaction.editReply(`Removed ${role.name} from unlimited usage roles.`);
                    break;
                }

                case 'show': {
                    const settings = await getSettings(interaction.guildId);
                    const unlimitedRoles = settings.unlimitedRoles.map(roleId => {
                        const role = interaction.guild.roles.cache.get(roleId);
                        return role ? role.name : 'Unknown Role';
                    });

                    let message = `**Current Usage Limit Settings**\n`;
                    message += `Daily Limit: ${settings.maxDailyUses} uses per user\n`;
                    message += `Unlimited Roles: ${unlimitedRoles.length > 0 ? unlimitedRoles.join(', ') : 'None'}\n`;
                    message += `Last Reset: ${settings.lastReset}\n\n`;
                    message += `**Current Usage**\n`;

                    const usageTracking = settings.usageTracking;
                    if (usageTracking && usageTracking.length > 0) {
                        for (const row of usageTracking) {
                            try {
                                const user = await interaction.client.users.fetch(row.user_id);
                                message += `${user.tag}: ${row.usage_count}/${settings.maxDailyUses} uses\n`;
                            } catch (error) {
                                // If user can't be fetched, just show their ID
                                message += `User ${row.user_id}: ${row.usage_count}/${settings.maxDailyUses} uses\n`;
                            }
                        }
                    } else {
                        message += 'No usage recorded today.';
                    }

                    await interaction.editReply(message);
                    break;
                }
            }
        } catch (error) {
            console.error('Error in admin command:', error);
            await interaction.editReply({
                content: '❌ An error occurred while executing this command.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};