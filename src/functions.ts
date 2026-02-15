/**
* Completely AI Generated function.
* @param line The lines to remove comments from.
* @returns The line with comments removed.
*/
export function stripcomment(line: string) {	
	for (let i = 0; i < line.length; i++) {
		const c = line[i]
		if (line[i] == "#" && !isWithinString(line, i))
			return line.slice(0, i)   // strip comment
	}

	return line
}

/**
 * Completely AI Generated function.
 * @param code The piece of source code.
 * @param targetIndex The function checks whether the character index in a string literal.
 * @returns Whether the index is in the string.
 */
export function isWithinString(code: string, targetIndex: number) {
	let inString = null // Holds the type of quote: ', ", or `
	let isEscaped = false
	
	// We only need to iterate up to the target index
	for (let i = 0; i < targetIndex; i++) {
		const char = code[i]
		
		if (isEscaped) {
			// If the previous character was a backslash, this character 
			// is escaped and cannot end the string.
			isEscaped = false
			continue
		}
		
		if (char == '\\') {
			isEscaped = true
			continue
		}
		
		if (inString) {
			// If we are currently in a string, check if this char matches 
			// the opening quote to close it.
			if (char == inString)
				inString = null
		} else if (char == "'" || char == '"' || char == '`') 
			inString = char
	}
	
	// If inString is not null at the end, the target index is inside a string.
	return inString !== null
}