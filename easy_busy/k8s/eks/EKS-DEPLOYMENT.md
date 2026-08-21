# ☸️ AWS EKS Deployment Guide - Easy Buy (via Docker Hub)

This directory contains the production-ready Kubernetes manifests tailored for **Amazon EKS (Elastic Kubernetes Service)** using **Docker Hub** as the image registry.

---

## 🏗️ EKS Architecture Additions

1. **Storage Class (`gp3`)**: Provisions high-performance, cost-effective AWS EBS (Elastic Block Store) SSD volumes dynamically.
2. **Network Load Balancer (NLB)**: Exposes `api-gateway` to the public internet using a secure and fast AWS Network Load Balancer (NLB) on port `80`.

---

## 🛠️ Step-by-Step EKS Setup

### Step 1: Install AWS EBS CSI Driver (Required for Databases)
Before EKS can dynamically provision storage volumes using `gp3`, you must enable the EBS CSI driver:
```bash
# Add IAM policy for EBS CSI driver
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster easybuy-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name EasyBuyEBSCSIRole

# Enable the addon (Replace <your_account_id> with your actual AWS Account ID)
eksctl create addon --name aws-ebs-csi-driver --cluster easybuy-cluster --service-account-role-arn arn:aws:iam::<your_account_id>:role/EasyBuyEBSCSIRole --force
```

### Step 2: Compile & Push Images to Docker Hub
Since your EKS cluster will pull the images directly from Docker Hub under the `batchlcwd` namespace:

1. **Login to Docker Hub in your local terminal**:
   ```bash
   docker login -u batchlcwd
   ```

2. **Build and push images using Maven Jib**:
   Execute Jib compilation targeting your Docker Hub namespace (`batchlcwd`). You can run this in each microservice's directory:
   ```bash
   # Navigate into a service and push it to Docker Hub
   ./mvnw clean compile jib:build -Dimage=batchlcwd/<service-name>:latest
   ```

   For example, for the products service:
   ```bash
   cd products-service/products-service
   ./mvnw clean compile jib:build -Dimage=batchlcwd/products-service:latest
   ```

---

## 🚀 Deployment Instructions

Ensure your terminal context is connected to your EKS cluster:
```bash
aws eks update-kubeconfig --region <region> --name easybuy-cluster
```

Deploy the resources in order:

```bash
# 1. Create easybuy namespace
kubectl apply -f namespace.yaml

# 2. Deploy AWS EBS gp3 StorageClass
kubectl apply -f storageclass.yaml

# 3. Apply ConfigMaps and Secrets
kubectl apply -f env-configs.yaml

# 4. Deploy Databases and Infrastructure (MySQL, Postgres, Kafka, Redis, Mailhog)
kubectl apply -f infrastructure.yaml

# 5. Deploy Discovery and Config Servers
kubectl apply -f spring-cloud-infra.yaml

# 6. Deploy All Application Microservices
kubectl apply -f microservices.yaml
```

---

## 🌐 Verifying Public Access

To access the API Gateway, get the external DNS address of the AWS Load Balancer:
```bash
kubectl get svc api-gateway -n easybuy
```
Access the APIs externally using the LoadBalancer DNS name on port `80`:
`http://<aws-nlb-dns-name>/api/...`
