# Development frontend image: Vite dev server with hot reload.
# Source is bind-mounted at runtime; node_modules comes from a named volume
# seeded from this image on first start.
FROM node:24-alpine

WORKDIR /app

ENV VITE_HOST=0.0.0.0

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

EXPOSE 5173

# `npm install` at start-up keeps the node_modules volume in sync with the
# lockfile even when the named volume predates an image rebuild.
CMD ["sh", "-c", "npm install --no-audit --no-fund && npm run dev -- --host 0.0.0.0 --port 5173 --strictPort"]
