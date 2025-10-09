#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to ignore (these are typically CSS classes, technical strings, etc.)
const IGNORE_PATTERNS = [
  // CSS classes and technical attributes
  /^[a-z-]+:[a-z-]+$/,  // CSS properties like "text-center"
  /^[a-z-]+ [a-z-]+$/,  // Multi-word CSS classes
  /^[a-z-]+\[[^\]]+\]$/, // CSS with brackets like "w-[100px]"
  /^[\w-]+\/[\w-]+$/,    // Paths like "icons/file-types/"
  /^[a-z]+(-[a-z]+)*$/,  // Kebab case like "bg-white", "text-center"
  /^[A-Z][a-zA-Z]*$/,    // PascalCase like component names
  /^[a-z]+[A-Z][a-zA-Z]*$/, // camelCase
  /^[0-9]+$/,            // Pure numbers
  /^[0-9]+[a-z]+$/,      // Numbers with units like "100px"
  /^[\s\-_=+\[\]{};:'",.<>/?|\\~`!@#$%^&*()\u00A0-\u9999]*$/, // Only symbols/punctuation
  /^(className|id|data-|aria-|style|role|type|method|target|rel|src|alt|href|to|path|initial|animate|exit)$/,
  // File extensions and technical terms
  /\.(jpg|jpeg|png|gif|svg|mp4|webm|pdf|doc|docx)$/i,
  // CSS values
  /^(auto|none|inherit|initial|unset|flex|grid|block|inline|absolute|relative|fixed|static|sticky)$/,
  // Common short technical strings
  /^(×|•|‹|›|✓|⚠|🔍|📝|🖼️|ⓘ)$/,
  // URLs and paths
  /^(https?:\/\/|\/|\.\/|\.\.\/).*$/,
  // Placeholder text patterns
  /^(Loading|Error|Failed|Upload|Drag|Scroll|Complete|Auto)$/i,
];

// Check if a string should be ignored
function shouldIgnoreString(str) {
  if (!str || str.trim().length === 0) return true;
  if (str.trim().length < 2) return true;
  
  const trimmed = str.trim();
  
  // Check against ignore patterns
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  
  // Ignore if it's mostly CSS-like (contains lots of hyphens and spaces)
  if (trimmed.includes(' ') && trimmed.split(' ').every(word => 
    /^[a-z-]+(\[[^\]]*\])?$/.test(word) || /^[0-9]+[a-z]*$/.test(word)
  )) {
    return true;
  }
  
  return false;
}

// Process a single file
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if file already imports useTranslation
  const hasUseTranslation = content.includes('useTranslation');
  
  // Add import if needed
  if (!hasUseTranslation && content.includes('import React')) {
    content = content.replace(
      /import React[^;]*;/,
      `$&\nimport { useTranslation } from 'react-i18next';`
    );
    modified = true;
  }
  
  // Add useTranslation hook if needed
  if (!hasUseTranslation && /const \w+ = \([^)]*\) => \{/.test(content)) {
    content = content.replace(
      /(const \w+ = \([^)]*\) => \{)/,
      `$1\n  const { t } = useTranslation();`
    );
    modified = true;
  }
  
  // Replace JSX text content: <div>Text</div> -> <div>{t("Text")}</div>
  content = content.replace(
    />([^<>{]+)</g,
    (match, text) => {
      const trimmed = text.trim();
      if (shouldIgnoreString(trimmed)) {
        return match;
      }
      modified = true;
      return `>{t("${trimmed.replace(/"/g, '\\"')}")}<`;
    }
  );
  
  // Replace JSX expression strings: <div>{"Text"}</div> -> <div>{t("Text")}</div>
  content = content.replace(
    />\{["']([^"']+)["']\}</g,
    (match, text) => {
      const trimmed = text.trim();
      if (shouldIgnoreString(trimmed)) {
        return match;
      }
      modified = true;
      return `>{t("${trimmed.replace(/"/g, '\\"')}")}<`;
    }
  );
  
  // Replace JSX expression template literals: <div>{`Text`}</div> -> <div>{t("Text")}</div>
  content = content.replace(
    />\{`([^`]+)`\}</g,
    (match, text) => {
      const trimmed = text.trim();
      if (shouldIgnoreString(trimmed) || text.includes('${')) {
        return match; // Skip if it has interpolation
      }
      modified = true;
      return `>{t("${trimmed.replace(/"/g, '\\"')}")}<`;
    }
  );
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Modified: ${filePath}`);
    return true;
  }
  
  return false;
}

// Get all TSX/JSX files with errors from ESLint
function getFilesWithErrors() {
  try {
    const eslintOutput = execSync(
      'npx eslint "src/**/*.{tsx,jsx}" --format json',
      { encoding: 'utf8', cwd: process.cwd() }
    );
    
    const results = JSON.parse(eslintOutput);
    const filesWithErrors = new Set();
    
    results.forEach(result => {
      const hasLiteralErrors = result.messages.some(msg => 
        msg.ruleId === 'local/no-jsx-literal-text'
      );
      if (hasLiteralErrors) {
        filesWithErrors.add(result.filePath);
      }
    });
    
    return Array.from(filesWithErrors);
  } catch (error) {
    console.error('Error running ESLint:', error.message);
    return [];
  }
}

// Main function
function main() {
  console.log('🚀 Starting auto-translation process...\n');
  
  const files = getFilesWithErrors();
  
  if (files.length === 0) {
    console.log('✨ No files with literal text errors found!');
    return;
  }
  
  console.log(`Found ${files.length} files with literal text errors:\n`);
  
  let processedCount = 0;
  
  files.forEach(file => {
    if (processFile(file)) {
      processedCount++;
    }
  });
  
  console.log(`\n🎉 Processed ${processedCount} files successfully!`);
  console.log('\n📝 Next steps:');
  console.log('1. Review the changes');
  console.log('2. Run ESLint again to check remaining errors');
  console.log('3. Manually fix any remaining complex cases');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, shouldIgnoreString };
