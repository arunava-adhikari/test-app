# # Use Node.js 18 Alpine for lightweight container
# FROM node:18-alpine

# # Install necessary dependencies for Puppeteer headless operation
# RUN apk add --no-cache \
#     chromium \
#     nss \
#     freetype \
#     freetype-dev \
#     harfbuzz \
#     ca-certificates \
#     ttf-freefont \
#     # Add missing dependencies for headless operation
#     dbus \
#     xvfb \
#     # Additional fonts and dependencies
#     fontconfig \
#     # Additional system tools
#     procps \
#     iproute2 \
#     # VPN and networking dependencies
#     openvpn \
#     curl \
#     wget \
#     bash \
#     python3 \
#     py3-pip \
#     && rm -rf /var/cache/apk/*

# # Set Puppeteer to use installed Chromium
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# # Set environment variables for headless operation
# ENV DISPLAY=:99
# ENV CHROME_BIN=/usr/bin/chromium-browser
# ENV CHROME_PATH=/usr/bin/chromium-browser

# # Create app directory
# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy application files
# COPY . .

# # Create a non-root user for security
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nodejs -u 1001

# # Install ProtonVPN CLI
# RUN pip3 install protonvpn-cli-ng

# # Set ownership after installing VPN clients
# RUN chown -R nodejs:nodejs /app

# # Switch to non-root user
# USER nodejs

# # Expose port if needed for any web interface
# EXPOSE 8080

# # Default command to run the VPN test
# CMD ["node", "run-vpn-test.js", "--help"]