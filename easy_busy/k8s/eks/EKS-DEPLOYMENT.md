# 🚀 Complete End-to-End AWS EKS Deployment & Custom Domain Guide

This guide covers everything required to deploy the **Easy Buy** microservices application onto Amazon EKS from scratch—including cluster provisioning, storage setup, container builds, sequential deployment, and mapping a custom domain with SSL/TLS.

---

## 📋 Table of Contents
1. [Prerequisites & CLI Tools](#1-prerequisites--cli-tools)
2. [EKS Cluster Provisioning](#2-eks-cluster-provisioning)
3. [AWS EBS CSI Driver Setup (Persistent Storage)](#3-aws-ebs-csi-driver-setup-persistent-storage)
4. [Build and Push Docker Images](#4-build-and-push-docker-images)
5. [Deploy Kubernetes Manifests (Sequential Order)](#5-deploy-kubernetes-manifests)
6. [Verification & Health Checks](#6-verification--health-checks)
7. [Connecting to a Custom Domain & SSL/TLS](#7-connecting-to-a-custom-domain--ssltls)
8. [Cleanup / Teardown](#8-cleanup--teardown)

---

## 1. Prerequisites & CLI Tools

Ensure you have the following installed on your machine:
- **AWS CLI** (configured with admin credentials: `aws configure`)
- **eksctl** (AWS EKS management CLI)
- **kubectl** (Kubernetes CLI)
- **Docker** and **JDK 21+ / Maven**

```bash
# Verify installations
aws sts get-caller-identity
eksctl version
kubectl version --client
docker --version
```

---

## 2. EKS Cluster Provisioning

### Step 2.1: Create Cluster Configuration File
Create an `eks-cluster-config.yaml` to specify region, node types, and capacity:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: easybuy-cluster
  region: us-east-1
  version: "1.30"

iam:
  withOIDC: true

managedNodeGroups:
  - name: easybuy-nodes
    instanceType: t3.large
    minSize: 2
    maxSize: 4
    desiredCapacity: 3
    volumeSize: 30
    volumeType: gp3
    privateNetworking: false
    iam:
      withAddonPolicies:
        ebs: true
        albIngress: true
        cloudWatch: true
```

### Step 2.2: Create Cluster
```bash
eksctl create cluster -f eks-cluster-config.yaml
```
*(This takes approximately 10–15 minutes)*

### Step 2.3: Update Local Kubeconfig
```bash
aws eks update-kubeconfig --region us-east-1 --name easybuy-cluster
```

---

## 3. AWS EBS CSI Driver Setup (Persistent Storage)

Your databases (MySQL, Postgres) and message broker (Kafka) require dynamic Persistent Volumes via `gp3`.

### Step 3.1: Create IAM Role for Service Account (IRSA)
```bash
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster easybuy-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name EasyBuyEBSCSIRole
```

### Step 3.2: Install AWS EBS CSI Driver Add-on
```bash
# Export your AWS Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# Install addon
eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster easybuy-cluster \
  --service-account-role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/EasyBuyEBSCSIRole \
  --force
```

---

## 4. Build and Push Docker Images

Make sure your microservices container images are built and pushed to your Docker Hub namespace (`batchlcwd`) or AWS ECR.

```bash
# Login to Docker Hub
docker login -u batchlcwd

# Build & Push using Maven Jib from each microservice directory:
# Example:
# ./mvnw clean compile jib:build -Dimage=batchlcwd/<service-name>:latest
```

Services to build:
- `api-gateway`
- `config-server`
- `service-discovery`
- `users-service`
- `products-service`
- `inventory-service`
- `cart-order-service`
- `payment-service`
- `notifications-service`
- `ai-service`

---

## 5. Deploy Kubernetes Manifests

Navigate to `k8s/eks/` directory:
```bash
cd k8s/eks
```

Deploy the resources in the exact sequence below:

```bash
# Step 5.1: Create Namespace
kubectl apply -f namespace.yaml

# Step 5.2: Storage Class (gp3)
kubectl apply -f storageclass.yaml

# Step 5.3: ConfigMaps and Secrets
kubectl apply -f env-configs.yaml

# Step 5.4: Infrastructure (MySQL, Postgres, Kafka, Redis, Mailhog)
kubectl apply -f infrastructure.yaml

# Wait for databases to become ready
kubectl rollout status statefulset/mysql -n easybuy
kubectl rollout status statefulset/postgres -n easybuy
kubectl rollout status statefulset/kafka -n easybuy
kubectl rollout status statefulset/redis -n easybuy

# Step 5.5: Spring Cloud Infrastructure (Config Server & Eureka)
kubectl apply -f spring-cloud-infra.yaml

# Wait for Config Server & Eureka to stabilize
kubectl rollout status deployment/config-server -n easybuy
kubectl rollout status deployment/service-discovery -n easybuy

# Step 5.6: Microservices & API Gateway (NLB LoadBalancer)
kubectl apply -f microservices.yaml

# Wait for microservices to finish rollouts
kubectl rollout status deployment/api-gateway -n easybuy
kubectl rollout status deployment/products-service -n easybuy
kubectl rollout status deployment/users-service -n easybuy
kubectl rollout status deployment/inventory-service -n easybuy
kubectl rollout status deployment/cart-order-service -n easybuy
kubectl rollout status deployment/payment-service -n easybuy
kubectl rollout status deployment/notifications-service -n easybuy
kubectl rollout status deployment/ai-service -n easybuy
```

---

## 6. Verification & Health Checks

### Check Pod Status
```bash
kubectl get pods -n easybuy
```
*All pods should display `STATUS: Running` with `READY: 1/1`.*

### Get AWS Network Load Balancer (NLB) URL
```bash
kubectl get svc api-gateway -n easybuy
```
*Output will show the `EXTERNAL-IP` (e.g., `k8s-easybuy-apigatew-xxxx.elb.us-east-1.amazonaws.com`).*

### Test Endpoint via NLB
```bash
curl http://<NLB-EXTERNAL-DNS>/actuator/health
```

---

## 7. Connecting to a Custom Domain & SSL/TLS

To route your custom domain (e.g. `api.yourdomain.com`) to the AWS Load Balancer with HTTPS:

### Option A: AWS Route 53 (Recommended if DNS is in AWS)
1. **Request SSL Certificate in AWS Certificate Manager (ACM)**:
   - Go to **AWS ACM** in the same region (`us-east-1`).
   - Click **Request Certificate** -> Request a public certificate -> Enter domain `api.yourdomain.com`.
   - Validate domain via DNS records in Route 53.
2. **Add ACM Annotation to `api-gateway` Service**:
   Edit `k8s/eks/microservices.yaml` under `Service/api-gateway`:
   ```yaml
   metadata:
     name: api-gateway
     namespace: easybuy
     annotations:
       service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
       service.beta.kubernetes.io/aws-load-balancer-ssl-cert: "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
       service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "https"
       service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"
   spec:
     type: LoadBalancer
     ports:
       - name: http
         port: 80
         targetPort: 8080
       - name: https
         port: 443
         targetPort: 8080
   ```
   Apply change: `kubectl apply -f microservices.yaml`.

3. **Create Route 53 Record**:
   - In Route 53 Hosted Zone, click **Create Record**.
   - Record Name: `api` (or `@` for apex domain).
   - Record Type: `A - Routes traffic to an IPv4 address and some AWS resources`.
   - Toggle **Alias** to `YES`.
   - Route traffic to: **Alias to Network Load Balancer**.
   - Select your region (`us-east-1`) and pick your `api-gateway` NLB.
   - Click **Save**.

---

### Option B: External DNS (Cloudflare, GoDaddy, Namecheap)
If your DNS is managed outside AWS:
1. Copy the `EXTERNAL-IP` DNS name of `api-gateway`:
   ```bash
   kubectl get svc api-gateway -n easybuy -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
   ```
2. Log in to your DNS provider (Cloudflare / GoDaddy / Namecheap).
3. Add a **CNAME** record:
   - **Type**: `CNAME`
   - **Name / Host**: `api` (or `@`)
   - **Value / Target**: `<Your-NLB-DNS-Name>` (e.g., `k8s-easybuy-apigatew-xxxx.elb.us-east-1.amazonaws.com`)
   - **TTL**: Auto / 300 seconds
   - *(If using Cloudflare: you can enable Cloudflare Proxy 🟧 to get instant free SSL/TLS terminating at Cloudflare)*.

---

### Verify Custom Domain Access
```bash
# Test HTTP
curl http://api.yourdomain.com/actuator/health

# Test HTTPS
curl https://api.yourdomain.com/actuator/health
```

---

## 8. Cleanup / Teardown

When you wish to remove the resources:
```bash
# 1. Delete all deployed manifests
kubectl delete -f k8s/eks/microservices.yaml
kubectl delete -f k8s/eks/spring-cloud-infra.yaml
kubectl delete -f k8s/eks/infrastructure.yaml
kubectl delete -f k8s/eks/env-configs.yaml
kubectl delete -f k8s/eks/storageclass.yaml
kubectl delete -f k8s/eks/namespace.yaml

# 2. Delete EKS cluster
eksctl delete cluster --name easybuy-cluster --region us-east-1
```
