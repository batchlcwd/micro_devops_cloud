## Create a cluster

```bash
 eksctl create cluster -f .\eks-cluster-config.yml
```

## Using ingress install AWS Load balancer controller using helm

```
eksctl utils associate-iam-oidc-provider \
  --region ap-south-1 \
  --cluster <YOUR_CLUSTER_NAME> \
  --approve



curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json



aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

aws sts get-caller-identity  --query Account   --output text


arn:aws:iam::524954473877:policy/AWSLoadBalancerControllerIAMPolicy


eksctl create iamserviceaccount  --cluster=lcwd-cluster1   --region=ap-south-1 --namespace=kube-system  --name=aws-load-balancer-controller   --role-name AmazonEKSLoadBalancerControllerRole --attach-policy-arn=arn:aws:iam::524954473877:policy/AWSLoadBalancerControllerIAMPolicy   --approve

verify

kubectl get serviceaccount aws-load-balancer-controller -n kube-system

Install controller using helm

helm repo add eks https://aws.github.io/eks-charts
helm repo update


helm install aws-load-balancer-controller eks/aws-load-balancer-controller   -n kube-system   --set clusterName=lcwd-cluster1   --set serviceAccount.create=false
--set serviceAccount.name=aws-load-balancer-controller

verify

kubectl get deployment aws-load-balancer-controller -n kube-system

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
