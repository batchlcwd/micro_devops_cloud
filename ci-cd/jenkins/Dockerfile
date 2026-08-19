FROM jenkins/jenkins:lts-jdk21

USER root

# --------------------------------------------------
# Basic tools
# --------------------------------------------------

RUN apt-get update && \
    apt-get install -y \
        ca-certificates \
        curl \
        wget \
        git \
        unzip \
        zip \
        openssh-client \
        lsb-release \
        gnupg \
        apt-transport-https \
        jq \
        vim \
        nano \
        less \
        procps \
        iputils-ping \
        net-tools \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# --------------------------------------------------
# Install Docker CLI
# --------------------------------------------------

RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg \
        -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo \
      "deb [arch=$(dpkg --print-architecture) \
      signed-by=/etc/apt/keyrings/docker.asc] \
      https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli docker-compose-plugin && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# --------------------------------------------------
# Install Maven
# --------------------------------------------------

RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# --------------------------------------------------
# Install kubectl
# --------------------------------------------------

RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl && \
    rm kubectl


# --------------------------------------------------
# Jenkins plugins
# --------------------------------------------------

USER jenkins

RUN jenkins-plugin-cli --plugins \
    workflow-aggregator \
    git \
    github \
    credentials-binding \
    ssh-agent \
    docker-workflow \
    junit \
    pipeline-stage-view \
    timestamper