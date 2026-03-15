# Socket.IO Clustered Integration - Complete Documentation

## Overview
This document describes the complete Socket.IO clustering implementation for clica-sso, including backend configuration, Kubernetes infrastructure, and frontend integration.

## Infrastructure

### URLs Configuration
- **Frontend**: https://accounts.clicatecnologia.com.br
- **API Backend**: https://api.clicatecnologia.com.br
- **Socket.IO**: https://socket.clicatecnologia.com.br

All services share the same external IP: `129.212.132.174`

### Backend Configuration

#### Dependencies (package.json)
```json
{
  "socket.io": "^4.8.1",
  "@socket.io/redis-adapter": "^8.1.0",
  "redis": "^4.6.7"
}
```

#### EventsGateway (src/events/events.gateway.ts)
The gateway is configured to:
- Support Redis adapter for horizontal scaling
- Use environment-based CORS configuration
- Gracefully degrade if Redis is unavailable

Key features:
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: false,
  },
  namespace: '/',
})
```

Redis adapter initialization:
```typescript
const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();
  await pubClient.connect();
  await subClient.connect();
  server.adapter(createAdapter(pubClient, subClient));
  this.logger.log('Socket.IO Redis adapter configured');
}
```

#### Environment Variables (k8s/deployment.yaml)
```yaml
- name: CORS_ORIGIN
  value: "https://accounts.clicatecnologia.com.br"
- name: REDIS_URL
  valueFrom:
    secretKeyRef:
      name: clica-sso-secrets
      key: redis-url
```

Current Redis URL: `redis://redis-service:6379`
⚠️ **Note**: Redis service doesn't exist yet in cluster. Adapter will gracefully degrade.

### Kubernetes Resources

#### Socket.IO Ingress (k8s/socketio.yaml)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: clica-sso-socket-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://accounts.clicatecnologia.com.br"
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "route"
    nginx.ingress.kubernetes.io/websocket-services: "clica-sso-backend-service"
spec:
  tls:
  - hosts:
    - socket.clicatecnologia.com.br
    secretName: clica-sso-socket-tls
  rules:
  - host: socket.clicatecnologia.com.br
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: clica-sso-backend-service
            port:
              number: 80
```

#### Deployment Scaling (k8s/deployment.yaml)
```yaml
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: clica-sso-backend
        resources:
          requests:
            memory: "128Mi"
            cpu: "50m"
          limits:
            memory: "384Mi"
            cpu: "300m"
```

#### TLS Certificate Status
```bash
$ kubectl get certificate clica-sso-socket-tls
NAME                    READY   SECRET                  AGE
clica-sso-socket-tls    True    clica-sso-socket-tls    1h
```

### Frontend Configuration

#### Environment Variables (.env.production)
```bash
VITE_SOCKET_IO=https://socket.clicatecnologia.com.br
VITE_SOCKET_PATCH=/socket.io/
```

#### SocketContext.tsx
```typescript
const {
  socket,
  isConnected,
  notifications,
  joinRoom,
  leaveRoom,
  sendMessage,
  clearNotifications,
  removeNotification,
} = useSocket(import.meta.env.VITE_SOCKET_IO || 'http://localhost:3000');
```

#### Kubernetes ConfigMap (k8s/configmap.yaml)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: clica-sso-front-config
data:
  VITE_SOCKET_IO: "https://socket.clicatecnologia.com.br"
  VITE_SOCKET_PATCH: "/socket.io/"
```

## Testing

### Backend Health Check (curl)
```bash
# Basic health check
curl https://socket.clicatecnologia.com.br
# Response: {"status":"ok","message":"Hello Worlds!","timestamp":"..."}

# Socket.IO handshake
curl "https://socket.clicatecnologia.com.br/socket.io/?EIO=4&transport=polling"
# Response: 0{"sid":"...","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}
```

### HTML Test Client
Open `test-socket.html` in a browser to test the Socket.IO connection interactively.

Features:
- Connect/Disconnect buttons
- Send custom messages
- View connection status
- Display client info (sid, transport)
- Real-time event logging

### Frontend Integration Test
1. **Configure DNS**: Point `socket.clicatecnologia.com.br` to `129.212.132.174`
2. **Deploy Frontend**: Jenkins will rebuild with new environment variables
3. **Test Connection**: Open browser console and verify:
   ```javascript
   // Should see in console:
   "Socket.IO connected: true"
   "Client ID: <socket-id>"
   ```

