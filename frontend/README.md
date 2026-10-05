# LocTis · Frontend

Next.js 16 + Tailwind 4 (gerado no v0), agora ligado ao backend FastAPI.
Esta pasta vai na raiz do projeto, ao lado de `backend/`.

## Antes de rodar

1. **Copie a pasta `public/` do seu projeto do v0** para dentro de `frontend/public/` (o logo `loctis-logo-new.png` e os ícones são binários e não vieram aqui).
2. Crie `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. **Faça os 3 ajustes no backend** (abaixo). Sem eles o dashboard e o login não funcionam.

```bash
cd frontend
npm install       # no PowerShell, se o npm for bloqueado: npm.cmd install
npm run dev       # http://localhost:3000
```

Backend em outro terminal: `docker compose up --build` na raiz.
Crie uma conta na tela de login e cadastre nesta ordem: imóvel, cliente, contrato, serviço.

---

## Ajustes obrigatórios no backend

### 1. `total` na paginação (o dashboard usa)

`app/core/pagination.py`:

```python
class Page(BaseModel, Generic[T]):
    items: list[T]
    page_atual: int
    page_max: int
    total: int

# no return de paginate():
    return {
        "items": items,
        "page_atual": pagination.page,
        "page_max": max(1, ceil(total / pagination.limit)),
        "total": total,
    }
```

Isso quebra 2 testes de `test_pagination.py` de propósito. Atualize:

```python
assert set(body.keys()) == {"items", "page_atual", "page_max", "total"}
...
assert body == {"items": [], "page_atual": 1, "page_max": 1, "total": 0}
```

### 2. `GET /auth/me` (o front precisa saber quem está logado)

`app/routes/landlord.py`:

```python
from app.core.security import verify_password, create_access_token, hash_password, get_current_user

@router.get("/me", response_model=SchemaLandlordResponse)
def me(cl=Depends(get_current_user)):
    return cl
```

Teste em `test_auth.py`:

```python
def test_me(auth_headers):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "roberto123@gmail.com"
```

### 3. Excluir imóvel/cliente com contrato vinculado dá 500 hoje

O `IntegrityError` não é tratado, e um 500 não passa pelo CORS (o navegador mostra só "falha de rede").
Em `routes/property.py`:

```python
from sqlalchemy.exc import IntegrityError
...
    delete_entity_notes(db, NoteEntityType.PROPERTY, id, cl.id)
    db.delete(db_property)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()  # desfaz também a exclusão das notas
        raise HTTPException(status_code=409, detail="Property has contracts or services linked to it")
    return
```

Em `routes/client.py` é igual, com `detail="Client has contracts linked to it"` (o `IntegrityError` já está importado lá).
O front já traduz as duas mensagens.

Teste em `test_contract.py`:

```python
def test_delete_property_with_contract_returns_409(auth_headers, created_property, created_client):
    client.post("/contract/register", json=contract_payload(created_property["id"], created_client["id"]), headers=auth_headers)
    response = client.delete(f"/property/delete/{created_property['id']}", headers=auth_headers)
    assert response.status_code == 409
```

### Bug encontrado (corrija também)

`update_service_by_put` recebe `property_id` mas nunca o atualiza nem valida. Antes de `db_service.name = ...`:

```python
query_p = select(Property).where(and_(Property.id == service.property_id, Property.landlord_id == cl.id))
if db.execute(query_p).scalar_one_or_none() is None:
    raise HTTPException(status_code=404, detail="not exist this property id")
db_service.property_id = service.property_id
```

---

## Como o front está organizado

| Arquivo | O que faz |
|---|---|
| `lib/api.ts` | único ponto que chama a API: JWT no header, erros em pt-BR, tipos |
| `lib/auth.tsx` | login, cadastro, logout, usuário atual |
| `lib/dashboard.ts` | carrega os dados e calcula dashboard, atividade e financeiro |
| `lib/format.ts` | máscaras (CPF, CEP, telefone, R$) e formatação de datas |
| `components/login-screen.tsx` | tela de login/cadastro |
| `components/resources.tsx` | Imóveis, Clientes, Contratos, Serviços e Notas, todos a partir de uma configuração por recurso |
| `components/management-pages.tsx` | roteia as páginas; Relatórios e Configurações |
| `app/page.tsx` | shell do dashboard e navegação |

Para adicionar um campo (por exemplo, `observacao` em Imóvel): migração Alembic + schema + model no backend, depois um item em `fields`, `toForm` e `toPayload` do recurso em `resources.tsx`.

## O que é calculado (não há dados de exemplo)

O backend só guarda a data de criação (`created_at`) e o valor dos registros, sem histórico de eventos nem pagamentos. Por isso:

- **Atividade recente e notificações:** são a mesma lista, montada pelas datas de criação de imóveis, clientes, contratos, serviços e notas. O contador do sino conta o que chegou depois da última vez que você o abriu (guardado no `localStorage` do navegador).
- **Visão financeira e Relatórios:** receita do mês = soma do valor mensal dos contratos (ativos, vencidos ou encerrados) que cobrem aquele mês; despesas = serviços (exceto cancelados) lançados no mês. Não existe "receita recebida", porque não há pagamentos.
- **Carregamento:** `lib/dashboard.ts` busca todos os registros (em páginas de 100) a cada troca de tela. Serve bem para estudo e carteiras pequenas; para milhares de registros, o ideal é criar rotas de resumo no backend.
- Configurações mostra nome e e-mail da conta, só leitura (não há rota de edição).
- Os selects de imóvel e cliente nos formulários carregam até 100 itens (limite do `limit` do backend).

## Formulários

- Máscaras automáticas (CPF, CEP, telefone, valores em R$). Na API vão só os dígitos.
- Campos extras (`extra_data`) viram inputs: o imóvel mostra campos conforme o tipo (apartamento, casa, sala comercial, galpão) e o contrato tem a seção "Opções avançadas" (caução, IPTU, condomínio, taxa de administração, dia de vencimento, índice de reajuste). Serviço não tem `extra_data` no backend.

## Antes de publicar

- CORS está `allow_origins=["*"]` em `main.py`. Em produção, restrinja ao domínio do front.
- O token fica em `localStorage` (ok para estudo, mas fica exposto se houver XSS). Em produção, prefira cookie `httpOnly`.
- Removi o `ignoreBuildErrors` do `next.config.mjs` (o v0 deixa ligado e esconde erros de TypeScript). O projeto compila limpo com `next build`.
- A landing page é outro projeto: aponte os botões "Entrar" e "Começar agora" para a URL deste app depois do deploy.
