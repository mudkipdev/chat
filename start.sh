#!/bin/sh
bun run build
DOCKER_BUILDKIT=1 docker build -t chat .
docker stop $(docker ps -q --filter publish=3000) 2>/dev/null
docker run --rm -p 3000:3000 \
  --cap-add SYS_ADMIN \
  --cap-add SYS_PTRACE \
  --security-opt apparmor=unconfined \
  --security-opt seccomp=unconfined \
  -e ADMIN_ACCOUNT_USERNAME=admin \
  -e ADMIN_ACCOUNT_PASSWORD=admin \
  -e BASE_ENDPOINT=http://192.168.1.86:11434 \
  chat
