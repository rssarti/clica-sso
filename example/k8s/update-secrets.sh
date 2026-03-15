#!/bin/bash
# Script para atualizar Secrets no Kubernetes com credenciais reais

echo "🔐 Atualizando Secrets do Kubernetes..."

kubectl create secret generic guindakila-secrets \
  --namespace=guindakila \
  --from-literal=DATABASE_URL='postgresql://guindakila:guindakila2026APP@10.136.28.241:5432/guindakila_db' \
  --from-literal=JWT_SECRET='sua-chave-secreta-jwt-muito-segura-aqui' \
  --from-literal=S3_ACCESS_KEY='DO00EBKYNKJK6PUNCU4A' \
  --from-literal=S3_SECRET_KEY='TU8ScFkmMk6Qjr9M/5h/4rpXb/SG4EL7Qs2GVvysdp0' \
  --from-literal=OPENAI_API_KEY='sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx' \
  --from-literal=GOOGLE_MAPS_API_KEY='AIzaSyD91R2vZLYOBm9GR_W2DZ_AReDg0aqLD3A' \
  --from-literal=VITE_API_URL='https://guindapi.clicatecnologia.com.br' \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secrets atualizados!"
echo ""
echo "🔄 Reiniciando pods do backend para aplicar as novas credenciais..."
kubectl rollout restart deployment/guindakila-backend -n guindakila

echo "⏳ Aguardando rollout..."
kubectl rollout status deployment/guindakila-backend -n guindakila

echo "✅ Pronto! As credenciais S3 agora estão corretas."
echo ""
echo "Para verificar os logs:"
echo "kubectl logs -f deployment/guindakila-backend -n guindakila"
