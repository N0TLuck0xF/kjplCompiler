// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    mode: "text/x-kjpl",
    theme: "default",
    indentUnit: 4,
    tabSize: 4
});

// Compiler instance
const compiler = new KJPLCompiler();

// Run button event
document.getElementById("runBtn").addEventListener("click", () => {
    const code = editor.getValue();
    try {
        const result = compiler.compile(code);
        document.getElementById("output").textContent = result;
    } catch (error) {
        document.getElementById("output").textContent = `Error: ${error.message}`;
    }
});
