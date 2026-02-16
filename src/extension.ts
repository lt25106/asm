// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/// <reference types="./extension.d.ts" />

import * as vscode from 'vscode'
import { ChildProcess, exec } from "child_process"
import { stripcomment, isWithinString, regmap } from "./functions"

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
	const bit8 = /[abcd][lh]/.source
	const general = /[re]?[abcd]x/.source
	const string = /[re]?[ds]il?/.source
	const special = /r[bsi]p/.source
	const nnew = /r(8|9|1[0-5])[dwb]?/.source
	const registeregex = new RegExp(`%(${bit8}|${general}|${special}|${nnew}|${string})`, "i")
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "asm" is now active!')
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	
	const asmmacros = new Map<string, Map<string, asmmacro>>()
	const asmdata = new Map<string, Map<string, datainfo>>()
	const asmlabels = new Map<string, Map<string, number>>()
	const diagnosticcollection = vscode.languages.createDiagnosticCollection()
	
	function updateDecorations(document: vscode.TextDocument) {
		const filepath = document.fileName
		if (!(filepath.endsWith(".s") || filepath.endsWith(".S") || filepath.endsWith(".asm"))) return
		
		asmmacros.set(filepath, new Map<string, asmmacro>())
		asmdata.set(filepath, new Map<string, datainfo>())
		asmlabels.set(filepath, new Map<string, number>())
		
		const filecontents = document.getText().split("\n").map(stripcomment)
		
		for (let i = 0; i < filecontents.length; i++) {
			const trimmedLine = filecontents[i].trim()

			if (trimmedLine.endsWith(":"))
				asmlabels.get(filepath)?.set(trimmedLine.replace(/:$/, ""), i)
			
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
				// for (const )
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
		const macroparamstohighlight: vscode.Range[] = []
		const datatohighlight: vscode.Range[] = []
		const labelstohighlight: vscode.Range[] = []
		const macroNames = Array.from(asmmacros.get(filepath)?.keys() || [])
		const variablenames = Array.from(asmdata.get(filepath)?.keys() || [])
		const labelnames = Array.from(asmlabels.get(filepath)?.keys() || [])
		for (let i = 0; i < filecontents.length; i++) {
			const line = filecontents[i]
			
			function loop(names: string[], highlightrange: vscode.Range[]) {
				for (const name of names) {
					const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
					const regex = new RegExp(`\\b${escapedName}\\b`, "g")
					let match
					while ((match = regex.exec(line)) !== null) {
						if (isWithinString(line, match.index)) continue
						highlightrange.push(new vscode.Range(
							new vscode.Position(i, match.index),
							new vscode.Position(i, match.index + name.length)
						))
					}
				}
			}
			
			loop(variablenames, datatohighlight)
			loop(macroNames, macrotohighlight)
			loop(labelnames, labelstohighlight)
			
			for (const macro of macroNames)
				loop(asmmacros.get(filepath)!.get(macro)!.params, macroparamstohighlight)
		}
		
		for (const editor of vscode.window.visibleTextEditors) {
			if (editor.document.uri.toString() != document.uri.toString()) continue
			editor.setDecorations(macrodecortype, macrotohighlight)
			editor.setDecorations(datadecortype, macroparamstohighlight)
			editor.setDecorations(datadecortype, datatohighlight)
			editor.setDecorations(labeldecortype, labelstohighlight)
		}
	}
	
	let diagnosticproc: ChildProcess
	// --- FUNCTION B: GCC DIAGNOSTICS (SLOW) ---
	function runDiagnostics(document: vscode.TextDocument) {
		if (diagnosticproc) diagnosticproc.kill()
			
		const filepath = document.fileName
		const diagnostics: vscode.Diagnostic[] = []
		
		diagnosticproc = exec(`gcc -Wall -Wextra -fsyntax-only "${filepath}"`, (_err, _stdout, stderr) => {
			for (const line of stderr.split("\n")) {
				const match = line.match(/(.*):(\d+): (error|warning): (.+)/i)
				if (!match) continue
				const [_full, _filename, linenum, severity, msg] = match
				diagnostics.push(new vscode.Diagnostic(
					document.lineAt(parseInt(linenum) - 1).range,
					msg,
					severity.toLowerCase() == "error" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
				))
			}
			diagnosticcollection.set(document.uri, diagnostics)
		})
	}
	
	const savedisposable = vscode.workspace.onDidSaveTextDocument(document => {
		updateDecorations(document)
		runDiagnostics(document)
	})
	const opendisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
		if (!editor) return
		updateDecorations(editor.document)
	})
	const changedisposable = vscode.workspace.onDidChangeTextDocument(changeevent => {
		updateDecorations(changeevent.document)
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
				
				const regword = "%" + word
				const isregister = regword.match(registeregex)
				if (isregister) {
					const contents = new vscode.MarkdownString()
					contents.appendMarkdown(`# ${regword}\n${regmap[isregister[0].toLowerCase()]}`)
					return new vscode.Hover(contents)
				}
				
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
				const lineText = document.lineAt(position.line).text
				if (isWithinString(lineText, position.character))
					return
				
				const range = document.getWordRangeAtPosition(position)
				const word = document.getText(range)
				const filepath = document.fileName
				
				const fileMacros = asmmacros.get(filepath)
				if (fileMacros && fileMacros.has(word)) {
					const macro = fileMacros.get(word)!
					const definitionPosition = new vscode.Position(macro.line[0], 0)
					return new vscode.Location(document.uri, definitionPosition)
				}
				
				const filevars = asmdata.get(filepath)
				if (filevars && filevars.has(word)) {
					const vars = filevars.get(word)!
					const defpos = new vscode.Position(vars.line, 0)
					return new vscode.Location(document.uri, defpos)
				}
				
				const filelabels = asmlabels.get(filepath)
				if (filelabels && filelabels.has(word)) {
					const labels = filelabels.get(word)!
					const defpos = new vscode.Position(labels, 0)
					return new vscode.Location(document.uri, defpos)
				}
			}
		}
	)
	
	context.subscriptions.push(
		definitionProvider,
		hoverProvider,
		savedisposable,
		opendisposable,
		changedisposable
	)
	
	if (!vscode.window.activeTextEditor) return
	updateDecorations(vscode.window.activeTextEditor.document)
	runDiagnostics(vscode.window.activeTextEditor.document)
}

// This method is called when your extension is deactivated
export function deactivate() {}