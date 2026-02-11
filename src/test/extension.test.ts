import * as assert from 'assert'

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { stripcomment } from "../extension"

suite('Extension Test Suite', () => {
	// vscode.window.showInformationMessage('Start all tests.')

	test('strip comment', () => {
		assert.strictEqual("", stripcomment("# comment"))
		assert.strictEqual("", stripcomment("#comment"))
		assert.strictEqual(
      'mov r0, #"hello#world"  ',
      stripcomment('mov r0, #"hello#world"  # comment')
    )
		assert.strictEqual(
      '"hello \\\\" # not comment"  ',
      stripcomment('"hello \\\\" # not comment"  # real comment')
    )
	})
})
