# ===========================================================================
# Stage 1 — Node build
# ===========================================================================
FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
# npm ci installs exactly what's in package-lock.json.
RUN npm ci

COPY . .
RUN npm run build:prod

# ===========================================================================
# Stage 2 — nginx runtime: serves the site and proxies /api to the backend
# ===========================================================================
FROM nginx:alpine AS runtime

COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ > /dev/null || exit 1
