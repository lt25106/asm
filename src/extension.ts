// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { exec } from "child_process"

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "asm" is now active!')

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const diagnosticcollection = vscode.languages.createDiagnosticCollection()
	const disposable = vscode.workspace.onDidSaveTextDocument(document => {
		// exec('gcc --version', (err, stdout, stderr) => {
		// 	if (err) vscode.window.showErrorMessage(`GCC not found: ${err.message}`);
		// 	else vscode.window.showInformationMessage(`GCC found: ${stdout.split('\n')[0]}`);
		// });

		const diagnostics: vscode.Diagnostic[] = []
		const filepath = document.fileName
		if (!(
			filepath.endsWith(".s") || 
			filepath.endsWith(".S") || 
			filepath.endsWith(".asm")
		)) return
		exec(`gcc -Wall -Wextra -fsyntax-only "${filepath}"`, (_err, _stdout, stderr) => {
			for (const line of stderr.split("\n")) {
				const match = line.match(/(.*):(\d+): (error|warning): (.+)/i)
				if (!match) continue
				const [_full, _filename, linenum, severity, msg] = match
				// vscode.window.showInformationMessage(severity)
				diagnostics.push(new vscode.Diagnostic(
					document.lineAt(parseInt(linenum) - 1).range,
					msg,
					severity.toLowerCase() == "error" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
				))
			}

			diagnosticcollection.set(document.uri, diagnostics)
		})
	})
	context.subscriptions.push(disposable)
}

// This method is called when your extension is deactivated
export function deactivate() {}
