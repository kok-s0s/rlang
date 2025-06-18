// formatter.ts

export function formatRLang(code: string): string {
  const lines = code.split('\n');
  const formatted: string[] = [];
  let indentLevel = 0;

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed === '}') indentLevel--;

    const indent = '  '.repeat(indentLevel); // 两空格缩进
    formatted.push(indent + trimmed);

    if (trimmed.endsWith('{')) indentLevel++;
  }

  return formatted.join('\n');
}
