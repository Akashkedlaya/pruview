# Use official Node.js image
FROM node:20-alpine
RUN apk add --no-cache openssl openssl-dev

# Set working directory inside container
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy rest of source code
COPY . .

# Expose port
EXPOSE 3001

# Start the app
CMD ["node", "src/server.js"]
