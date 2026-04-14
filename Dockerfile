# syntax=docker/dockerfile:1
FROM debian:bookworm-slim AS nsjail-builder
RUN apt-get update && apt-get install -y \
    git build-essential pkg-config \
    libprotobuf-dev protobuf-compiler \
    libnl-3-dev libnl-route-3-dev \
    flex bison \
    && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 https://github.com/google/nsjail.git /nsjail \
    && cd /nsjail && make -j$(nproc)

FROM oven/bun:1.3-debian AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install sandbox packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libprotobuf32 libnl-3-200 libnl-route-3-200 \
    python3 python3-pip python3-venv \
    nodejs npm \
    git curl wget jq ripgrep \
    && rm -rf /var/lib/apt/lists/*

COPY --from=nsjail-builder /nsjail/nsjail /usr/local/bin/nsjail

# Install Python packages at system level (available inside chroot via --chroot /)
RUN --mount=type=cache,target=/root/.cache/pip \
    python3 -m pip install --break-system-packages \
    pillow numpy pandas matplotlib \
    pypdf python-docx openpyxl \
    requests beautifulsoup4

# App
COPY build ./build
COPY migrate.ts ./migrate.ts

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
ENV SANDBOX_TEMPLATE=1

CMD ["sh", "-c", "bun run migrate.ts && bun run build/index.js"]
