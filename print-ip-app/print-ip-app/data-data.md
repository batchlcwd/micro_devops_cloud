```bash

#!/bin/bash

set -e

# ----------------------------------------
# 1. Update packages
# ----------------------------------------
apt-get update -y


# ----------------------------------------
# 2. Install prerequisites
# ----------------------------------------
apt-get install -y \
    ca-certificates \
    curl


# ----------------------------------------
# 3. Add Docker official GPG key
# ----------------------------------------
install -m 0755 -d /etc/apt/keyrings

curl -fsSL \
    https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc

chmod a+r /etc/apt/keyrings/docker.asc


# ----------------------------------------
# 4. Add Docker official repository
# ----------------------------------------
cat <<EOF > /etc/apt/sources.list.d/docker.sources
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF


# ----------------------------------------
# 5. Update package index
# ----------------------------------------
apt-get update -y


# ----------------------------------------
# 6. Install Docker Engine
# ----------------------------------------
apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin


# ----------------------------------------
# 7. Start Docker
# ----------------------------------------
systemctl enable docker
systemctl start docker


# ----------------------------------------
# 8. Verify Docker
# ----------------------------------------
docker --version


# ----------------------------------------
# 9. Pull Spring Boot application image
# ----------------------------------------
docker pull batchlcwd/print-ip-app:0.0.1-SNAPSHOT


# ----------------------------------------
# 10. Run Spring Boot container
# ----------------------------------------
docker run -d \
    --name print-ip-app \
    --restart unless-stopped \
    -p 80:8080 \
    batchlcwd/print-ip-app:0.0.1-SNAPSHOT


# ----------------------------------------
# 11. Verify container
# ----------------------------------------
docker ps

```