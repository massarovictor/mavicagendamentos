#!/usr/bin/env node

/**
 * Script para remover console.log, console.error, console.warn do código
 * Mantém apenas páginas de debug/teste que precisam dos logs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivos que podem manter console.log (debug/teste)
const ALLOWED_FILES = [
  'src/pages/Debug.tsx',
  'src/pages/TesteNotificacaoCompleto.tsx',
  'src/utils/logger.ts',
  'scripts/remove-console-logs.js'
];

// Padrões a serem removidos
const CONSOLE_PATTERNS = [
  /console\.log\([^)]*\);?\s*\n?/g,
  /console\.error\([^)]*\);?\s*\n?/g,
  /console\.warn\([^)]*\);?\s*\n?/g,
  /console\.info\([^)]*\);?\s*\n?/g,
  /console\.debug\([^)]*\);?\s*\n?/g
];

function shouldProcessFile(filePath) {
  // Verificar se é arquivo TypeScript ou JavaScript
  if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    return false;
  }

  // Verificar se não está na lista de arquivos permitidos
  const relativePath = path.relative(process.cwd(), filePath);
  return !ALLOWED_FILES.some(allowed => relativePath.includes(allowed));
}

function removeConsoleLogs(content) {
  let modified = content;
  let hasChanges = false;

  CONSOLE_PATTERNS.forEach(pattern => {
    const newContent = modified.replace(pattern, '');
    if (newContent !== modified) {
      hasChanges = true;
      modified = newContent;
    }
  });

  return { content: modified, hasChanges };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, hasChanges } = removeConsoleLogs(content);

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Removidos console.log de: ${path.relative(process.cwd(), filePath)}`);
      return 1;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dirPath) {
  let filesModified = 0;

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Pular node_modules, .git, dist, build
        if (['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          continue;
        }
        filesModified += processDirectory(fullPath);
      } else if (shouldProcessFile(fullPath)) {
        filesModified += processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dirPath}:`, error.message);
  }

  return filesModified;
}

function main() {
  console.log('🧹 Iniciando remoção de console.log...\n');

  const srcPath = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Diretório src/ não encontrado');
    process.exit(1);
  }

  const filesModified = processDirectory(srcPath);

  console.log(`\n📊 Resultado:`);
  console.log(`   - Arquivos modificados: ${filesModified}`);
  console.log(`   - Arquivos preservados: ${ALLOWED_FILES.length}`);
  
  if (filesModified > 0) {
    console.log('\n✅ Console.log removidos com sucesso!');
    console.log('⚠️  Lembre-se de testar a aplicação após as mudanças.');
  } else {
    console.log('\n✨ Nenhum console.log encontrado para remoção.');
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { removeConsoleLogs, processFile }; 