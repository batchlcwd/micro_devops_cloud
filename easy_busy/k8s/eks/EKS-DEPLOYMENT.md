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
| `06-easy-buy-microservices.yml` | `api-gateway` (ClusterIP) + all 7 domain services |
| `07-ingress.yml` | `Ingress` exposing `api-gateway` publicly through an ALB |

---

## 🏗️ EKS Architecture Additions

1. **Cluster**: `substring-prod` in `ap-south-1`, 2x `t3.large` managed nodes (`00-cluster-config.yml`), OIDC enabled for IRSA.
2. **Storage Class (`gp3`)**: Dynamically provisions encrypted AWS EBS SSD volumes, with `reclaimPolicy: Retain` so deleting a PVC/StatefulSet never silently deletes the underlying volume.
3. **Ingress (ALB)**: `api-gateway`'s Service is `ClusterIP`; public access goes through `07-ingress.yml`, which the **AWS Load Balancer Controller** turns into an internet-facing Application Load Balancer on port `80`. The controller must be installed first — see Step 2.

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

### Step 2: Install the AWS Load Balancer Controller (Required for Ingress)
`07-ingress.yml` needs the `alb` IngressClass, which only exists once this controller is running:
```bash
# IAM policy + service account (downloads AWS's published policy document)
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://iam_policy.json

eksctl create iamserviceaccount \
  --cluster substring-prod \
  --namespace kube-system \
  --name aws-load-balancer-controller \
  --attach-policy-arn arn:aws:iam::<your_account_id>:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install the controller itself via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=substring-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```
> eksctl-created clusters tag their public subnets with `kubernetes.io/role/elb` automatically, which is what the controller needs to pick a subnet for the ALB — no extra tagging required here.

### Step 3: Compile & Push Images to Docker Hub
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

# 7. Expose api-gateway publicly via ALB Ingress (needs Step 2's controller running)
kubectl apply -f 07-ingress.yml
```

Watch the rollout and confirm every pod reaches `Running`/`1/1` before moving on, especially the StatefulSets in `02` (PVCs need the EBS CSI driver from Step 1 to bind):
```bash
kubectl get pods -n easybuy -w
```

---

## 🔒 Enable HTTPS

`07-ingress.yml` is already wired for TLS termination at the ALB — it just needs a real ACM certificate ARN:

1. **Request/import a certificate in ACM**, in the **same region as the cluster** (`ap-south-1` — ACM certs used by an ALB must live in that ALB's region):
   ```bash
   aws acm request-certificate --domain-name <your-domain> --validation-method DNS --region ap-south-1
   ```
   Complete the DNS validation (add the CNAME ACM gives you to your domain's DNS), then grab the cert's ARN:
   ```bash
   aws acm list-certificates --region ap-south-1
   ```
2. **Replace the placeholder** in `07-ingress.yml`'s `alb.ingress.kubernetes.io/certificate-arn` annotation with that ARN.
3. Re-apply: `kubectl apply -f 07-ingress.yml`.

What's already in place:
- `alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'` — the ALB listens on both.
- `alb.ingress.kubernetes.io/ssl-redirect: '443'` — the controller auto-adds an HTTP→HTTPS redirect rule, so plain `http://` requests get bounced to `https://` rather than served in the clear.
- `alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06` — a modern TLS policy (disables old/weak ciphers).

Point your domain's DNS (an `A`/`ALIAS` record if it's in Route 53, otherwise a `CNAME`) at the ALB's address from the section below once the certificate is attached.

---

## 🌐 Verifying Public Access

`api-gateway`'s own Service is now `ClusterIP` — the public entry point is the ALB that the AWS Load Balancer Controller provisions from `07-ingress.yml`. Get its address:
```bash
kubectl get ingress api-gateway -n easybuy
```
Wait for the `ADDRESS` column to populate (can take a minute or two after `07-ingress.yml` is applied), then hit it:
`http://<alb-address>/products/...` (redirects to `https://` once a real certificate ARN is in place) or `https://<alb-address>/products/...` directly.

If `ADDRESS` stays empty, check the controller's logs — the usual causes are the controller not running (Step 2), no subnets tagged `kubernetes.io/role/elb` in the cluster's VPC, or (once HTTPS is enabled) a `certificate-arn` that doesn't exist/isn't in `ap-south-1`:
```bash
kubectl logs -n kube-system deploy/aws-load-balancer-controller
```

---

## 🤖 CI/CD: Auto-Deploy on Push (GitHub Actions → EKS)

The workflow is `.github/workflows/easy-busy-cicd.yml` (at the **git repo root**, `micro_devops/`, not under `easy_busy/` — GitHub only reads workflows from the true repo root).

