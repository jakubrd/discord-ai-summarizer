# Project Scope: Custom Discord Bot for Message Summarization

## Overview
This project aims to create a custom Discord bot designed to summarize messages in a Discord channel using AI-powered language models. The bot will integrate with the OpenRouter API for summarization capabilities. Users will interact with the bot through a simple UI featuring buttons to select the number of messages to summarize. Upon generating a summary, the bot will notify the requesting user by tagging them in a message containing the summary.

## Objectives
- Enable users to request summaries of recent messages in a Discord channel.
- Provide an intuitive button-based interface for selecting the number of messages to include in the summary.
- Leverage the OpenRouter API to generate concise and accurate summaries.
- Deliver the summary to the user in a clear, personalized message.

## Key Features

### 1. Slash Command Initiation
- **Description**: Users will trigger the summarization process by typing the `/summarize` slash command in a Discord channel.
- **Behavior**: The bot will respond to the command in the channel where it is used, preparing the user for the next step.

### 2. Button-Based Message Selection
- **Description**: After the `/summarize` command, the bot will send a message with buttons allowing the user to choose how many messages to summarize.
- **Options**: Buttons will offer predefined message counts (e.g., "Last 10", "Last 20", "Last 50").
- **Behavior**: The user clicks a button to specify the number of messages to include in the summary context.

### 3. Message Fetching and Summarization
- **Description**: Upon button selection, the bot will fetch the specified number of messages from the channel and send them to the OpenRouter API for summarization.
- **Details**:
  - Messages will be fetched from the channel where the `/summarize` command was issued.
  - The bot will concatenate the messages into a context string, potentially including usernames or timestamps for clarity.
  - The context will be sent to the OpenRouter API with a prompt instructing it to generate a summary.

### 4. Summary Delivery
- **Description**: Once the OpenRouter API returns a summary, the bot will send a message in the channel tagging the user who requested it.
- **Format**: The message will follow this structure:  
  `"Hey @user, here is your summary of the last N messages: see thread"`  
  where `@user` is the requesting user’s tag, `N` is the number of messages selected, and `[summary]` is the AI-generated summary that's an additional message sent by the bot in the thread to not spam the main channel.

### 5. Error Handling
- **Description**: The bot will manage errors gracefully and inform the user when issues arise.
- **Examples**:
  - If there are fewer messages in the channel than requested: "Not enough messages to summarize."
  - If the API fails: "Sorry, there was an issue generating your summary. Please try again later."

### 6. Security and Configuration
- **Description**: Sensitive data will be securely managed, and the bot will operate without requiring complex setup.
- **Details**:
  - The Discord bot token and OpenRouter API key will be stored in environment variables.
  - The bot will summarize messages in the channel where the command is used, eliminating the need for channel-specific configuration.

## Technical Requirements

### Programming Language
- **JavaScript (ES6+)**: Chosen for its compatibility with Discord.js and ease of integration with APIs.

### Libraries
- **Discord.js**: For interacting with the Discord API, handling slash commands, and managing button interactions.
- **Axios or Fetch**: For making HTTP requests to the OpenRouter API.
- **Dotenv**: For securely loading environment variables (e.g., bot token, API key).

### API Integration
- **OpenRouter API**: The sole language model API for generating summaries in this initial version.

### Error Handling
- Robust checks for:
  - Insufficient messages in the channel.
  - API timeouts, errors, or invalid responses.
  - Invalid user inputs or interaction failures.

### Performance Considerations
- **Message Fetching**: Limited to fetching up to 100 messages per request due to Discord API constraints.
- **Summary Generation**: Users will be informed of delays (e.g., "Generating summary...") if the API response takes time.

## Assumptions
- The bot will summarize messages from the channel where the `/summarize` command is invoked.
- The bot will process one summarization request at a time to avoid overwhelming the API or the Discord server.
- The bot has the necessary permissions to read messages and send messages in the target channel.

## Deliverables
- **Source Code**: A fully functional Discord bot written in JavaScript, with modular structure and clear comments.
- **Documentation**: Instructions for setup, including environment variable configuration and bot deployment.
- **Bot Deployment**: A working bot that can be invited to a Discord server and tested.

## Future Considerations
- **Enhanced UI**: Add options to summarize messages from a specific time frame or a different channel.
- **Permission System**: Restrict usage to specific roles or users.
- **API Flexibility**: Support additional LLM APIs beyond OpenRouter.
- **Queue System**: Handle multiple simultaneous requests efficiently.