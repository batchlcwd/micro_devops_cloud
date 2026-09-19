## Create a cluster

```bash
 eksctl create cluster -f .\eks-cluster-config.yml
```

## Install AWS Load Balancer Controller (Prerequisite for Ingress)

The AWS Load Balancer Controller manages AWS Elastic Load Balancers (ALB & NLB) for Kubernetes Ingress and Services.

### Step 1: Associate IAM OIDC Provider with Cluster
> **What it does**: Enables IAM Roles for Service Accounts (IRSA), allowing Kubernetes pods to securely assume AWS IAM roles without storing hardcoded AWS credentials.

```powershell
eksctl utils associate-iam-oidc-provider --region ap-south-1 --cluster lcwd-cluster1 --approve
```

---

### Step 2: Download the Official IAM Policy
> **What it does**: Downloads the required AWS permissions defined by Kubernetes SIGs that allow the controller to manage ALBs, NLBs, target groups, and security groups.

```powershell
curl.exe -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
```

---

### Step 3: Create IAM Policy in AWS
> **What it does**: Creates an IAM policy named `AWSLoadBalancerControllerIAMPolicy` in your AWS account using the downloaded JSON file.

```powershell
aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://iam_policy.json
```

---

### Step 4: Get AWS Account ID
> **What it does**: Fetches your 12-digit AWS Account ID to construct the full ARN of the policy created in Step 3.

```powershell
# Get your AWS Account ID:
aws sts get-caller-identity --query Account --output text

# Example Output: 524954473877
# Policy ARN format: arn:aws:iam::<ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy
```

---

### Step 5: Create IAM Service Account (IRSA)
> **What it does**: Uses `eksctl` to create a Kubernetes ServiceAccount named `aws-load-balancer-controller` in the `kube-system` namespace, creates an IAM role `AmazonEKSLoadBalancerControllerRole`, and attaches the policy to it.

```powershell
eksctl create iamserviceaccount `
  --cluster=lcwd-cluster1 `
  --region=ap-south-1 `
  --namespace=kube-system `
  --name=aws-load-balancer-controller `
  --role-name AmazonEKSLoadBalancerControllerRole `
  --attach-policy-arn=arn:aws:iam::524954473877:policy/AWSLoadBalancerControllerIAMPolicy `
  --approve
```

Verify the ServiceAccount was created with the IAM role annotation:
```powershell
kubectl get serviceaccount aws-load-balancer-controller -n kube-system
```

---

### Step 6: Add and Update EKS Helm Repository
> **What it does**: Adds the official AWS EKS Helm repository and syncs the latest charts to your local Helm cache.

```powershell
helm repo add eks https://aws.github.io/eks-charts
helm repo update eks
```

---

### Step 7: Install AWS Load Balancer Controller using Helm
> **What it does**: Deploys the controller pods into the `kube-system` namespace. It configures the controller with your cluster name `lcwd-cluster1` and binds it to the IAM ServiceAccount created in Step 5 (`serviceAccount.create=false`).

```powershell
helm install aws-load-balancer-controller eks/aws-load-balancer-controller `
  -n kube-system `
  --set clusterName=lcwd-cluster1 `
  --set serviceAccount.create=false `
  --set serviceAccount.name=aws-load-balancer-controller
```

---

### Step 8: Verify the Controller Deployment
> **What it does**: Confirms that the controller pods are running and ready in the `kube-system` namespace.

```powershell
kubectl get deployment aws-load-balancer-controller -n kube-system
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```


## Deploy NGINX to EKS

```bash
# 1. Apply namespace first, then deployment, service, and ingress
kubectl apply -f .\nginx\namespace.yml
kubectl apply -f .\nginx\deployment.yml
kubectl apply -f .\nginx\service.yml
kubectl apply -f .\nginx\ingress.yml

# Alternatively, apply all manifests in the folder at once:
# kubectl apply -f .\nginx\

# 2. Check status in nginx namespace
kubectl get all -n nginx
kubectl get pods -n nginx -o wide

# 3. Check Service & Ingress (ALB endpoint)
kubectl get svc nginx-service -n nginx
kubectl get ingress nginx-ingress -n nginx -w
```

## Delete the Cluster

> **Important**: Always delete any active Ingress and LoadBalancer services first so AWS can cleanly release the ALBs, security groups, and VPC dependencies before cluster teardown.

```bash
# Step 1: Delete Kubernetes resources / namespace (removes ALBs and Cloud Load Balancers)
kubectl delete -f .\nginx\
# Or delete the entire namespace:
# kubectl delete namespace nginx

# Step 2: Delete the EKS cluster using eksctl
eksctl delete cluster -f .\eks-cluster-config.yml

# Alternatively, delete by cluster name and region:
# eksctl delete cluster --name lcwd-cluster1 --region ap-south-1
```
