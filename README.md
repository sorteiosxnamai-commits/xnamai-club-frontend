# XNaMai Club — Frontend React

Frontend React + TypeScript + Vite conectado à API Node via JWT.

## Telas incluídas

- `/` — landing page simples.
- `/simulador` — simulador de economia de 15% a 25%, inicialmente em R$ 55 mil.
- `/planos` — planos carregados da API.
- `/cadastro` — cadastro do cliente.
- `/login` — login cliente/admin.
- `/checkout` — pré-aprovação + pagamento demonstrativo.
- `/confirmacao` — confirmação da assinatura.
- `/app` — área do assinante com plano e cobranças.
- `/admin` — dashboard administrativo protegido por role.

## Rodar

```bash
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:5173`.

O backend deve estar em `http://localhost:4000` por padrão.

## JWT

Após login/cadastro, o frontend salva o access token em `localStorage` para simplificar este MVP e o envia em:

```http
Authorization: Bearer <token>
```

Para produção, recomenda-se evoluir para access token curto em memória + refresh token em cookie `HttpOnly`, `Secure`, `SameSite`, além de CSP e proteção CSRF conforme a estratégia escolhida.

## Cartão

A interface contém campos visuais para reproduzir o protótipo, mas o código demonstra que o backend recebe somente um `paymentToken` + metadados não sensíveis. Antes de produção, substitua os campos por Hosted Fields/Elements/SDK do gateway escolhido para que PAN/CVV nunca passem pelo seu servidor.
"# xnamai-club-frontend" 
