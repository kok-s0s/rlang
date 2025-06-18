// extension.ts

import * as vscode from 'vscode';
import { formatRLang } from './formatter';

export function activate(context: vscode.ExtensionContext) {
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
}
