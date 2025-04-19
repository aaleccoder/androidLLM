// Token types for syntax highlighting
export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'identifier'
  | 'operator'
  | 'punctuation'
  | 'whitespace'
  | 'default';

export interface Token {
  text: string;
  type: TokenType;
}

// Keyword lists for each language
const jsKeywords = [
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'async', 'await', 'static', 'enum', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'abstract', 'boolean', 'byte', 'char', 'double', 'final', 'float', 'goto', 'int', 'long', 'native', 'short', 'synchronized', 'throws', 'transient', 'volatile'
];
const pyKeywords = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
];
const javaKeywords = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while'
];
const cKeywords = [
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', '_Alignas', '_Alignof', '_Atomic', '_Bool', '_Complex', '_Generic', '_Imaginary', '_Noreturn', '_Static_assert', '_Thread_local'
];
const cppKeywords = [
  ...cKeywords,
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'bitand', 'bitor', 'bool', 'catch', 'char16_t', 'char32_t', 'class', 'compl', 'constexpr', 'const_cast', 'decltype', 'delete', 'dynamic_cast', 'explicit', 'export', 'false', 'friend', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public', 'reinterpret_cast', 'static_assert', 'static_cast', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typeid', 'typename', 'using', 'virtual', 'wchar_t', 'xor', 'xor_eq'
];
const csharpKeywords = [
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void', 'volatile', 'while'
];
const rustKeywords = [
  'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'async', 'await', 'dyn'
];
const goKeywords = [
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var'
];
const phpKeywords = [
  'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone', 'const', 'continue', 'declare', 'default', 'do', 'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'final', 'finally', 'for', 'foreach', 'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset', 'list', 'namespace', 'new', 'or', 'print', 'private', 'protected', 'public', 'require', 'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'var', 'while', 'xor', 'yield', 'yield from'
];
const swiftKeywords = [
  'as', 'associatedtype', 'break', 'case', 'catch', 'class', 'continue', 'default', 'defer', 'deinit', 'do', 'else', 'enum', 'extension', 'fallthrough', 'false', 'fileprivate', 'for', 'func', 'guard', 'if', 'import', 'in', 'init', 'inout', 'internal', 'is', 'let', 'nil', 'open', 'operator', 'private', 'protocol', 'public', 'repeat', 'required', 'rethrows', 'return', 'self', 'static', 'struct', 'subscript', 'super', 'switch', 'throw', 'throws', 'true', 'try', 'typealias', 'var', 'where', 'while'
];
const kotlinKeywords = [
  'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in', 'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while', 'by', 'catch', 'constructor', 'delegate', 'dynamic', 'field', 'file', 'finally', 'get', 'import', 'init', 'param', 'property', 'receiver', 'set', 'setparam', 'where', 'actual', 'abstract', 'annotation', 'companion', 'const', 'crossinline', 'data', 'enum', 'expect', 'external', 'final', 'infix', 'inline', 'inner', 'internal', 'lateinit', 'noinline', 'open', 'operator', 'out', 'override', 'private', 'protected', 'public', 'reified', 'sealed', 'suspend', 'tailrec', 'vararg'
];

function getKeywords(language: string): string[] {
  const lang = language.toLowerCase();
  if (lang === 'python' || lang === 'py') return pyKeywords;
  if (lang === 'java') return javaKeywords;
  if (lang === 'c' || lang === 'h') return cKeywords;
  if (lang === 'cpp' || lang === 'c++' || lang === 'hpp' || lang === 'cc' || lang === 'cxx') return cppKeywords;
  if (lang === 'csharp' || lang === 'cs') return csharpKeywords;
  if (lang === 'rust' || lang === 'rs') return rustKeywords;
  if (lang === 'go' || lang === 'golang') return goKeywords;
  if (lang === 'php') return phpKeywords;
  if (lang === 'swift') return swiftKeywords;
  if (lang === 'kotlin' || lang === 'kt') return kotlinKeywords;
  // typescript shares js keywords
  if (lang === 'typescript' || lang === 'ts') return jsKeywords;
  return jsKeywords;
}

// Tokenizer for JS/TS/Python/Java (simple, not perfect)
export function tokenizeCode(code: string, language: string): Token[] {
  const keywords = getKeywords(language);
  const patterns: [RegExp, TokenType][] = [
    [/\b(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, 'string'],
    [/\/\/.*|#.*|\/\*[\s\S]*?\*\//g, 'comment'],
    [/\b\d+(?:\.\d+)?\b/g, 'number'],
    [/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, 'identifier'],
    [/\+|-|\*|\/|=|<|>|!|%|&|\||\^|~|\?|:|\.|,|;|\(|\)|\[|\]|\{|\}/g, 'operator'],
    [/\s+/g, 'whitespace'],
  ];
  const tokens: Token[] = [];
  let codeCopy = code;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  // Main loop: match all patterns, in order of appearance
  while (codeCopy.length > 0) {
    let found = false;
    for (const [regex, type] of patterns) {
      regex.lastIndex = 0;
      match = regex.exec(codeCopy);
      if (match && match.index === 0) {
        let text = match[0];
        let tokenType: TokenType = type;
        if (type === 'identifier' && keywords.includes(text)) tokenType = 'keyword';
        tokens.push({ text, type: tokenType });
        codeCopy = codeCopy.slice(text.length);
        found = true;
        break;
      }
    }
    if (!found) {
      // Default: single char as 'default'
      tokens.push({ text: codeCopy[0], type: 'default' });
      codeCopy = codeCopy.slice(1);
    }
  }
  return tokens;
}
