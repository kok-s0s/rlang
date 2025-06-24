import * as vscode from 'vscode';

export class RLangDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];

        let currentFunc: vscode.DocumentSymbol | null = null;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text.trim();

            // 1. 函数定义
            const funcMatch = text.match(/^GLOBAL\s+PROC\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/i);
            if (funcMatch) {
                const funcName = funcMatch[1];
                currentFunc = new vscode.DocumentSymbol(
                    funcName,
                    'Procedure',
                    vscode.SymbolKind.Function,
                    line.range,
                    line.range
                );
                symbols.push(currentFunc);
                continue;
            }

            // 2. 标签识别
            const labelMatch = text.match(/^([A-Za-z_][A-Za-z0-9_]*):$/);
            if (labelMatch && currentFunc) {
                const labelName = labelMatch[1];
                const labelSymbol = new vscode.DocumentSymbol(
                    labelName,
                    'Label',
                    vscode.SymbolKind.Key,
                    line.range,
                    line.range
                );
                currentFunc.children.push(labelSymbol);
                continue;
            }

            // 3. 变量赋值（未声明类型） → 判定为“全局变量”
            const assignMatch = text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*[^=]+;/);
            if (assignMatch && currentFunc) {
                const varName = assignMatch[1];

                // 忽略函数参数、MoveL()调用等内部变量
                const lineIsFunctionCall = /\w+\s*\(.*\)/.test(text);
                if (!lineIsFunctionCall) {
                    const varSymbol = new vscode.DocumentSymbol(
                        varName,
                        'Global Variable',
                        vscode.SymbolKind.Variable,
                        line.range,
                        line.range
                    );
                    currentFunc.children.push(varSymbol);
                }
            }

            // 4. 函数结束
            if (/^ENDPROC/i.test(text)) {
                currentFunc = null;
            }
        }

        return symbols;
    }
}
