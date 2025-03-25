# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create data directory for SQLite
RUN mkdir -p /usr/src/app/data

# Expose port (if needed for monitoring)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"] 