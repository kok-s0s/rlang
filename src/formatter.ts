// formatter.ts

export function formatRLang(code: string): string {
  const lines = code.split('\n');
  const formatted: string[] = [];
  let indentLevel = 0;
  let blankLineCount = 0;
  let extraIndentAfterLabel = false; // 新增：处理 label 后缩进

  const increaseKeywords = ['GLOBAL PROC', 'IF', 'WHILE', 'if', 'while'];
  const decreaseKeywords = ['ENDPROC', 'ENDIF', 'ENDWHILE', 'endif', 'endwhile'];
  const sameLevelKeywords = ['ELSE', 'ELSE IF', 'else', 'else if'];

  for (let rawLine of lines) {
    const trimmedLine = rawLine.trim();
    const upper = trimmedLine.toUpperCase();

    // 空行处理
    if (trimmedLine === '') {
      blankLineCount++;
      if (blankLineCount <= 1) {
        formatted.push('');
      }
      extraIndentAfterLabel = false; // 空行终止 label 块
      continue;
    } else {
      blankLineCount = 0;
    }

    // 检查是否为 label 行（例如 endL:;）
    const isLabelLine = /^[A-Za-z_]\w*:\s*;?$/.test(trimmedLine);
    if (isLabelLine) {
      const labelIndent = '    '.repeat(indentLevel);  // 当前缩进层级
      formatted.push(labelIndent + trimmedLine);
      extraIndentAfterLabel = true;  // 启用 label 后额外缩进
      continue;
    }

    // 减少缩进
    if (decreaseKeywords.some(k => upper.startsWith(k))) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // 同级结构判断（如 else）
    const isSameLevel = sameLevelKeywords.some(k => upper.startsWith(k));
    let effectiveIndent = Math.max(0, isSameLevel ? indentLevel - 1 : indentLevel);

    // 如果处于 label 块之后，增加一级缩进
    if (extraIndentAfterLabel) {
      effectiveIndent += 1;

      // 如果当前行是控制结构，结束 label 缩进（如 IF WHILE）
      if (increaseKeywords.some(k => upper.startsWith(k)) || decreaseKeywords.some(k => upper.startsWith(k))) {
        extraIndentAfterLabel = false;
      }
    }

    const indent = '    '.repeat(effectiveIndent);
    let content = trimmedLine;

    // 注释处理
    const commentIndex = content.indexOf('//');
    let comment = '';
    if (commentIndex === 0) {
      comment = content.slice(2).trim();
      content = '// ' + comment;
      formatted.push(indent + content);
      continue;
    } else if (commentIndex > 0) {
      comment = content.slice(commentIndex);
      content = content.slice(0, commentIndex).trimEnd();
    }

    // 关键字后加空格
    const keywordPattern = /^(IF|WHILE|ELSE IF|ELSE|if|while|else if|else)(\()/i;
    content = content.replace(keywordPattern, (match, kw, paren) => {
      return kw + ' ' + paren;
    });

    // 参数空格格式化
    content = content.replace(/\b([A-Za-z_]\w*)\s*\(([^()"]*)\)/g, (match, fnName, args) => {
      const formattedArgs = args
        .split(',')
        .map((arg: string) => arg.trim())
        .join(', ');
      return `${fnName}(${formattedArgs})`;
    });

    // 运算符空格格式化
    content = content.replace(
      /([^\s])(\+|\-|\*|\/|==|!=|<=|>=|<|>|=|&&|\|\|)([^\s])/g,
      (_, left, op, right) => `${left} ${op} ${right}`
    );

    // 去除函数调用后多余空格的分号
    content = content.replace(/\)\s+;/g, ");");

    // 恢复注释
    if (comment) {
      content += ' ' + comment.replace(/^\/\/\s*/, '// ');
    }

    formatted.push(indent + content);

    // 增加缩进
    if (increaseKeywords.some(k => upper.startsWith(k))) {
      indentLevel++;
    }
  }

  // 删除结尾多余空行
  while (formatted.length > 0 && formatted[formatted.length - 1] === '') {
    formatted.pop();
  }

  return formatted.join('\n');
}
