// KJPL Compiler (Interpreter)
class KJPLCompiler {
    constructor() {
        this.variables = {};
        this.functions = {};
        this.output = "";
    }

    // Main compilation function
    compile(code) {
        this.output = "";
        const lines = code.split("\n").map(line => line.trim()).filter(line => line);
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            i = this.processLine(line, lines, i);
            i++;
        }
        return this.output || "No output generated.";
    }

    // Process a single line
    processLine(line, lines, index) {
        // Variable assignment
        if (line.match(/^[\w]+ =/)) {
            const [varName, value] = line.split(" = ").map(s => s.trim());
            this.variables[varName] = this.parseValue(value);
        }
        // PRINT statement
        else if (line.match(/^PRINT\(/)) {
            const content = line.match(/PRINT\("(.+)"\)/)?.[1] || this.evaluateExpression(line.match(/PRINT\((.+)\)/)?.[1]);
            if (content) this.output += content + "\n";
        }
        // IF statement
        else if (line.match(/^IF /)) {
            const condition = line.match(/^IF (.+) THEN/)?.[1];
            if (this.evaluateCondition(condition)) {
                return this.processBlock(lines, index + 1, /^(ELSE|ENDIF)/);
            } else {
                let newIndex = this.skipToElseOrEndif(lines, index + 1);
                if (lines[newIndex].match(/^ELSE/)) {
                    return this.processBlock(lines, newIndex + 1, /^ENDIF/);
                }
                return newIndex;
            }
        }
        // REVELATION_CASE
        else if (line.match(/^REVELATION_CASE /)) {
            const varName = line.match(/^REVELATION_CASE (.+)/)?.[1];
            const value = this.variables[varName] || "";
            let matched = false;
            let newIndex = index + 1;
            while (newIndex < lines.length && !lines[newIndex].match(/^ENDCASE/)) {
                if (lines[newIndex].match(/^WHEN /)) {
                    const whenValue = lines[newIndex].match(/^WHEN "(.+)" THEN/)?.[1];
                    if (value === whenValue) {
                        matched = true;
                        newIndex = this.processBlock(lines, newIndex + 1, /^(WHEN|ELSE|ENDCASE)/);
                    }
                } else if (lines[newIndex].match(/^ELSE/)) {
                    if (!matched) {
                        newIndex = this.processBlock(lines, newIndex + 1, /^ENDCASE/);
                    }
                }
                newIndex++;
            }
            return newIndex - 1;
        }
        // FUNCTION definition
        else if (line.match(/^DEFINE /)) {
            const funcName = line.match(/^DEFINE (\w+) AS FUNCTION/)?.[1];
            let body = [];
            let newIndex = index + 1;
            while (newIndex < lines.length && !lines[newIndex].match(/^ENDFUNCTION/)) {
                body.push(lines[newIndex]);
                newIndex++;
            }
            this.functions[funcName] = body;
            return newIndex;
        }
        // Function call
        else if (line.match(/^CALL /)) {
            const funcName = line.match(/^CALL (\w+)/)?.[1];
            if (this.functions[funcName]) {
                this.compile(this.functions[funcName].join("\n"));
            }
        }
        return index;
    }

    // Parse values (strings, numbers)
    parseValue(value) {
        if (value.match(/^"[^"]*"/)) return value.replace(/"/g, "");
        return value; // Numbers or variables (basic handling)
    }

    // Evaluate conditions
    evaluateCondition(condition) {
        const [left, op, right] = condition.split(/ (>=|<=|=|>|<) /);
        const lValue = this.variables[left] || this.parseValue(left);
        const rValue = this.variables[right] || this.parseValue(right);
        switch (op) {
            case ">=": return lValue >= rValue;
            case "<=": return lValue <= rValue;
            case "=": return lValue === rValue;
            case ">": return lValue > rValue;
            case "<": return lValue < rValue;
            default: return false;
        }
    }

    // Evaluate expressions (basic: variables or literals)
    evaluateExpression(expr) {
        return this.variables[expr] || expr.replace(/"/g, "");
    }

    // Process a block until a terminator
    processBlock(lines, start, terminatorRegex) {
        let i = start;
        while (i < lines.length && !lines[i].match(terminatorRegex)) {
            this.processLine(lines[i], lines, i);
            i++;
        }
        return i - 1;
    }

    // Skip to ELSE or ENDIF
    skipToElseOrEndif(lines, start) {
        let i = start;
        while (i < lines.length && !lines[i].match(/^(ELSE|ENDIF)/)) i++;
        return i;
    }
}

// Export for use in IDE
window.KJPLCompiler = KJPLCompiler;