## Deployment Status

### Current State
✅ Backend dependencies installed (Jenkins build #34)  
✅ EventsGateway code updated with Redis adapter support  
✅ Kubernetes Ingress created for socket.clicatecnologia.com.br  
✅ TLS certificate issued successfully  
✅ Backend scaled to 2 replicas  
✅ Frontend code updated to use clustered Socket.IO URL  
✅ All changes committed and pushed  

### Pending Actions
⏳ **Deploy Redis Service**: Create `k8s/redis.yaml` with Redis deployment and service  
⏳ **Configure DNS**: Add A record for socket.clicatecnologia.com.br → 129.212.132.174  
⏳ **Verify Deployment**: Check logs for "Socket.IO Redis adapter configured" message  
⏳ **End-to-End Test**: Test cross-pod messaging via Redis pub/sub  

## Redis Deployment (Next Steps)

To enable true clustering, deploy Redis in Kubernetes:

```yaml
# k8s/redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

Apply with:
```bash
kubectl apply -f k8s/redis.yaml
```

After Redis deployment, verify in logs:
```bash
kubectl logs -l app=clica-sso-backend | grep "Socket.IO Redis adapter configured"
```

## Verification Commands

### Check Ingress
```bash
kubectl get ingress clica-sso-socket-ingress
kubectl describe ingress clica-sso-socket-ingress
```

### Check Pods
```bash
kubectl get pods -l app=clica-sso-backend
kubectl logs -l app=clica-sso-backend --tail=100
```

### Check Certificate
```bash
kubectl get certificate clica-sso-socket-tls
kubectl describe certificate clica-sso-socket-tls
```

### Test Socket.IO Handshake
```bash
curl -v "https://socket.clicatecnologia.com.br/socket.io/?EIO=4&transport=polling"
```

## Troubleshooting

### Issue: Socket.IO not connecting from frontend
**Solution**:
1. Verify DNS: `nslookup socket.clicatecnologia.com.br`
2. Check CORS: Ensure backend CORS_ORIGIN includes frontend URL
3. Check browser console for connection errors
4. Verify TLS certificate is valid: `curl -I https://socket.clicatecnologia.com.br`

### Issue: Messages not syncing across pods
**Solution**:
1. Verify Redis service is running: `kubectl get svc redis-service`
2. Check Redis adapter initialization in logs
3. Test Redis connectivity from backend pod:
   ```bash
   kubectl exec -it <pod-name> -- sh
   nc -zv redis-service 6379
   ```

### Issue: WebSocket upgrade failing
**Solution**:
1. Check Ingress annotations for WebSocket support
2. Verify `nginx.ingress.kubernetes.io/websocket-services` annotation
3. Check nginx ingress controller logs:
   ```bash
   kubectl logs -n ingress-nginx <ingress-controller-pod>
   ```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────┬────────────────────────────────────────┘
                     │ 129.212.132.174
         ┌───────────┼──────────────┐
         │           │              │
    ┌────▼────┐ ┌────▼────┐   ┌────▼────┐
    │Frontend │ │   API   │   │ Socket  │
    │accounts.│ │   api.  │   │ socket. │
    └─────────┘ └─────────┘   └────┬────┘
                                    │
                          ┌─────────▼─────────┐
                          │  Nginx Ingress    │
                          └─────────┬─────────┘
                                    │
                     ┌──────────────┼──────────────┐
                     │              │              │
                ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
                │ Backend │    │ Backend │   │  Redis  │
                │  Pod 1  │◄───┤  Pod 2  │◄──┤ Service │
                └─────────┘    └─────────┘   └─────────┘
                     │              │
                     └──────┬───────┘
                            │
                    ┌───────▼────────┐
                    │   PostgreSQL   │
                    │  (DigitalOcean)│
                    └────────────────┘
```

## Commits

### Backend
- `c6020f6`: Added Socket.IO clustering with Redis adapter
- `657b6c8`: Scaled deployment to 2 replicas

### Frontend
- `c7b14b5`: Updated Socket.IO URL to clustered endpoint

## References

- Socket.IO Documentation: https://socket.io/docs/v4/
- Redis Adapter: https://socket.io/docs/v4/redis-adapter/
- Kubernetes Ingress: https://kubernetes.io/docs/concepts/services-networking/ingress/
- cert-manager: https://cert-manager.io/docs/
