# ===========================================================================
# Stage 1 — Builder
# Ubuntu 24.04 ships Drogon 1.8.7 (built with PostgreSQL), so there is no
# 15-minute Drogon source build like KnottSoDirtyCo's.
# ===========================================================================
FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    cmake \
    git \
    libdrogon-dev \
    libjsoncpp-dev \
    libpq-dev \
    libssl-dev \
    uuid-dev \
    zlib1g-dev \
    libbrotli-dev \
    libc-ares-dev \
    libsqlite3-dev \
    libhiredis-dev \
    libyaml-cpp-dev \
    libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY CMakeLists.txt .
COPY src ./src

RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --parallel $(nproc)

# ===========================================================================
# Stage 2 — Runtime (slim)
# ===========================================================================
FROM ubuntu:24.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    libdrogon1t64 \
    postgresql-client \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build/emsa_backend /usr/local/bin/emsa_backend
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && groupadd --system emsa && useradd --system --gid emsa --no-create-home emsa

USER emsa

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/health > /dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
