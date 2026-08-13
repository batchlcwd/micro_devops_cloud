## Commands

### EC2 instance install Docker:

```
sudo apt update
sudo apt install docker.io docker-compose-v2 -y

sudo systemctl enable docker
sudo systemctl start docker

```

### Allow your user to access and run docker

```
sudo usermod -aG docker $USER

```
