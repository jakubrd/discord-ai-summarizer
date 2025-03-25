# Discord AI Message Summarizer

A Discord bot that uses AI to summarize messages in a channel, with support for multiple languages, user preferences, and usage limits.

## Features

- `/summarize` slash command to initiate message summarization
- Button-based interface with multiple options:
  - Message count options: Last 10, 30, 50, 100, or 200 messages
  - Time-based options: Today, Yesterday, Last 3 Days, Last Week
- AI-powered summaries using OpenRouter API:
  - Currently using DeepSeek-R1 model (configurable)
  - Support for all OpenRouter models ([full list](https://openrouter.ai/models))
  - High-quality, structured summaries
  - Multi-language support
  - No user or role mentions in summaries
- Thread-based summary delivery to keep channels clean
- Multi-language support:
  - English and Polish interfaces
  - Language-specific AI summaries
  - Configurable per user
- User preferences system:
  - `/config language` to set preferred language
  - `/config show` to view current settings
  - Automatic fallback to Discord's language settings
- Usage limits system:
  - Default limit of 10 uses per day per user
  - `/admin` commands for server administrators:
    - Set daily usage limits
    - Add/remove roles with unlimited usage
    - View current usage statistics
  - Per-server settings
  - Automatic daily reset

## Prerequisites

- Node.js 22.13.1 or higher (if running without Docker)
- Docker and Docker Compose (if running with Docker)
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- OpenRouter API key (from [OpenRouter](https://openrouter.ai/))
  - Currently using DeepSeek-R1 model (can be changed to any OpenRouter model)
- SQLite3 (included with Node.js or Docker)

## Setup

### Option 1: Running with Docker (Recommended)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/discord-ai-summarizer.git
   cd discord-ai-summarizer
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   CLIENT_ID=your_discord_application_id_here
   ```

3. Build and start the bot:
   ```bash
   # Start in production mode
   docker-compose up -d

   # Or start in development mode (with hot reload)
   NODE_ENV=development docker-compose up -d
   ```

4. Deploy slash commands:
   ```bash
   docker-compose exec discord-ai-summarizer npm run deploy
   ```

5. View logs:
   ```bash
   docker-compose logs -f
   ```

### Option 2: Running without Docker

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
  - `summarize.js` - Message summarization command
  - `config.js` - User preferences command
  - `admin.js` - Server administration commands
- `src/utils/` - Utility functions and API integrations
  - `openrouter.js` - OpenRouter API integration with DeepSeek-R1
  - `config.js` - User configuration management
  - `locales.js` - Localization strings
  - `database.js` - SQLite database management
  - `usage-limits.js` - Usage tracking and limits
- `data/` - Persistent data storage
  - `bot.db` - SQLite database for all bot data

### Docker Development

The project includes Docker support for both development and production environments:

- **Development Mode**:
  - Hot reload enabled with `nodemon`
  - Source code mounted for live updates
  - Detailed logging
  - Data persistence in `./data` directory

- **Production Mode**:
  - Optimized for performance
  - Automatic restart on crashes
  - Log rotation
  - Persistent data storage

- **Data Persistence**:
  - SQLite database stored in `./data`
  - Environment variables loaded from `.env`
  - Source code changes reflected immediately in dev mode

- **Logging**:
  - JSON file driver for structured logs
  - Log rotation (max 3 files, 10MB each)
  - View logs with `docker-compose logs -f`

### Available Docker Commands

```bash
# Start the bot
docker-compose up -d

# Stop the bot
docker-compose down

# View logs
docker-compose logs -f

# Deploy slash commands
docker-compose exec discord-ai-summarizer npm run deploy

# Access container shell
docker-compose exec discord-ai-summarizer sh
```

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
- Manage Messages (for ephemeral responses)

## Usage

### Message Summarization
1. Use the `/summarize` command in any channel
2. Choose from two types of summarization:
   - Number of messages (10, 30, 50, 100, 200)
   - Time period (Today, Yesterday, Last 3 Days, Last Week)
3. Wait for the AI to generate a summary (using DeepSeek-R1 model)
4. The summary will be posted in a new thread

### Configuration
1. Use `/config language` to set your preferred language:
   - English
   - Polski (Polish)
   - Auto (Use Discord setting)
2. Use `/config show` to view your current settings
3. Settings are saved per user and persist across bot restarts

### Administration
1. Use `/admin setlimit <number>` to set daily usage limit
2. Use `/admin addrole @role` to give a role unlimited usage
3. Use `/admin removerole @role` to remove unlimited usage from a role
4. Use `/admin show` to view current usage statistics
5. Only server administrators can use these commands

## Localization Support

The bot supports multiple languages:
- Interface elements (buttons, messages)
- AI-generated summaries (using DeepSeek-R1's multilingual capabilities)
- Thread names and dates
- Error messages
- Usage limit messages

Current languages:
- English (default)
- Polish
- More languages can be easily added

## Troubleshooting

If you encounter issues:
1. Make sure all required permissions are granted
2. Check that slash commands are registered (`npm run deploy`)
3. Verify the bot has access to the channel
4. Ensure all environment variables are set correctly
5. Check the `data` directory exists and is writable
6. Verify database connection in `data/bot.db`

## Requirements

- Node.js 22.13.1 or higher
- Discord.js v14
- OpenRouter API key (with access to DeepSeek-R1 or other models)
- Discord Bot Token
- SQLite3

## TODOs and Future Features

### Administration
- [x] Role-based access control
  - [x] Restrict commands to specific roles
  - [x] Admin configuration commands
  - [x] Per-server settings
- [x] Server-specific configurations
  - [x] Default language
  - [x] Allowed models
  - [x] Custom thread naming
- [ ] Usage analytics dashboard
- [ ] Automated backup system

### Language Support
- [ ] Additional languages:
  - German
  - French
  - Spanish
  - Ukrainian
  - More based on community needs
- [ ] Language detection for automatic mode
- [ ] Custom translations support

### AI Features
- [ ] Model selection command
  - Switch between available OpenRouter models
  - Model presets for different use cases
  - Cost optimization options
- [ ] Enhanced summarization options
  - Topic categorization
  - Keyword extraction
  - Sentiment analysis
- [ ] Web search integration
  - Include context from linked websites
  - Real-time information in summaries
  - Source verification

### User Experience
- [ ] Custom summary formats
  - Bullet points vs. paragraphs
  - Include/exclude user mentions
  - Customizable date formats
- [ ] Interactive summaries
  - React to expand specific points
  - Thread continuation options
  - Summary editing for admins

### Technical Improvements
- [x] Persistent storage options
  - [x] Database integration
  - [ ] Backup system
  - [ ] Configuration export/import
- [ ] Performance optimizations
  - Message caching
  - Batch processing
  - Rate limiting controls

### Community Features
- [ ] Usage statistics
  - Per-user summary counts
  - Most active channels
  - Popular time periods
- [ ] Feedback system
  - Summary quality ratings
  - Feature requests
  - Bug reports

Want to contribute? Pick any of these TODOs or suggest new features!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. Feel free to use, modify, and distribute the code as you wish.