# 🔧 Como Restaurar a Integração do Banco de Dados

## 🔍 O Problema

Quando você executou o SQL para limpar os dados no Supabase SQL Editor, algumas estruturas importantes foram removidas:

1. ❌ **Bucket de Storage "logos"** - Necessário para upload de logos
2. ❌ **Policies de Storage** - Permissões para acessar os logos
3. ⚠️ **Possivelmente algumas colunas da tabela profiles**

## ✅ A Solução

Execute o arquivo `restore-database.sql` no Supabase SQL Editor. Ele vai:

### 1. Recriar o Bucket de Logos
- Bucket público para armazenar logos dos organizadores
- Limite de 5MB por arquivo
- Aceita: JPEG, PNG, WebP, GIF

### 2. Recriar as Policies de Storage
- **Upload**: Apenas usuários autenticados podem fazer upload na própria pasta
- **Leitura**: Público pode visualizar logos
- **Update/Delete**: Apenas o dono pode modificar/deletar seus logos

### 3. Garantir que Todas as Colunas Existem
- `social_media_links` (jsonb) - Redes Sociais
- `payment_integrations_config` (jsonb) - Métodos de Pagamento
- `primary_color` (text) - Cor principal
- `theme` (text) - Tema (claro, escuro, escuro-preto)
- `logo_url` (text) - URL da logo
- `color_mode` (text) - Modo de cor (solid, gradient)
- `gradient_classes` (text) - Classes do gradiente
- `custom_gradient_colors` (text) - Cores customizadas

### 4. Criar Índices para Performance
- Índices GIN para busca em campos JSONB
- Índices para otimizar consultas de personalização

### 5. Adicionar Constraints de Validação
- Validar valores de `color_mode`: 'solid' ou 'gradient'
- Validar valores de `theme`: 'claro', 'escuro', 'escuro-preto'

## 📋 Passo a Passo

1. **Acesse o Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/byymchepurnfawqlrcxh/editor/sql
   ```

2. **Copie o conteúdo do arquivo**
   ```bash
   cat restore-database.sql
   ```

3. **Cole no SQL Editor e Execute**
   - Clique em "New Query"
   - Cole todo o conteúdo
   - Clique em "Run" ou pressione Ctrl+Enter

4. **Verifique se funcionou**
   ```bash
   node test-payment-integration.mjs
   ```

   Você deve ver:
   ```
   ✅ As colunas existem no banco de dados!
   ✅ Bucket "logos" encontrado!
   ```

## 🎯 Páginas que Voltarão a Funcionar

Após executar o script, estas páginas estarão totalmente integradas:

1. ✅ **Métodos de Pagamento** - Salvar/carregar configurações de Fluxsis, Pay2m, Paggue, Efi Bank
2. ✅ **Redes Sociais** - Salvar/carregar links de redes sociais
3. ✅ **Personalização** - Salvar cores, temas, logos e domínios
4. ✅ **Minha Conta** - Salvar/carregar dados pessoais

## ⚠️ IMPORTANTE

**Não execute novamente comandos de limpeza que deletem:**
- Buckets do storage (`DELETE FROM storage.buckets`)
- Policies do storage (`DROP POLICY`)
- Colunas da tabela profiles (`ALTER TABLE profiles DROP COLUMN`)

Se precisar limpar dados de usuários, use:
```sql
-- Limpar apenas os DADOS, não a estrutura
DELETE FROM profiles WHERE id NOT IN (SELECT id FROM auth.users);
DELETE FROM campaigns WHERE user_id NOT IN (SELECT id FROM auth.users);
-- etc...
```

## 🆘 Suporte

Se após executar o script ainda houver problemas:

1. Verifique os logs do Supabase
2. Execute novamente o script (é seguro executar múltiplas vezes)
3. Verifique se você tem permissões de admin no projeto Supabase