| Event | What happens |
|---|---|
| `pull_request` touching `easy_busy/**` | `kubectl diff` of the manifests — a safe preview. Nothing is built or deployed. |
| `push` to `main` touching `easy_busy/**` | Builds and pushes all 10 images to Docker Hub → applies `01`…`07` → `kubectl rollout restart` → waits for rollouts. |

GitHub Actions has **no AWS or Docker Hub credentials of its own**, so do the one-time setup below **before the first run**. It uses OIDC: GitHub gets a short-lived token and exchanges it for an IAM role — no AWS access keys are stored anywhere.

> **Values used below** (change them if yours differ):
> AWS account `524954473877` · region `ap-south-1` · cluster `substring-prod` · GitHub repo `batchlcwd/micro_devops_cloud` · role name `github-actions-eks-deploy`
> The repo name must match your GitHub URL **exactly** (`github.com/<owner>/<repo>`, case-sensitive). Check with `git remote -v`.

Run the `aws` commands in a terminal where `aws sts get-caller-identity` shows the **AWS account that owns the cluster**, using an admin-level user.

### Step 1 — Docker Hub token → GitHub secrets
1. Docker Hub → **Account Settings → Security → New Access Token** (Read & Write). Copy it — it is shown once.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `DOCKERHUB_USERNAME` = `batchlcwd`
   - `DOCKERHUB_TOKEN` = the access token (**not** your password)

### Step 2 — Create the GitHub OIDC provider in AWS (once per account)
Check first: IAM console → **Identity providers**. If `token.actions.githubusercontent.com` is already listed, skip this step.
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```
(Console alternative: Add provider → OpenID Connect → URL `https://token.actions.githubusercontent.com`, Audience `sts.amazonaws.com`.)

### Step 3 — Create the IAM role (trust policy = *who may assume it*)
Save as `trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::524954473877:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": [
            "repo:batchlcwd/micro_devops_cloud:ref:refs/heads/main",
            "repo:batchlcwd/micro_devops_cloud:pull_request"
          ]
        }
      }
    }
  ]
}
```
Both `sub` lines are needed: the first is the **deploy** job (push to `main`), the second is the **plan** job (pull requests). With only the first, PR runs fail with `Not authorized to perform sts:AssumeRoleWithWebIdentity`.

```bash
aws iam create-role \
  --role-name github-actions-eks-deploy \
  --assume-role-policy-document file://trust-policy.json
```
*(Console alternative: IAM → Roles → Create role → Custom trust policy → paste the JSON above.)*

### Step 4 — Give the role AWS permissions (permissions policy = *what it may do*)
Save as `permissions-policy.json` — this is also the JSON to paste into the console's **Policy editor (JSON tab)** if you do it by hand:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EksDescribeCluster",
      "Effect": "Allow",
      "Action": "eks:DescribeCluster",
      "Resource": "arn:aws:eks:ap-south-1:524954473877:cluster/substring-prod"
    },
    {
      "Sid": "EksListClusters",
      "Effect": "Allow",
      "Action": "eks:ListClusters",
      "Resource": "*"
    }
  ]
}
```
```bash
aws iam put-role-policy \
  --role-name github-actions-eks-deploy \
  --policy-name eks-describe \
  --policy-document file://permissions-policy.json
```
This is all AWS needs to allow for `aws eks update-kubeconfig`. It gives **no Kubernetes permissions** — that is Step 5. (Images go to Docker Hub, so no ECR permissions are needed.)

### Step 5 — Let the role into the cluster (Kubernetes side)
IAM permissions alone are not enough: without an EKS **access entry**, `kubectl` fails with `Unauthorized` / `forbidden`.
```bash
aws eks create-access-entry \
  --cluster-name substring-prod --region ap-south-1 \
  --principal-arn arn:aws:iam::524954473877:role/github-actions-eks-deploy

