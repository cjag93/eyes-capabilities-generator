/**
 * Minimal, dependency-free syntax highlighting for the generated snippets.
 *
 * All four framework generators currently emit JavaScript or TypeScript
 * (see each supportedLanguages array in lib/frameworks/*), so this covers
 * that keyword set. If a future framework generates Python/Java/C#, extend
 * KEYWORDS or branch on `language` — the escaping/tokenizing logic itself
 * is language-agnostic.
 */

const KEYWORDS = new Set([
  "const", "let", "var", "function", "async", "await", "import", "export",
  "from", "return", "if", "else", "new", "class", "extends", "require",
  "module", "exports", "default", "try", "catch", "finally", "throw",
  "this", "typeof", "interface", "type", "as", "of", "in", "for", "while",
  "true", "false", "null", "undefined", "void", "public", "private",
  "readonly", "static", "implements", "enum",
]);

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

// Order matters: comments and strings are matched before bare identifiers so
// a keyword-looking substring inside a string/comment is never re-tokenized.
const TOKEN_PATTERN =
  /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:const|let|var|function|async|await|import|export|from|return|if|else|new|class|extends|require|module|exports|default|try|catch|finally|throw|this|typeof|interface|type|as|of|in|for|while|true|false|null|undefined|void|public|private|readonly|static|implements|enum)\b)/g;

/**
 * Returns HTML-safe markup with <span> wrappers for comments/strings/keywords.
 * Every character of the input is escaped — matched and unmatched segments
 * alike — so this is safe to render via dangerouslySetInnerHTML even though
 * the source is (currently, always) our own generated code, not user input.
 */
export function highlightCode(code: string): string {
  let out = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(code)) !== null) {
    out += escapeHtml(code.slice(lastIndex, match.index));

    const [full, lineComment, blockComment, stringLit, keyword] = match;
    if (lineComment || blockComment) {
      out += `<span class="text-muted-foreground italic opacity-70">${escapeHtml(full)}</span>`;
    } else if (stringLit) {
      out += `<span class="text-muted-foreground">${escapeHtml(full)}</span>`;
    } else if (keyword && KEYWORDS.has(keyword)) {
      out += `<span class="text-accent font-medium">${escapeHtml(full)}</span>`;
    } else {
      out += escapeHtml(full);
    }
    lastIndex = TOKEN_PATTERN.lastIndex;
  }
  out += escapeHtml(code.slice(lastIndex));
  return out;
}
