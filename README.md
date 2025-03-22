# Discord AI Message Summarizer

A Discord bot that uses AI to summarize messages in a channel.

## Features

- `/summarize` slash command to initiate message summarization
- Button-based interface to select the number of messages to summarize
- AI-powered summaries using OpenRouter API
- Thread-based summary delivery to keep channels clean

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
4. Start the bot:
   ```bash
   node src/index.js
   ```

## Development

The project structure is organized as follows:
- `src/index.js` - Main bot file
- `src/commands/` - Slash command implementations
- `src/utils/` - Utility functions and API integrations

## Usage

1. Invite the bot to your server with the necessary permissions
2. Use the `/summarize` command in any channel
3. Select the number of messages to summarize using the buttons
4. Wait for the AI to generate a summary
5. The summary will be posted in a thread under the original command message

## Requirements

- Node.js 16.9.0 or higher
- Discord.js v14
- OpenRouter API key
- Discord Bot Token 