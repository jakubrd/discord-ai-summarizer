# Discord AI Message Summarizer

A Discord bot that uses AI to summarize messages in a channel.

## Features

- `/summarize` slash command to initiate message summarization
- Button-based interface to select the number of messages to summarize
- AI-powered summaries using OpenRouter API
- Thread-based summary delivery to keep channels clean

## Prerequisites

- Node.js 22.13.1 or higher
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- OpenRouter API key (from [OpenRouter](https://openrouter.ai/))

## Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/discord-ai-summarizer.git
   cd discord-ai-summarizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   CLIENT_ID=your_discord_application_id_here
   ```

## Development

The project structure is organized as follows:
- `src/index.js` - Main bot file
- `src/commands/` - Slash command implementations
- `src/utils/` - Utility functions and API integrations

### Available Scripts

- Deploy slash commands (required after changes to commands):
  ```bash
  npm run deploy
  ```

- Start the bot in production mode:
  ```bash
  npm start
  ```

- Start the bot in development mode (with auto-reload):
  ```bash
  npm run dev
  ```

## Bot Setup

1. Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications)
2. Go to the "Bot" section and create a bot
3. Enable these Privileged Gateway Intents:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
   - PRESENCE INTENT
4. Copy the bot token to your `.env` file
5. Invite the bot to your server using the OAuth2 URL generator with these scopes:
   - `bot`
   - `applications.commands`
   
Required bot permissions:
- Read Messages/View Channels
- Send Messages
- Create Public Threads
- Send Messages in Threads
- Read Message History

## Usage

1. After inviting the bot, use the `/summarize` command in any channel
2. Select the number of messages to summarize using the buttons (10, 20, or 50)
3. Wait for the AI to generate a summary
4. The summary will be posted in a thread under the original command message

## Troubleshooting

If you encounter issues:
1. Make sure all required permissions are granted
2. Check that slash commands are registered (`npm run deploy`)
3. Verify the bot has access to the channel
4. Ensure all environment variables are set correctly

## Requirements

- Node.js 22.13.1 or higher
- Discord.js v14
- OpenRouter API key
- Discord Bot Token 