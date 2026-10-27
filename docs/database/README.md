# Banco de dados do Manancial — correção controlada pelo GitHub

## Por que esta revisão existe?

A pasta `src/integrations/supabase/client.ts` usa `VITE_SUPABASE_URL` e
`VITE_SUPABASE_PUBLISHABLE_KEY` no PWA. No commit auditado, a URL do frontend
aponta para o projeto `upapaxjemwupxflchcok` (Lovable Cloud). Uma variável de
servidor e o antigo cabeçalho CSP referenciavam
`zlefskputrqptsatndtc`, um projeto distinto.

**Não reaponte o PWA sem identificar e migrar os dados corretos.**
GitHub não é, por si só, a ferramenta de execução de SQL no Lovable Cloud.
Publicar frontend não executa automaticamente `docs/database/keepalive.sql`.

## Preparação segura para publicar

1. Confira em ambiente de produção o **Project Ref** do banco realmente
   utilizado pelo PWA instalado. Confirme contas, escalas e armazenamento.
2. Faça backup do banco e das mídias no **projeto correto** antes de qualquer
   ajuste de segurança, migração ou mudança de URL.
3. Aplique `docs/database/keepalive.sql` somente no banco alvo aprovado.
   O SQL é idempotente e expõe à chave anônima apenas `public.keepalive`.
4. No GitHub, rode **Actions > Manancial - atividade e disponibilidade do banco
   > Run workflow** e confira uma resposta HTTP 200. O workflow usa, por padrão,
   a URL e chave publicável `VITE_*` de `.env`, atualmente o frontend Lovable
   Cloud. Para outro projeto, configure **ambos** os secrets de repositório
   `MANANCIAL_SUPABASE_URL` e `MANANCIAL_SUPABASE_PUBLISHABLE_KEY`.
   Nunca configure `service_role` nem `sb_secret_` no monitoramento.
5. Confira os testes no Pull Request, incorpore na `main` e só então
   publique a versão do PWA pelo seu processo atual.
6. Acompanhe falhas do GitHub Actions e os avisos por e-mail do Supabase.

## Limitações importantes

- O Supabase Free pode pausar projetos após 7 dias de baixa atividade. Leituras
  reais periódicas ajudam, mas não garantem imunidade à pausa. Supabase Pro é a
  solução oficial sem suspensão automática por inatividade.
- No GitHub público, workflows agendados são desativados após 60 dias de
  inatividade do repositório, mesmo que o banco tenha recebido consultas.
  Configure monitoramento alternativo se depender de disponibilidade contínua.
- O projeto `upapaxjemwupxflchcok` não foi acessível pelo conector Supabase
  durante a auditoria de 27/10/2026; não foi possível confirmar sua estrutura.
- O projeto `zlefskputrqptsatndtc` estava ativo e já possuía
  `public.keepalive`; **não** interprete isso como prova de que é o banco do PWA.

## Pendências de segurança antes de mudanças estruturais

- Auditar RLS no projeto efetivamente usado e evitar políticas com
  `USING (true)` para escrita de dados sensíveis.
- Inspecionar permissões de execução em `SECURITY DEFINER`.
- Conferir acessos às fotos de solicitações em `access-requests`.
- Revisar perfis desativados e registros órfãos sem apagá-los automaticamente.
- Validar o login de administradoras/ministras e o cadastro antes de publicar.

Referências:
- https://supabase.com/docs/guides/platform/free-project-pausing
- https://docs.github.com/en/actions/reference/events-that-trigger-workflows#schedule
