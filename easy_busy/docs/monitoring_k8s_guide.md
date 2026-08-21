# 📊 Production Monitoring (Kubernetes/EKS) Setup Guide

Yeh guide aapko step-by-step batayegi ki kaise local monitoring setup (docker-compose) ko **Kubernetes/EKS** cluster par migrate aur configure karna hai.

---

## 🛠️ Step 1: Helm Install Karein (Prerequisite)
Kubernetes mein packages deploy karne ke liye **Helm** sabse best tool hai. Agar aapke paas installed nahi hai, toh install karein:

* **Windows (Chocolatey):**
  ```powershell
  choco install kubernetes-helm
  ```
* **macOS:**
  ```bash
  brew install helm
  ```

---

## 📁 Step 2: Namespace Create Karein
Monitoring ke sabhi tools ko baki microservices se alag rakhne ke liye ek custom namespace banayein:
```bash
kubectl create namespace monitoring
```

---

## 📈 Step 3: Prometheus & Grafana Deploy Karein (kube-prometheus-stack)
Kube-Prometheus-Stack se Prometheus, Alertmanager, aur Grafana ek sath deploy ho jate hain.

1. **Grafana Helm Repository add karein:**
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo update
   ```

2. **Custom `prometheus-values.yaml` file banayein:**
   Hamein Prometheus ko batana hoga ki hamare microservices ke `/actuator/prometheus` endpoint se data scrape kare. Ek file banayein `prometheus-values.yaml`:
   ```yaml
   prometheus:
     prometheusSpec:
       serviceMonitorSelectorNilUsesHelmValues: false
       podMonitorSelectorNilUsesHelmValues: false
   ```

3. **Helm install run karein:**
   ```bash
   helm install prometheus-stack prometheus-community/kube-prometheus-stack \
     --namespace monitoring \
     -f prometheus-values.yaml
   ```

---

## 🗄️ Step 4: Microservices ke liye ServiceMonitor Configure Karein
Pehle hum hardcoded targets use kar rahe the. Ab hum Kubernetes custom resource `ServiceMonitor` ka use karenge. 

Har microservice ke Kubernetes file (jaise `users-service`, `products-service`) ke sath ye resource apply karein.

Example (`users-service-monitor.yaml`):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: users-service-monitor
  namespace: easybuy  # Jisme aapki microservice chal rahi hai
  labels:
    release: prometheus-stack
spec:
  selector:
    matchLabels:
      app: users-service # Aapke deployment ka label
  endpoints:
  - port: http # Service port name
    path: /actuator/prometheus
    interval: 15s
```
Isko apply karne ke liye:
```bash
kubectl apply -f users-service-monitor.yaml
```

---

## 📝 Step 5: Loki Deploy Karein (Logs Aggregation)
Logs manage karne ke liye hum Loki install karenge.

1. **Grafana Helm Repo add karein:**
   ```bash
   helm repo add grafana https://grafana.github.io/helm-charts
   helm repo update
   ```

2. **Loki aur Promtail (Log Collector) deploy karein:**
   `Promtail` automatically har pod ke standard output (console logs) ko read karke Loki ko bhej dega.
   ```bash
   helm install loki-stack grafana/loki-stack \
     --namespace monitoring \
     --set loki.auth_enabled=false \
     --set promtail.enabled=true
   ```

---

## 🔗 Step 6: Tempo Deploy Karein (Distributed Tracing)
API calls ke traces ko follow karne ke liye Tempo install karein.

```bash
helm install tempo grafana/tempo \
  --namespace monitoring
```

---

## 🚀 Step 7: Microservices ko Tracing ke liye Update Karein
Traces generate karne ke liye, hamari Spring Boot services ko start karte waqt Java Agent chahiye hoga.

1. **Dockerfile/Jib build mein Agent setup karein:**
   Jib configuration mein hum target container mein OpenTelemetry Javaagent download karke pass karenge.

2. **Kubernetes deployment file mein Environment Variables set karein:**
   Har microservice ke Deployment YAML ke `env` section mein ye variables add karein:
   ```yaml
   env:
     # OTel Agent loaded
     - name: JAVA_TOOL_OPTIONS
       value: "-javaagent:/app/opentelemetry-javaagent.jar"
     # Service name for tracing
     - name: OTEL_SERVICE_NAME
       value: "users-service"
     # Send traces to Alloy/Tempo
     - name: OTEL_EXPORTER_OTLP_ENDPOINT
       value: "http://tempo.monitoring.svc.cluster.local:4317"
   ```

---

## 🖥️ Dashboard Kaise Dekhein?
Install hone ke baad, Grafana UI access karne ke liye port-forwarding karein:
```bash
kubectl port-forward svc/prometheus-stack-grafana 3000:80 -n monitoring
```
Ab browser mein `http://localhost:3000` open karein. 
* **Default Username:** `admin`
* **Default Password:** `prom-operator` (Ya toh custom generate password retrieve karein: `kubectl get secret --namespace monitoring prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode`)

Grafana mein **Loki** aur **Tempo** ko Data Source ki tarah add karein:
* **Loki URL:** `http://loki-stack.monitoring.svc.cluster.local:3100`
* **Tempo URL:** `http://tempo.monitoring.svc.cluster.local:3100`
