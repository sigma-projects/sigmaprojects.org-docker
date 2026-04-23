FROM node:20-alpine

# Install system dependencies for sharp (native image processing)
RUN apk add --no-cache vips-dev fftw-dev build-base python3 py3-setuptools

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create volume mount points
RUN mkdir -p data uploads/thumbnails uploads/gallery uploads/files

EXPOSE 8384

CMD ["node", "src/server.js"]
