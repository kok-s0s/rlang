// extension.ts

import * as vscode from 'vscode';
import { formatRLang } from './formatter';

interface CustomVar {
  name: string;
  color?: string;
}

// 保存所有装饰器，方便清理
const decoratorTypes = new Map<vscode.TextEditorDecorationType, vscode.TextEditorDecorationType>();

export function activate(context: vscode.ExtensionContext) {
  // 1. 注册格式化器
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider('rlang', {
      provideDocumentFormattingEdits(document) {
        const text = document.getText();
        const formatted = formatRLang(text);
        const start = new vscode.Position(0, 0);
        const end = document.lineAt(document.lineCount - 1).range.end;
        const range = new vscode.Range(start, end);

        return [vscode.TextEdit.replace(range, formatted)];
      }
    })
  );

  // 2. 首次注册并装饰自定义变量
  updateCustomVariableDecorations();

  // 3. 监听配置变化，重新装饰
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('rlang.customHighlightedVariables')) {
        updateCustomVariableDecorations();
      }
    })
  );

  // 4. 监听编辑器切换，重新装饰
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      updateCustomVariableDecorations();
    })
  );

  // 5. 监听文本变化，重新装饰（可选，性能可以再优化）
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => {
      updateCustomVariableDecorations();
    })
  );
}

function updateCustomVariableDecorations() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  // 清理之前装饰
  for (const decoType of decoratorTypes.values()) {
    editor.setDecorations(decoType, []);
    decoType.dispose();
  }
  decoratorTypes.clear();

  const config = vscode.workspace.getConfiguration();
  const customVars: CustomVar[] = config.get('rlang.customHighlightedVariables') || [];

  if (customVars.length === 0) return;

  const doc = editor.document;
  const text = doc.getText();

  // 颜色到装饰器缓存，避免重复创建
  const decorationMap = new Map<string, vscode.TextEditorDecorationType>();

  // 遍历变量，查找文本中的所有出现位置
  for (const v of customVars) {
    if (!v.name) continue;
    const ranges: vscode.Range[] = [];

    let idx = 0;
    while ((idx = text.indexOf(v.name, idx)) !== -1) {
      // 前后边界检查，避免部分匹配（例如 foo 匹配到 foobar）
      const beforeChar = idx > 0 ? text[idx - 1] : null;
      const afterChar = idx + v.name.length < text.length ? text[idx + v.name.length] : null;
      if ((beforeChar === null || !/\w/.test(beforeChar)) &&
        (afterChar === null || !/\w/.test(afterChar))) {
        const startPos = doc.positionAt(idx);
        const endPos = doc.positionAt(idx + v.name.length);
        ranges.push(new vscode.Range(startPos, endPos));
      }
      idx += v.name.length;
    }

    if (ranges.length === 0) continue;

    const color = v.color || undefined;

    let decoType: vscode.TextEditorDecorationType;
    if (color) {
      if (decorationMap.has(color)) {
        decoType = decorationMap.get(color)!;
      } else {
        decoType = vscode.window.createTextEditorDecorationType({
          color: color
        });
        decorationMap.set(color, decoType);
      }
    } else {
      // 没指定颜色，默认不创建装饰器（用语法默认颜色）
      continue;
    }

    editor.setDecorations(decoType, ranges);
    decoratorTypes.set(decoType, decoType);
  }
}
