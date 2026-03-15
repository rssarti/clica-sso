# Clica SSO Monorepo

Monorepo usando **Turborepo** com **pnpm workspaces** para gerenciar duas aplicações principais:
- **apps/clica-sso-backend**: API NestJS
- **apps/clica-sso-front**: Frontend React + Vite

## Pré-requisitos

- Node.js 22.x
- pnpm 9.0.0+

## Instalação

```bash
# Instalar dependências de todas as aplicações
pnpm install
```

## Scripts Disponíveis (com Turborepo)

### Desenvolvendo ambas as aplicações
```bash
# Executar dev mode em paralelo
pnpm dev

# Construir ambas as aplicações (com cache do Turborepo)
pnpm build

# Executar lint em todas as aplicações
pnpm lint

# Executar testes em todas as aplicações
pnpm test

# Executar testes E2E em todas as aplicações
pnpm test:e2e

# Formatter em todas as aplicações
pnpm format
```

### Backend (clica-sso-backend)
```bash
# Modo desenvolvimento
pnpm start:backend

# Build
turbo run build -F clica-sso-backend

# Testes
turbo run test -F clica-sso-backend

# Testes E2E
turbo run test:e2e -F clica-sso-backend

# Linting
turbo run lint -F clica-sso-backend
```

### Frontend (clica-sso-front)
```bash
# Modo desenvolvimento
pnpm start:frontend

# Build
turbo run build -F clica-sso-front

# Preview
turbo run preview -F clica-sso-front

# Lint
turbo run lint -F clica-sso-front
```

## Estrutura do Monorepo com Turborepo

```
clica-sso/
├── turbo.json              # Configuração do Turborepo
├── pnpm-workspace.yaml     # Configuração do pnpm workspace
├── package.json            # Root package.json com Turborepo
├── .npmrc                  # Configurações do pnpm
├── .gitignore
├── README.md
└── apps/
    ├── clica-sso-backend/  # Aplicação Backend (NestJS)
    │   ├── package.json
    │   ├── src/
    │   ├── test/
    │   └── ...
    └── clica-sso-front/    # Aplicação Frontend (React + Vite)
        ├── package.json
        ├── src/
        ├── public/
        └── ...
```

## Benefícios do Turborepo

✅ **Monorepo otimizado**: Turborepo gerencia build cachês, paralelização e dependências de tarefas
✅ **Build rápido**: Apenas as mudanças são reconstruídas, com suporte a cache distribuído
✅ **Execução remota**: Suporte para Vercel Remote Caching (opcional)
✅ **Visualização de dependências**: Comando `turbo run [task] --graph`

## Como adicionar dependências

### Para todo o monorepo (devDependencies compartilhadas)
```bash
pnpm add -w -D eslint typescript
```

### Para uma aplicação específica
```bash
# Backend
pnpm add -F clica-sso-backend express

# Frontend
pnpm add -F clica-sso-front axios
```

## Como estruturar pacotes compartilhados

Se precisar de código compartilhado entre backend e frontend:

1. Criar pasta `packages/shared`:
```bash
mkdir -p packages/shared
```

2. Adicionar em `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

3. Referenciar nos package.json:
```json
{
  "dependencies": {
    "@clica-sso/shared": "workspace:*"
  }
}
```

## Visualizar grafo de dependências

```bash
# Gráfico visual de todas as tarefas
turbo run build --graph

# Gráfico específico de uma tarefa
turbo run test --graph
```

## Limpeza de artifacts do Turborepo

```bash
# Limpar cache do Turborepo
turbo prune --scope=clica-sso-backend

# Limpar tudo
rm -rf node_modules && pnpm install
```

## Notas importantes

- O `pnpm-lock.yaml` é compartilhado por todo o monorepo (está na raiz)
- **Cada aplicação em `apps/` pode ter seu próprio `pnpm-lock.yaml`** - remova-os se quiser um lock centralizado
- Use `turbo run [task]` para executar tarefas em paralelo com inteligência de cache
- Use `-F [app-name]` para executar em uma aplicação específica
- O Turborepo automaticamente detecta dependências entre pacotes

## Links úteis

- [Documentação Turborepo](https://turbo.build)
- [Documentação pnpm Workspaces](https://pnpm.io/workspaces)
- [Backend - clica-sso-backend](./apps/clica-sso-backend/README.md)
- [Frontend - clica-sso-front](./apps/clica-sso-front/README.md)

