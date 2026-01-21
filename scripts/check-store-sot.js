#!/usr/bin/env node
/**
 * SoT (Single Source of Truth) ガードレール
 * 
 * 禁止パスにストアファイルが追加されていないかチェックする。
 * 状態管理は lib/store.ts に統一する。
 * 
 * 使い方: node scripts/check-store-sot.js
 * CI: npm run check:store
 */

const fs = require('fs');
const path = require('path');

// 許可されたストアファイルの場所
const ALLOWED_STORE_PATHS = [
  'lib/store.ts',
];

// 禁止パターン（これらのパスにstoreファイルがあればFAIL）
const FORBIDDEN_PATTERNS = [
  /^app\/.*store.*\.ts$/,
  /^app\/.*Store.*\.ts$/,
  /^components\/.*store.*\.ts$/,
  /^features\/.*store.*\.ts$/,
  /^pages\/.*store.*\.ts$/,
];

// zustand importを含むファイルを検出するパターン
const ZUSTAND_IMPORT_PATTERN = /import\s+.*\s+from\s+['"]zustand['"]/;

function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', '.git', 'scripts'].includes(item)) {
        getAllFiles(fullPath, files);
      }
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFile(filePath) {
  const relativePath = filePath.replace(/\\/g, '/');
  
  // 許可されたパスはスキップ
  if (ALLOWED_STORE_PATHS.some(p => relativePath.endsWith(p))) {
    return null;
  }
  
  // 禁止パターンにマッチするファイル名をチェック
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(relativePath)) {
      return `禁止パスにストアファイルが存在: ${relativePath}`;
    }
  }
  
  // zustand importを含むファイルをチェック（lib/store.ts以外）
  if (!relativePath.endsWith('lib/store.ts')) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (ZUSTAND_IMPORT_PATTERN.test(content) && content.includes('create(')) {
        return `zustand storeの新規作成を検出: ${relativePath}`;
      }
    } catch (e) {
      // ファイル読み込みエラーは無視
    }
  }
  
  return null;
}

function main() {
  console.log('SoT (Single Source of Truth) チェック開始...\n');
  
  const files = getAllFiles('.');
  const errors = [];
  
  for (const file of files) {
    const error = checkFile(file);
    if (error) {
      errors.push(error);
    }
  }
  
  if (errors.length > 0) {
    console.error('エラー: 状態管理の統一ルール違反が見つかりました\n');
    errors.forEach(e => console.error(`  - ${e}`));
    console.error('\n解決方法:');
    console.error('  1. 新しいストアは lib/store.ts に統合してください');
    console.error('  2. 各ページ/コンポーネントは useProfileStore から参照のみ行ってください');
    console.error('  3. 詳細は lib/store.ts のコメントを参照\n');
    process.exit(1);
  }
  
  console.log('OK: 状態管理は lib/store.ts に統一されています\n');
  console.log(`チェックしたファイル数: ${files.length}`);
  process.exit(0);
}

main();
