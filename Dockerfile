FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for docker cache optimization)
COPY package*.json ./
RUN npm ci

# Copy source code and build (reads .env copied into image)
COPY . .
RUN npm run build

# Install lightweight static server
RUN npm install -g serve

EXPOSE 5173

# Serve compiled SPA dist folder on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
