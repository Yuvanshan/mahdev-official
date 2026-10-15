import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function verifyFirestoreDenyAllPolicy(): {
  total: number;
  passed: number;
  failed: number;
  results: Array<{ passed: boolean; reason: string }>;
} {
  const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
  const allowStatements = [...rules.matchAll(/\ballow\s+[^;]+;/g)].map(([statement]) =>
    statement.replace(/\s+/g, ' ').trim()
  );
  const hasDenyAllMatch = /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;\s*\}/s.test(rules);
  const hasPublicAllow = allowStatements.some((statement) => /\bif\s+true\s*;/i.test(statement));
  const passed = hasDenyAllMatch && !hasPublicAllow && allowStatements.length === 1;

  return {
    total: 1,
    passed: passed ? 1 : 0,
    failed: passed ? 0 : 1,
    results: [{
      passed,
      reason: passed
        ? 'Firestore direct client reads and writes are denied.'
        : `Expected a deny-all policy; found allow statements: ${allowStatements.join(' | ') || 'none'}`,
    }],
  };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const summary = verifyFirestoreDenyAllPolicy();
  console.log('Checking production Firestore access policy...');
  console.log(summary.results[0].passed ? `✅ ${summary.results[0].reason}` : `❌ ${summary.results[0].reason}`);
  if (summary.failed) process.exitCode = 1;
}
