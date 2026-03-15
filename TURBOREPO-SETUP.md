# Próximos Passos - Turborepo Setup

## ✅ Estrutura criada:

```
e:\Clica\clica-sso/
├── turbo.json                # ✅ Config do Turborepo
├── pnpm-workspace.yaml       # ✅ Atualizado para apps/*
├── package.json              # ✅ Configurado com Turborepo
├── .npmrc                    # ✅ Config do pnpm
├── .gitignore               # ✅ Atualizado
├── .turboignore             # ✅ Criado
├── apps/
│   ├── clica-sso-backend/   # ✅ Movido para apps/
│   └── clica-sso-front/     # ✅ Movido para apps/
```

## 🚀 Instalar e iniciar

```bash
# 1. Instalar dependencies (inclui Turborepo)
pnpm install

# 2. Limpar node_modules antigos e cachês
pnpm install
# ou
pnpm install --frozen-lockfile

# 3. Rodar aplicações em paralelo
pnpm dev

# 4. Compilar tudo com Turborepo (com cache)
pnpm build

# 5. Executar testes
pnpm test
```

## 📋 Verificar instalação

```bash
# Verificar se Turborepo foi instalado
turbo --version

# Ver grafo de dependências
turbo run build --graph

# Limpar cache do Turborepo
turbo prune

# Rodar uma task específica por app
turbo run start:dev -F clica-sso-backend
```

## 🔧 Configurações Turborepo

O arquivo `turbo.json` contém:

- **``build`**: Tarefa de build com cache habilitado
- **`lint`**: Linting sem cache
- **`test`**: Testes com cache
- **`test:e2e`**: Testes E2E sem cache
- **`dev`**: Modo desenvolvimento (persistent)
- **`start`/`start:dev`**: Modo development server (persistent)
- **`preview`**: Preview de build (persistent)

### Cache do Turborepo

O Turborepo usa cache local em `.turbo/`. Para habilitar cache remoto da Vercel:

```bash
turbo login     # Autenticar com Vercel
turbo link      # Vincular projeto
```

## 📦 Adicionar pacotes compartilhados (opcional)

Se quiser criar código compartilhado entre backend e frontend:

```bash
# 1. Criar pasta de pacotes compartilhados
mkdir -p packages/shared

# 2. Criar package.json em packages/shared
```

Depois atualizar `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

## 🎯 Comandos úteis

```bash
# Rodar dev em paralelo (Turborepo + pnpm)
pnpm dev

# Rodar build com tracking de dependências
turbo run build --graph

# Rodar apenas para uma app
turbo run build -F clica-sso-backend

# Rodar com scope múltiplo
turbo run build -F "clica-sso-*"

# Limpar todos os artifacts
turbo prune --scope=clica-sso-backend

# Dry run (ver o que será rodado sem executar)
turbo run build --dry
```

## ⚠️ Limpeza de node_modules antigos

Se houver ainda node_modules em:
- `e:\Clica\clica-sso\clica-sso-backend\node_modules` (deve estar em `apps/clica-sso-backend/`)
- `e:\Clica\clica-sso\clica-sso-front\node_modules` (deve estar em `apps/clica-sso-front/`)

Execute:

```bash
# Remover node_modules antigos
rm -r e:\Clica\clica-sso\clica-sso-backend\node_modules -Force -ErrorAction SilentlyContinue
rm -r e:\Clica\clica-sso\clica-sso-front\node_modules -Force -ErrorAction SilentlyContinue

# Reinstalar tudo
pnpm install
```

## 📚 Documentação

- [Turborepo Docs](https://turbo.build)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Backend Docs](./apps/clica-sso-backend/README.md)
- [Frontend Docs](./apps/clica-sso-front/README.md)
