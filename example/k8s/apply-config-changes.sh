#!/bin/bash
# Script para aplicar mudanças no ConfigMap e reiniciar pods

echo "🔄 Aplicando ConfigMap atualizado..."
kubectl apply -f k8s/configmap.yaml

echo "⏳ Aguardando 2 segundos..."
sleep 2

echo "🔄 Reiniciando pods do backend para pegar novas variáveis..."
kubectl rollout restart deployment/guindakila-backend -n guindakila

echo "⏳ Aguardando rollout do backend..."
kubectl rollout status deployment/guindakila-backend -n guindakila

echo "🔄 Reiniciando pods do web..."
kubectl rollout restart deployment/guindakila-web -n guindakila

echo "⏳ Aguardando rollout do web..."
kubectl rollout status deployment/guindakila-web -n guindakila

echo "🔄 Reiniciando pods do websocket..."
kubectl rollout restart deployment/guindakila-ws -n guindakila

echo "⏳ Aguardando rollout do websocket..."
kubectl rollout status deployment/guindakila-ws -n guindakila

echo "✅ ConfigMap atualizado e todos os pods reiniciados!"
echo ""
echo "Para verificar os logs do backend:"
echo "kubectl logs -f deployment/guindakila-backend -n guindakila"
