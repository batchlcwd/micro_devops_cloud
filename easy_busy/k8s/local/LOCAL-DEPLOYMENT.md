# ☸️ Local Deployment Guide - Easy Buy

Mirrors `k8s/eks/` file-for-file so you can smoke-test the exact same `prod` wiring (same images, same `easybuy-config`/`easybuy-secrets`, same `easy_buy_config` GitHub profile) on a local cluster before touching EKS. The only differences from `k8s/eks/` are cluster-specific:

| | `k8s/eks` | `k8s/local` |
|---|---|---|
| Cluster | `00-cluster-config.yml` via `eksctl` | your choice of minikube / kind / Docker Desktop (no file needed) |
| Storage | `gp3` StorageClass (EBS CSI driver) | cluster's default StorageClass (no `storageClassName` set) |
| `api-gateway` exposure | `Service type: LoadBalancer` + AWS NLB annotation | `Service type: NodePort` (`30080`) |

Everything else — `01` through `06` — is the same content as `k8s/eks`, so a clean pass here is a strong signal the EKS manifests will behave the same way.

---

## Prerequisites

- `kubectl`
- A local cluster: **minikube** (recommended — ships a default StorageClass out of the box) or Docker Desktop's built-in Kubernetes. If you use **kind** instead, install a dynamic provisioner first (e.g. [local-path-provisioner](https://github.com/rancher/local-path-provisioner)) or the `mysql`/`postgres`/`kafka` PVCs in `02-instfastructure.yml` will stay `Pending`.
- Internet access from the cluster to pull `batchlcwd/*:latest` from Docker Hub and to let `config-server` reach `github.com/batchlcwd/easy_buy_config`.

Give the cluster enough headroom to match the sum of `requests` across every pod (~3.5 vCPU / ~7Gi):
```bash
minikube start --cpus=4 --memory=8192
```

---

## Deploy

```bash
kubectl apply -f 01-namespace.yml
kubectl apply -f 02-instfastructure.yml
kubectl apply -f 03-config-map.yml
kubectl apply -f 04-secret.yml
kubectl apply -f 05-spring-cloud-infra.yml
kubectl apply -f 06-easy-buy-microservices.yml
```

Watch the rollout — StatefulSet pods need their PVC `Bound` before they'll start, and every app pod needs `service-discovery`/`config-server` healthy before it'll pass readiness:
```bash
kubectl get pods -n easybuy -w
```

---

## Access it

```bash
minikube service api-gateway -n easybuy --url
# or, if your cluster's node IP is reachable directly:
# http://<node-ip>:30080/api/...
```

Useful side-channels while debugging:
```bash
kubectl port-forward svc/service-discovery 8761:8761 -n easybuy   # Eureka dashboard
kubectl port-forward svc/mailhog 8025:8025 -n easybuy             # Mailhog UI (notifications-service emails)
kubectl logs -f deploy/config-server -n easybuy                   # confirm it pulled easy_buy_config OK
```

---

## Tear down

```bash
kubectl delete namespace easybuy
```
(PVCs have no `storageClassName`/`reclaimPolicy` override here, so whatever your cluster's default reclaim policy is applies — on minikube's default `standard` class that's `Delete`, so volumes go with the namespace.)

---

## Once this passes

If every pod in `easybuy` reaches `Running`/`1/1` and `curl`ing through `api-gateway` works end-to-end, you've validated the actual `prod`-profile wiring (ports, DB creds, Eureka registration, config-server → `easy_buy_config`) without touching AWS. At that point `k8s/eks/` differs only in the three rows in the table above — see `../eks/EKS-DEPLOYMENT.md`.
