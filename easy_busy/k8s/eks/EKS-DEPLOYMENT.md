# ☸️ AWS EKS Deployment Guide - Easy Buy (via Docker Hub)

This directory contains the Kubernetes manifests for deploying **Easy Buy** to **Amazon EKS (Elastic Kubernetes Service)**, pulling images from **Docker Hub**. Files are numbered in the order they're applied.

| File | Purpose |
|---|---|
| `00-cluster-config.yml` | `eksctl` `ClusterConfig` — creates the EKS cluster itself (applied with `eksctl`, not `kubectl`) |
| `01-namespace.yml` | `easybuy` namespace |
| `02-instfastructure.yml` | `gp3` StorageClass + MySQL, Kafka, Mailhog, Postgres, Redis |
| `03-config-map.yml` | `easybuy-config` ConfigMap |
| `04-secret.yml` | `easybuy-secrets` Secret |
| `05-spring-cloud-infra.yml` | `service-discovery` (Eureka) + `config-server` |
| `06-easy-buy-microservices.yml` | `api-gateway` + all 7 domain services |

---

## 🏗️ EKS Architecture Additions

1. **Cluster**: `substring-prod` in `ap-south-1`, 2x `t3.large` managed nodes (`00-cluster-config.yml`), OIDC enabled for IRSA.
2. **Storage Class (`gp3`)**: Dynamically provisions encrypted AWS EBS SSD volumes, with `reclaimPolicy: Retain` so deleting a PVC/StatefulSet never silently deletes the underlying volume.
3. **Network Load Balancer (NLB)**: Exposes `api-gateway` to the public internet via AWS NLB on port `80`.

---

## ⚙️ Where configuration actually comes from

Most runtime config (datasource URLs, DB names, Kafka bootstrap servers, per-service ports, ImageKit, and — once added there — Razorpay) is **not** duplicated in `03-config-map.yml` / `04-secret.yml`. It's pulled by every service from `config-server`, which serves the `prod` profile files out of the private/public GitHub repo [`batchlcwd/easy_buy_config`](https://github.com/batchlcwd/easy_buy_config).

`03-config-map.yml` / `04-secret.yml` only carry values that have **no safe default**, or whose default in `easy_buy_config` points at `localhost` (wrong inside the cluster):

- **ConfigMap**: `SPRING_PROFILES_ACTIVE`, `EUREKA_DEFAULT_ZONE`, `CONFIG_SERVER_URL`, `SPRING_MAIL_HOST`/`PORT`, `SPRING_DATA_REDIS_HOST`.
- **Secret**: MySQL root creds (`SPRING_DATASOURCE_USERNAME`/`PASSWORD`) and Postgres creds (`POSTGRES_USER`/`PASSWORD` — these must stay in sync with whatever `PRODUCT-SERVICE-prod.properties` hardcodes, since that file has no `${...}` placeholder to override).

Razorpay and ImageKit credentials are commented out in both `04-secret.yml` and `06-easy-buy-microservices.yml` (`payment-service` / `products-service`) — they're expected to live in `easy_buy_config` (`PAYMENT-SERVICE-prod.properties` / `PRODUCT-SERVICE-prod.properties`) instead. Uncomment them only if you decide to source them from Kubernetes again — and note that a **hardcoded** literal in the properties file (no `${...}`) will still win over the env var by default, so the config-repo file would need to change too.

---

## 🛠️ Step-by-Step EKS Setup

### Step 0: Create the EKS Cluster
```bash
eksctl create cluster -f 00-cluster-config.yml
```
This provisions the `substring-prod` cluster in `ap-south-1` (takes ~15-20 minutes).

### Step 1: Install AWS EBS CSI Driver (Required for Databases)
Before EKS can dynamically provision storage volumes using `gp3`, you must enable the EBS CSI driver:
```bash
# Add IAM policy for EBS CSI driver
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster substring-prod \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name EasyBuyEBSCSIRole

# Enable the addon (Replace <your_account_id> with your actual AWS Account ID)
eksctl create addon --name aws-ebs-csi-driver --cluster substring-prod --service-account-role-arn arn:aws:iam::<your_account_id>:role/EasyBuyEBSCSIRole --force
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

   > `config-server` must be rebuilt/pushed if you've changed its `application.yaml` (e.g. the `GITHUB_PASSWORD` placeholder) — the deployed image needs to match what's in this repo.

---

## 🚀 Deployment Instructions

Point your terminal at the cluster created in Step 0:
```bash
aws eks update-kubeconfig --region ap-south-1 --name substring-prod
```

Deploy the resources in order (the file number is the apply order):

```bash
# 1. Create easybuy namespace
kubectl apply -f 01-namespace.yml

# 2. Deploy AWS EBS gp3 StorageClass + stateful infra (MySQL, Kafka, Mailhog, Postgres, Redis)
kubectl apply -f 02-instfastructure.yml

# 3. Apply the ConfigMap
kubectl apply -f 03-config-map.yml

# 4. Apply the Secret
kubectl apply -f 04-secret.yml

# 5. Deploy Discovery and Config Servers
kubectl apply -f 05-spring-cloud-infra.yml

# 6. Deploy All Application Microservices
kubectl apply -f 06-easy-buy-microservices.yml
```

Watch the rollout and confirm every pod reaches `Running`/`1/1` before moving on, especially the StatefulSets in `02` (PVCs need the EBS CSI driver from Step 1 to bind):
```bash
kubectl get pods -n easybuy -w
```

---

## 🌐 Verifying Public Access

To access the API Gateway, get the external DNS address of the AWS Load Balancer:
```bash
kubectl get svc api-gateway -n easybuy
```
Access the APIs externally using the LoadBalancer DNS name on port `80`:
`http://<aws-nlb-dns-name>/api/...`
