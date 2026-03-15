# Teste do Socket.IO - Instruções

## Status atual

✅ **Socket.IO Gateway**: Rodando em 3 pods (modo standalone, sem Redis adapter ainda)
✅ **Ingress**: Configurado para `socket.clicatecnologia.com.br` com TLS
✅ **IP Externo**: 129.212.132.174
✅ **Certificado TLS**: Emitido e pronto

## Para testar agora (sem Redis adapter):

### Opção 1: Usar o arquivo HTML de teste

1. Abra o arquivo `test-socket.html` no navegador
2. Ele já vem configurado com `https://socket.clicatecnologia.com.br`
3. Clique em "Conectar"
4. Digite mensagens e envie

### Opção 2: Testar via console do navegador

```javascript
const socket = io('https://socket.clicatecnologia.com.br', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Conectado!', socket.id);
});

socket.on('message', (data) => {
  console.log('📨 Mensagem:', data);
});

socket.emit('message', { message: 'Hello from client!' });
```

### Opção 3: Testar com curl (verifica se o endpoint responde)

```powershell
curl -I https://socket.clicatecnologia.com.br
```

## ⚠️ Importante sobre DNS

Você precisa configurar o DNS `socket.clicatecnologia.com.br` apontando para `129.212.132.174` no Cloudflare:

1. Vá no Cloudflare Dashboard
2. DNS → Add record
3. Type: A
4. Name: socket
5. IPv4 address: 129.212.132.174
6. Proxy status: Proxied (nuvem laranja) OU DNS only (nuvem cinza)
7. Save

**Recomendação**: Use **DNS only (cinza)** para evitar problemas com WebSocket no Cloudflare (a menos que você tenha Enterprise plan).

## O que vai funcionar agora:

- ✅ Conexão Socket.IO via HTTPS/WSS
- ✅ Eventos: `connect`, `disconnect`, `message`, `join_room`, `leave_room`
- ✅ Broadcast para todos os clientes
- ✅ Salas de chat

## O que NÃO vai funcionar ainda (precisa Redis):

- ❌ Mensagens entre pods diferentes (clustering)
- ❌ Sincronização de salas entre réplicas

## Próximo passo para ativar clustering:

O Jenkins build ainda está instalando as dependências `@socket.io/redis-adapter` e `redis`. Após o deploy:

1. Os logs vão mostrar: `Socket.IO Redis adapter configured`
2. O clustering vai funcionar automaticamente
3. Clientes em pods diferentes vão receber mensagens entre si

## Verificar se está funcionando:

```powershell
# Ver logs do gateway
kubectl logs -l app=clica-sso-backend --tail=50 | Select-String "WebSocket|Socket"

# Ver pods rodando
kubectl get pods -l app=clica-sso-backend

# Ver certificado TLS
kubectl get certificate clica-sso-socket-tls
```

## Troubleshooting:

### Se não conectar:
1. Verifique se o DNS está configurado: `nslookup socket.clicatecnologia.com.br`
2. Verifique se o Cloudflare não está bloqueando WebSocket (use DNS only)
3. Veja os logs do navegador (F12 → Console)

### Se conectar mas não receber mensagens:
1. Verifique os logs do pod: `kubectl logs <pod-name>`
2. Teste com `userId` na query: `io('https://socket.clicatecnologia.com.br?userId=123')`

## Endpoints disponíveis:

- `wss://socket.clicatecnologia.com.br` → Socket.IO
- `https://api.clicatecnologia.com.br` → REST API
- `https://accounts.clicatecnologia.com.br` → Frontend

Todos no mesmo IP: **129.212.132.174**
