// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/// <reference types="./extension.d.ts" />
import * as vscode from 'vscode'
import { exec } from "child_process"
import { stripcomment, isWithinString } from "./functions"

const macrodecortype = vscode.window.createTextEditorDecorationType({
	color: "#dcdcaa",
})
const datadecortype = vscode.window.createTextEditorDecorationType({
	color: "#b5cea8",
})
const labeldecortype = vscode.window.createTextEditorDecorationType({
	color: "#c586c0"
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
	
	const asmmacros = new Map<string, Map<string, asmmacro>>()
	const asmdata = new Map<string, Map<string, datainfo>>()
	const diagnosticcollection = vscode.languages.createDiagnosticCollection()
	
	function main(document: vscode.TextDocument) {
		const diagnostics: vscode.Diagnostic[] = []
		const filepath = document.fileName
		asmmacros.set(filepath, new Map<string, asmmacro>())
		asmdata.set(filepath, new Map<string, datainfo>())
		
		if (!(
			filepath.endsWith(".s") || 
			filepath.endsWith(".S") || 
			filepath.endsWith(".asm")
		)) return
		
		const filecontents = document.getText().split("\n").map(stripcomment)
		
		// Parse macros - FIXED: Allow whitespace before .macro
		for (let i = 0; i < filecontents.length; i++) {
			const trimmedLine = filecontents[i].trim()
			if (trimmedLine.startsWith(".data"))
				for (let j = i + 1; !filecontents[j].startsWith("."); j++) {
				const match = filecontents[j].match(/^\s*([a-zA-Z_0-9]+):\s*(\.[a-z]+)\s+(.*)/i)
				if (!match) continue
				const [_, varname, type, value] = match
				// vscode.window.showInformationMessage(`${varname} | ${type} | ${value}`)
				const datainfo: datainfo = {
					body: filecontents[j],
					line: j,
					type,
					value,
				}
				asmdata.get(filepath)?.set(varname, datainfo)
			}
			
			if (!trimmedLine.startsWith('.macro')) continue
			
			const parts = trimmedLine.split(/\s+/)
			if (parts.length < 2) continue
			
			const macroname = parts[1]
			const params = parts.slice(2)
			
			let macroend = -1
			for (let j = i + 1; j < filecontents.length; j++) {
				const trimmed = filecontents[j].trim()
				if (trimmed == '.endm' || trimmed == '.endmacro') {
					macroend = j
					break
				}
			}
			
			if (macroend == -1) continue
			
			const macroinfo: asmmacro = {
				params,
				body: filecontents.slice(i, macroend + 1).join("\n"),
				line: [i, macroend]
			}
			asmmacros.get(filepath)?.set(macroname, macroinfo)
			
			// Skip to after the macro
			i = macroend
		}
		
		const macrotohighlight: vscode.Range[] = []
		const datatohighlight: vscode.Range[] = []
		const macroNames = Array.from(asmmacros.get(filepath)?.keys() || [])
		const variablenames = Array.from(asmdata.get(filepath)?.keys() || [])
		
		for (let i = 0; i < filecontents.length; i++) {			
			const line = filecontents[i]

			function loop(names: string[], highlightrange: vscode.Range[]) {
				for (const name of names) {
					const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
					const regex = new RegExp(`\\b${escapedName}\\b`, "g")
					let match
					while ((match = regex.exec(line)) !== null) {
						const startPos = new vscode.Position(i, match.index)
						const endPos = new vscode.Position(i, match.index + name.length)
						if (isWithinString(line, match.index)) continue
						highlightrange.push(new vscode.Range(startPos, endPos))
					}
				}
			}

			loop(variablenames, datatohighlight)
			loop(macroNames, macrotohighlight)
		}
		
		// FIXED: Apply decorations to all visible editors showing this document
		vscode.window.visibleTextEditors.forEach(editor => {
			if (editor.document.uri.toString() == document.uri.toString()) {
				// Clear existing decorations first
				editor.setDecorations(macrodecortype, [])
				editor.setDecorations(datadecortype, [])
				// Apply new decorations
				editor.setDecorations(macrodecortype, macrotohighlight)
				editor.setDecorations(datadecortype, datatohighlight)
			}
		})
		
		// Diagnostics part remains the same
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
	}

	const savedisposable = vscode.workspace.onDidSaveTextDocument(main)
	const opendisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (!editor) return
		main(editor.document)
	})
	const hoverProvider = vscode.languages.registerHoverProvider(
		// Target these languages
		[{ scheme: 'file', language: 'asm' }, { scheme: 'file', language: 's' }], 
		{
			provideHover(document, position) {
				// Get the word currently under the mouse
				const range = document.getWordRangeAtPosition(position)
				const word = document.getText(range)
				const filepath = document.fileName
				
				function hover<T extends asmmacro | datainfo>(
					list: Map<string, Map<string, T>>
				) {
					const filelist = list.get(filepath)
					if (!filelist || !filelist.has(word)) return
					const wordinfo = filelist.get(word)!
					const contents = new vscode.MarkdownString()
					contents.appendCodeblock(wordinfo.body.trim(), "asm")
					return new vscode.Hover(contents)
				}
				// for (const a of [asmdata, asmmacros]) {
				// 	const b = hover(a)
				// }
				const data = hover(asmdata)
				if (data) return data
				return hover(asmmacros)
			}
		}
	)
	const definitionProvider = vscode.languages.registerDefinitionProvider(
		[{ scheme: 'file', language: 'asm' }, { scheme: 'file', language: 's' }],
		{
			provideDefinition(document, position) {
				const range = document.getWordRangeAtPosition(position)
				const word = document.getText(range)
				const filepath = document.fileName
				
				const fileMacros = asmmacros.get(filepath)
				if (fileMacros && fileMacros.has(word)) {
					const macro = fileMacros.get(word)!
					
					// macro.line[0] is the start line we saved earlier
					const definitionPosition = new vscode.Position(macro.line[0], 0)
					
					// Return the location: (Uri, Position)
					return new vscode.Location(document.uri, definitionPosition)
				}

				const filevars = asmdata.get(filepath)
				if (filevars && filevars.has(word)) {
					const vars = filevars.get(word)!
					const defpos = new vscode.Position(vars.line, 0)
					return new vscode.Location(document.uri, defpos)
				}
			}
		}
	)
	
	context.subscriptions.push(
		definitionProvider,
		hoverProvider,
		savedisposable,
		opendisposable
	)

	if (!vscode.window.activeTextEditor) return
	main(vscode.window.activeTextEditor.document)
}

// This method is called when your extension is deactivated
export function deactivate() {}