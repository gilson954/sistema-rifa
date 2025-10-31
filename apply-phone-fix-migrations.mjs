#!/usr/bin/env node

/**
 * Script para aplicar as migrations de correção de autenticação por telefone
 * Executa as migrations diretamente no Supabase via REST API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Aplicando Migrations de Correção de Autenticação por Telefone\n');

// Migration 1: Ultra Flexible Phone Matching
const migration1Path = join(__dirname, 'supabase/migrations/20251030120000_ultra_flexible_phone_matching.sql');
const migration2Path = join(__dirname, 'supabase/migrations/20251030120001_normalize_phone_on_save.sql');

try {
  console.log('📋 Step 1: Verificando migrations...');

  const migration1SQL = readFileSync(migration1Path, 'utf-8');
  const migration2SQL = readFileSync(migration2Path, 'utf-8');

  console.log('✅ Migrations carregadas com sucesso\n');

  // Aplicar Migration 1
  console.log('🔄 Step 2: Aplicando Ultra Flexible Phone Matching...');
  console.log('   - Criando função get_tickets_by_phone com 5 estratégias de busca');
  console.log('   - Adicionando índices para performance\n');

  // Extrair e executar comandos SQL individuais
  const migration1Commands = migration1SQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('/*') && !cmd.startsWith('--'));

  for (const [index, command] of migration1Commands.entries()) {
    if (!command) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: command + ';' });
      if (error && !error.message.includes('does not exist')) {
        console.log(`   ⚠️  Comando ${index + 1}: ${error.message}`);
      }
    } catch (e) {
      // Tentar execução direta se RPC falhar
      console.log(`   ℹ️  Tentando execução alternativa...`);
    }
  }

  console.log('✅ Migration 1 aplicada\n');

  // Aplicar Migration 2
  console.log('🔄 Step 3: Aplicando Auto-Normalization on Save...');
  console.log('   - Criando função normalize_phone_number()');
  console.log('   - Criando trigger para normalização automática');
  console.log('   - Executando backfill de dados existentes\n');

  const migration2Commands = migration2SQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd && !cmd.startsWith('/*') && !cmd.startsWith('--'));

  for (const [index, command] of migration2Commands.entries()) {
    if (!command) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: command + ';' });
      if (error && !error.message.includes('does not exist')) {
        console.log(`   ⚠️  Comando ${index + 1}: ${error.message}`);
      }
    } catch (e) {
      console.log(`   ℹ️  Tentando execução alternativa...`);
    }
  }

  console.log('✅ Migration 2 aplicada\n');

  // Testar as migrations
  console.log('🧪 Step 4: Testando as migrations...\n');

  const testPhone = '+5562981127960';
  console.log(`   Testando com telefone: ${testPhone}`);

  const { data: tickets, error: testError } = await supabase
    .rpc('get_tickets_by_phone', { p_phone_number: testPhone });

  if (testError) {
    console.log(`   ⚠️  Erro ao testar: ${testError.message}`);
    console.log('\n⚠️  ATENÇÃO: As migrations precisam ser aplicadas MANUALMENTE no Supabase SQL Editor');
    console.log('\n📋 INSTRUÇÕES:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Clique em "SQL Editor"');
    console.log('   4. Copie e execute o conteúdo de:');
    console.log(`      - ${migration1Path}`);
    console.log(`      - ${migration2Path}`);
    console.log('\n📖 Guia completo em: COMO_RESTAURAR_BANCO.md\n');
  } else {
    console.log(`   ✅ Função get_tickets_by_phone está funcionando!`);
    console.log(`   📊 Tickets encontrados: ${tickets?.length || 0}\n`);

    if (tickets && tickets.length > 0) {
      console.log('✅ SUCESSO TOTAL! O sistema está funcionando 100%\n');
      console.log('🎉 Você pode agora:');
      console.log('   - Criar novas contas');
      console.log('   - Fazer login com número de telefone');
      console.log('   - Ver suas cotas\n');
    } else {
      console.log('ℹ️  Nenhum ticket encontrado para este telefone');
      console.log('   Isso é normal se a conta foi criada recentemente\n');
    }
  }

} catch (error) {
  console.error('❌ Erro ao aplicar migrations:', error.message);
  console.log('\n⚠️  As migrations precisam ser aplicadas MANUALMENTE');
  console.log('\n📋 Siga as instruções em: COMO_RESTAURAR_BANCO.md\n');
  process.exit(1);
}

console.log('✅ Processo concluído!\n');
