// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { exec } from "child_process"

const macrodecortype = vscode.window.createTextEditorDecorationType({
	color: new vscode.ThemeColor("debugTokenExpression.name")
})

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "asm" is now active!')

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	type asmmacro = {
		params: string[]
		body: string
		line: [number, number]
	}
	//                      filename  macro name  macro info
	const asmmacros = new Map<string, Map<string, asmmacro>>()
	const diagnosticcollection = vscode.languages.createDiagnosticCollection()
	const disposable = vscode.workspace.onDidSaveTextDocument(document => {

		const diagnostics: vscode.Diagnostic[] = []
		const filepath = document.fileName
		asmmacros.set(filepath, new Map<string, asmmacro>())
		if (!(
			filepath.endsWith(".s") || 
			filepath.endsWith(".S") || 
			filepath.endsWith(".asm")
		)) return

		const filecontents = document.getText().split("\n").map(stripcomment)
		for (const i in filecontents) {
			let macroend = -1
			const [keyword, macroname, ...params] = filecontents[i].split(/\s+/)
			if (keyword != ".macro") continue
			for (let j = +i; j < filecontents.length; j++) {
				const keyword = filecontents[j].split(/\s+/)[0]
				if (keyword != ".endm" && keyword != ".endmacro") continue
				macroend = j
				break
			}
			const macroinfo: asmmacro = {
				params,
				body: filecontents.slice(+i,macroend).join("\n"),
				line: [+i, macroend]
			}
			asmmacros.get(document.fileName)?.set(macroname, macroinfo)
		}

		const macrostohighlight: vscode.Range[] = []

		for (const i in filecontents) {
			const names = asmmacros.get(filepath)?.keys()
			if (!names) continue
			for (const name of names) {
				const regex = new RegExp(`\\b${name}\\b`, "g")
				let match
				vscode.window.showInformationMessage(name)
				while ((match = regex.exec(filecontents[i])) !== null) {
						const startPos = new vscode.Position(+i, match.index)
						const endPos = new vscode.Position(+i, match.index + name.length)
						macrostohighlight.push(new vscode.Range(startPos, endPos))
				}
			}
		}
		vscode.window.activeTextEditor?.setDecorations(macrodecortype, macrostohighlight)

		exec(`gcc -Wall -Wextra -fsyntax-only "${filepath}"`, (_err, _stdout, stderr) => {
			for (const line of stderr.split("\n")) {
				// vscode.window.showInformationMessage(line)
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

/**
 * Completely AI Generated function.
 * @param line The lines to remove comments from.
 * @returns The line with comments removed.
 */
export function stripcomment(line: string) {
  let instring = false
  let stringchar = ""
  let escaped = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]

    // escape handling
    if (c == "\\" && !escaped) {
      escaped = true
      continue
    }

    // string close
    if (instring && c == stringchar && !escaped) {
      instring = false
      continue
    }

    // string open
    if (!instring && (c == "'" || c == '"')) {
      instring = true
      stringchar = c
      continue
    }

    // comment start (GAS-style)
    if (!instring && c == "#")
      return line.slice(0, i)   // strip comment

    escaped = false
  }

  return line
}
