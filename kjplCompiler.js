class KJPLCompiler {
    constructor() {
        this.variables = {};
        this.functions = {};
        this.output = "";
    }

    compile(code) {
        this.output = ""; // Reset output
        const lines = code.split("\n").map(line => line.trim()).filter(line => line); // Clean lines
        let i = 0;

        while (i < lines.length) {
            i = this.processLine(lines, i); // Process each line, update index
        }
        return this.output || "No output generated.";
    }

    processLine(lines, index) {
        const line = lines[index];

        // Variable assignment
        if (line.match(/^[\w]+ =/)) {
            const [varName, value] = line.split(" = ").map(s => s.trim());
            this.variables[varName] = this.parseValue(value);
            return index;
        }
        // PRINT statement
        else if (line.match(/^PRINT\(/)) {
            const content = line.match(/PRINT\("(.+)"\)/)?.[1] || this.evaluateExpression(line.match(/PRINT\((.+)\)/)?.[1]);
            if (content) this.output += content + "\n";
            return index;
        }
        // IF statement
        else if (line.match(/^IF /)) {
            const condition = line.match(/^IF (.+) THEN/)?.[1];
            if (!condition) throw new Error(`Invalid IF syntax at line ${index + 1}: ${line}`);
            const blockEnd = this.findBlockEnd(lines, index, "ENDIF");
            if (this.evaluateCondition(condition)) {
                this.processBlock(lines, index + 1, blockEnd);
            } else {
                const elseIndex = this.findElse(lines, index + 1, blockEnd);
                if (elseIndex !== -1) {
                    this.processBlock(lines, elseIndex + 1, blockEnd);
                }
            }
            return blockEnd;
        }
        // REVELATION_CASE
        else if (line.match(/^REVELATION_CASE /)) {
            const varName = line.match(/^REVELATION_CASE (.+)/)?.[1];
            const value = this.variables[varName] || "";
            const blockEnd = this.findBlockEnd(lines, index, "ENDCASE");
            let matched = false;
            let i = index + 1;

            while (i < blockEnd) {
                const currentLine = lines[i];
                if (currentLine.match(/^WHEN /)) {
                    const whenValue = currentLine.match(/^WHEN "(.+)" THEN/)?.[1];
                    if (value === whenValue) {
                        matched = true;
                        i = this.processBlock(lines, i + 1, blockEnd, /^(WHEN|ELSE|ENDCASE)/);
                    }
                } else if (currentLine.match(/^ELSE/)) {
                    if (!matched) {
                        i = this.processBlock(lines, i + 1, blockEnd, /^ENDCASE/);
                    }
                }
                i++;
            }
            return blockEnd;
        }
        // FUNCTION definition
        else if (line.match(/^DEFINE /)) {
            const funcName = line.match(/^DEFINE (\w+) AS FUNCTION/)?.[1];
            const blockEnd = this.findBlockEnd(lines, index, "ENDFUNCTION");
            this.functions[funcName] = lines.slice(index + 1, blockEnd);
            return blockEnd;
        }
        // CALL function
        else if (line.match(/^CALL /)) {
            const funcName = line.match(/^CALL (\w+)/)?.[1];
            if (this.functions[funcName]) {
                this.processBlock(this.functions[funcName], 0, this.functions[funcName].length);
            } else {
                this.output += `Error: Function ${funcName} not defined\n`;
            }
            return index;
        }
        // Unrecognized line (ignore or log)
        else if (!line.match(/^(ENDIF|ELSE|WHEN|ENDCASE|ENDFUNCTION)/)) {
            this.output += `Warning: Unrecognized command at line ${index + 1}: ${line}\n`;
        }
        return index;
    }

    parseValue(value) {
        if (!value) return "";
        return value.match(/^"[^"]*"/) ? value.replace(/"/g, "") : value;
    }

    evaluateCondition(condition) {
        const parts = condition.match(/(.+?)(>=|<=|=|>|<)(.+)/);
        if (!parts) return false;
        const [_, left, op, right] = parts;
        const lValue = this.variables[left.trim()] || this.parseValue(left.trim());
        const rValue = this.variables[right.trim()] || this.parseValue(right.trim());
        switch (op) {
            case ">=": return lValue >= rValue;
            case "<=": return lValue <= rValue;
            case "=": return lValue === rValue;
            case ">": return lValue > rValue;
            case "<": return lValue < rValue;
            default: return false;
        }
    }

    evaluateExpression(expr) {
        if (!expr) return "";
        return this.variables[expr.trim()] || this.parseValue(expr.trim());
    }

    processBlock(lines, start, end, terminatorRegex = null) {
        let i = start;
        while (i < end && (!terminatorRegex || !lines[i].match(terminatorRegex))) {
            i = this.processLine(lines, i) + 1;
        }
        return i - 1;
    }

    findBlockEnd(lines, start, endKeyword) {
        let i = start + 1;
        while (i < lines.length && !lines[i].match(new RegExp(`^${endKeyword}`))) i++;
        if (i >= lines.length) throw new Error(`Missing ${endKeyword} after line ${start + 1}`);
        return i;
    }

    findElse(lines, start, end) {
        let i = start;
        while (i < end && !lines[i].match(/^ELSE/)) i++;
        return i < end ? i : -1;
    }
}

window.KJPLCompiler = KJPLCompiler;
