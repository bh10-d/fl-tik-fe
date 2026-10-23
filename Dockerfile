FROM node:20-alpine

WORKDIR /app

# Allow passing API URL via docker build args or compose
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build (reads .env and VITE_API_BASE_URL build arg)
COPY . .
RUN npm run build

# Install lightweight static server
RUN npm install -g serve

EXPOSE 5173

# Serve compiled SPA dist folder on port 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
