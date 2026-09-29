# ☸️ Kubernetes Deployment Guide - Easy Buy

This folder contains the complete set of Kubernetes manifests to deploy the **Easy Buy** microservices backend on a Kubernetes cluster (such as Minikube, Kind, Docker Desktop, or GKE).

---

## 📂 Manifests Structure

1. **`namespace.yaml`**: Creates the custom `easybuy` namespace to isolate all our project resources.
2. **`env-configs.yaml`**: Contains the shared `ConfigMap` and `Secret` configurations (databases, Eureka server zone, Kafka broker host, Redis host, Git repository URL, SMTP, and Razorpay API credentials).
3. **`infrastructure.yaml`**: Deploys MySQL (with persistent storage PVC), PostgreSQL (with persistent storage PVC), a Kafka single-node cluster, Redis, and Mailhog (for SMTP email simulation).
4. **`spring-cloud-infra.yaml`**: Deploys Eureka Discovery Service (`service-discovery`) and the Spring Cloud Config Server (`config-server`).
4. **`microservices.yaml`**: Deploys all 8 primary application microservices:
   - `api-gateway` (Exposed via NodePort `30080`, connected to Redis for rate-limiting)
   - `users-service` (Runs on port `8085` as defined in configuration)
   - `products-service` (Connected to PostgreSQL database)
   - `inventory-service` (Runs on port `8083` as defined in configuration)
   - `cart-order-service`
   - `payment-service`
   - `notifications-service`
   - `ai-service`

---

## 🚀 Deployment Instructions

### Step 1: Compile and Build Docker Images with Jib
We use the **Google Jib Maven Plugin** to build Docker images directly without requiring separate Dockerfiles. Jib automatically handles dependency layering and Java 25 noble base images.

If you are using Minikube, configure your terminal to use Minikube's Docker daemon first:
```bash
# Minikube Docker registry integration (PowerShell):
minikube docker-env | Invoke-Expression

# Minikube Docker registry integration (Bash):
eval $(minikube -p minikube docker-env)
```

Now build the Docker images for all services using Maven:
```bash
# Navigate into each service's inner directory and compile/build local images:
cd service-discovery/service-discovery && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../config-server/config-server && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../api-gateway/api-gateway && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../users-service/users-service && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../products-service/products-service && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../inventory-service/inventory-service && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../cart-order-service/cart-order-service && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../payment-service/payment-service && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../notifications-service/notifications-service && ./mvnw.cmd clean compile jib:dockerBuild
cd ../../ai-service/ai-service && ./mvnw.cmd clean compile jib:dockerBuild
```

*(Note: To push directly to a remote registry like Docker Hub, replace `jib:dockerBuild` with `jib:build`).*

### Step 3: Apply the Manifests
Deploy the manifests in order to allow infrastructure services to start before application containers:

```bash
# 1. Create the namespace
kubectl apply -f namespace.yaml

# 2. Apply config maps and secrets
kubectl apply -f env-configs.yaml

# 3. Deploy MySQL, PostgreSQL, Kafka, Redis, and Mailhog
kubectl apply -f infrastructure.yaml

# 4. Deploy Spring Cloud infrastructure (Discovery & Config Servers)
kubectl apply -f spring-cloud-infra.yaml

# 5. Deploy all application microservices
kubectl apply -f microservices.yaml
```

### Step 4: Verify Deployment Status
Monitor the startup sequence of the pods:
```bash
kubectl get pods -w
```
Once all pods are in the `Running` state, check the services:
```bash
kubectl get svc
```

### Step 5: Access the APIs
The API Gateway is exposed via a **NodePort** service at port `30080`.
- Access Gateway from your host machine at: `http://localhost:30080/api/...` (or Minikube IP: `http://<minikube-ip>:30080/api/...`)
- Eureka Server console can be forwarded to check registrations:
  ```bash
  kubectl port-forward svc/service-discovery 8761:8761
  ```
  Open `http://localhost:8761` in your browser.
- Mailhog web panel can be forwarded to check SMTP emails sent by the notifications service:
  ```bash
  kubectl port-forward svc/mailhog 8025:8025
  ```
  Open `http://localhost:8025` in your browser.
