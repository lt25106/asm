/**
* Completely AI Generated function.
* @param line The lines to remove comments from.
* @returns The line with comments removed.
*/
export function stripcomment(line: string) {	
	for (let i = 0; i < line.length; i++) {
		if (line[i] != "#" || isWithinString(line, i))
			continue
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

/**
 * List of registers and their purposes.
 * Unfortunately also AI generated.
*/
export const regmap: Record<string, string> = {
	// --- Legacy General Purpose ---
	"%rax": "(64 bits) Accumulator. Used for arithmetic and function return values.",
	"%eax": "(32 bits) Lower 32 bits of %rax. ⚠️ Writing to this zero-extends to %rax.",
	"%ax":  "(16 bits) Lower 16 bits of %rax.",
	"%al":  "(8 bits) Lower 8 bits of %rax.",
	"%ah":  "(8 bits) Bits 8-15 of %rax.",
	
	"%rbx": "(64 bits) Base. Often used as a pointer to data. Callee-saved.",
	"%ebx": "(32 bits) Lower 32 bits of %rbx. ⚠️ Writing to this zero-extends to %rbx.",
	"%bx":  "(16 bits) Lower 16 bits of %rbx.",
	"%bl":  "(8 bits) Lower 8 bits of %rbx.",
	"%bh":  "(8 bits) Bits 8-15 of %rbx.",
	
	"%rcx": "(64 bits) Counter. Used for loops, strings, and the 4th function argument.",
	"%ecx": "(32 bits) Lower 32 bits of %rcx. ⚠️ Writing to this zero-extends to %rcx.",
	"%cx":  "(16 bits) Lower 16 bits of %rcx.",
	"%cl":  "(8 bits) Lower 8 bits of %rcx.",
	"%ch":  "(8 bits) Bits 8-15 of %rcx.",
	
	"%rdx": "(64 bits) Data. Used for I/O, mul/div, and the 3rd function argument.",
	"%edx": "(32 bits) Lower 32 bits of %rdx. ⚠️ Writing to this zero-extends to %rdx.",
	"%dx":  "(16 bits) Lower 16 bits of %rdx.",
	"%dl":  "(8 bits) Lower 8 bits of %rdx.",
	"%dh":  "(8 bits) Bits 8-15 of %rdx.",
	
	// --- Index and Pointer ---
	"%rsi": "(64 bits) Source Index. Used for string operations and the 2nd function argument.",
	"%esi": "(32 bits) Lower 32 bits of %rsi. ⚠️ Writing to this zero-extends to %rsi.",
	"%si":  "(16 bits) Lower 16 bits of %rsi.",
	"%sil": "(8 bits) Lower 8 bits of %rsi.",
	
	"%rdi": "(64 bits) Destination Index. Used for string operations and the 1st function argument.",
	"%edi": "(32 bits) Lower 32 bits of %rdi. ⚠️ Writing to this zero-extends to %rdi.",
	"%di":  "(16 bits) Lower 16 bits of %rdi.",
	"%dil": "(8 bits) Lower 8 bits of %rdi.",
	
	"%rbp": "(64 bits) Base Pointer. Points to the start of the current stack frame.",
	"%ebp": "(32 bits) Lower 32 bits of %rbp. ⚠️ Avoid using for addressing in 64-bit mode.",
	"%bp":  "(16 bits) Lower 16 bits of %rbp.",
	"%bpl": "(8 bits) Lower 8 bits of %rbp.",
	
	"%rsp": "(64 bits) Stack Pointer. Points to the top of the stack.",
	"%esp": "(32 bits) Lower 32 bits of %rsp. ⚠️ Warning: Truncates stack address in 64-bit mode.",
	"%sp":  "(16 bits) Lower 16 bits of %rsp.",
	"%spl": "(8 bits) Lower 8 bits of %rsp.",
	
	"%rip": "(64 bits) Instruction Pointer. Points to the next instruction to execute.",
	
	// --- Numbered Registers (R8-R15) ---
	"%r8":  "(64 bits) General purpose. Used as the 5th function argument.",
	"%r8d": "(32 bits) Lower 32 bits of %r8. ⚠️ Writing to this zero-extends to %r8.",
	"%r8w": "(16 bits) Lower 16 bits of %r8.",
	"%r8b": "(8 bits) Lower 8 bits of %r8.",
	
	"%r9":  "(64 bits) General purpose. Used as the 6th function argument.",
	"%r9d": "(32 bits) Lower 32 bits of %r9. ⚠️ Writing to this zero-extends to %r9.",
	"%r9w": "(16 bits) Lower 16 bits of %r9.",
	"%r9b": "(8 bits) Lower 8 bits of %r9.",
	
	"%r10":  "(64 bits) Temporary register. Caller-saved.",
	"%r10d": "(32 bits) Lower 32 bits of %r10. ⚠️ Writing to this zero-extends to %r10.",
	"%r10w": "(16 bits) Lower 16 bits of %r10.",
	"%r10b": "(8 bits) Lower 8 bits of %r10.",
	
	"%r11":  "(64 bits) Temporary register. Caller-saved.",
	"%r11d": "(32 bits) Lower 32 bits of %r11. ⚠️ Writing to this zero-extends to %r11.",
	"%r11w": "(16 bits) Lower 16 bits of %r11.",
	"%r11b": "(8 bits) Lower 8 bits of %r11.",
	
	"%r12":  "(64 bits) General purpose. Callee-saved.",
	"%r12d": "(32 bits) Lower 32 bits of %r12. ⚠️ Writing to this zero-extends to %r12.",
	"%r12w": "(16 bits) Lower 16 bits of %r12.",
	"%r12b": "(8 bits) Lower 8 bits of %r12.",
	
	"%r13":  "(64 bits) General purpose. Callee-saved.",
	"%r13d": "(32 bits) Lower 32 bits of %r13. ⚠️ Writing to this zero-extends to %r13.",
	"%r13w": "(16 bits) Lower 16 bits of %r13.",
	"%r13b": "(8 bits) Lower 8 bits of %r13.",
	
	"%r14":  "(64 bits) General purpose. Callee-saved.",
	"%r14d": "(32 bits) Lower 32 bits of %r14. ⚠️ Writing to this zero-extends to %r14.",
	"%r14w": "(16 bits) Lower 16 bits of %r14.",
	"%r14b": "(8 bits) Lower 8 bits of %r14.",
	
	"%r15":  "(64 bits) General purpose. Callee-saved.",
	"%r15d": "(32 bits) Lower 32 bits of %r15. ⚠️ Writing to this zero-extends to %r15.",
	"%r15w": "(16 bits) Lower 16 bits of %r15.",
	"%r15b": "(8 bits) Lower 8 bits of %r15."
}