aws eks associate-access-policy \
  --cluster-name substring-prod --region ap-south-1 \
  --principal-arn arn:aws:iam::524954473877:role/github-actions-eks-deploy \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```
> **Why cluster scope and not just the `easybuy` namespace?** The pipeline applies `01-namespace.yml` (a `Namespace`) and `07-ingress.yml` (contains an `IngressClass`). Both are **cluster-scoped** objects, which a namespace-scoped policy such as `AmazonEKSEditPolicy` is forbidden to create. For a tighter role, use `AmazonEKSEditPolicy` with `--access-scope type=namespace,namespaces=easybuy`, create the namespace and IngressClass yourself once, and remove `01-namespace.yml` from `MANIFESTS` in the workflow (the `IngressClass` in `07` would also need moving out).

If the cluster still uses the old `aws-auth` ConfigMap instead of access entries, check with `aws eks describe-cluster --name substring-prod --query cluster.accessConfig` and, if needed, enable them:
`aws eks update-cluster-config --name substring-prod --region ap-south-1 --access-config authenticationMode=API_AND_CONFIG_MAP`

### Step 6 — Get the role ARN and save it as a GitHub secret
```bash
aws iam get-role --role-name github-actions-eks-deploy --query Role.Arn --output text
```
It prints `arn:aws:iam::524954473877:role/github-actions-eks-deploy`. (Console: IAM → Roles → the role → copy the **ARN** at the top.)

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
- `AWS_ROLE_ARN` = that ARN

### Step 7 — Check the secrets, then trigger a run
Three repo secrets must exist: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `AWS_ROLE_ARN`.

Push any change under `easy_busy/` to `main` (or open a PR to see the diff-only run). Watch it under the repo's **Actions** tab. Afterwards:
```bash
kubectl get pods -n easybuy
```

### Alternative: do Steps 1–6 in the web consoles (no CLI)

Same result as the commands above, using the AWS and GitHub websites. Sign in to AWS account `524954473877` and set the region to **Asia Pacific (Mumbai) ap-south-1**.

**A. Docker Hub + GitHub secrets (Step 1)**
1. hub.docker.com → profile icon → **Account settings** → **Personal access tokens** (or **Security**) → **Generate new token** (Read & Write). Copy it.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `DOCKERHUB_USERNAME` = `batchlcwd`
   - `DOCKERHUB_TOKEN` = the token

**B. OIDC provider (Step 2)**
1. **IAM → Identity providers**. If `token.actions.githubusercontent.com` is listed, skip to C.
2. **Add provider** → type **OpenID Connect** → Provider URL `https://token.actions.githubusercontent.com` → Audience `sts.amazonaws.com` → **Add provider**.

**C. Create the role (Step 3)**
1. **IAM → Roles → Create role** → trusted entity **Web identity**.
2. Identity provider `token.actions.githubusercontent.com`, Audience `sts.amazonaws.com`.
3. GitHub organization `batchlcwd`, repository `micro_devops_cloud`, branch `main` → **Next**.
4. Attach no permissions → **Next** → role name `github-actions-eks-deploy` → **Create role**.
5. The wizard only creates the `main` branch condition, so add the pull-request one: open the role → **Trust relationships → Edit trust policy** → replace the JSON with the trust policy from Step 3 above → **Update policy**.

**D. Permissions policy (Step 4)**
1. In the role: **Permissions → Add permissions → Create inline policy** → **JSON** tab.
2. Paste the permissions policy from Step 4 above → **Next** → name it `eks-describe` → **Create policy**.

**E. Cluster access (Step 5)**
1. **EKS → Clusters → `substring-prod` → Access** tab → **IAM access entries → Create access entry**.
2. IAM principal: `github-actions-eks-deploy`. Type: **Standard** → **Next**.
3. Policy name **AmazonEKSClusterAdminPolicy**, access scope **Cluster** → **Add policy** → **Next** → **Create**.
4. If the Access tab shows authentication mode `ConfigMap` only, click **Manage access**, switch to **EKS API and ConfigMap**, then redo 1–3.

**F. Role ARN → GitHub secret (Step 6)**
1. **IAM → Roles → `github-actions-eks-deploy`** → copy the **ARN** at the top.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret** → name `AWS_ROLE_ARN`, value = the ARN.

Then continue with Step 7.

### Troubleshooting
| Error | Cause / fix |
|---|---|
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | Trust policy `sub` does not match: wrong repo name (case-sensitive), wrong branch, missing `:pull_request` entry, or `aud` is not `sts.amazonaws.com`. |
| `Could not assume role` / no OIDC provider | Step 2 not done in this AWS account, or the `Principal` ARN has the wrong account ID. |
| `AccessDeniedException ... eks:DescribeCluster` | Step 4 policy missing, or its cluster ARN does not match `substring-prod` / `ap-south-1`. |
| `You must be logged in to the server (Unauthorized)` | Step 5 access entry is missing for the role. |
| `namespaces is forbidden` / `ingressclasses ... forbidden` | The role has a namespace-scoped policy; see the note in Step 5. |
| `Credentials could not be loaded` in the workflow | Workflow lacks `permissions: id-token: write` (already set in `easy-busy-cicd.yml`), or the `AWS_ROLE_ARN` secret is empty. |
