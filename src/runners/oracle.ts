// The Oracle explains errors in plain words, for beginners.
const HERO_API = ['moveRight', 'moveLeft', 'moveUp', 'moveDown', 'move', 'attack', 'look', 'say', 'x', 'y', 'gems', 'keys'];

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1));
  return d[a.length][b.length];
}

/** "moveRigth" -> "moveRight" */
function closestHeroCommand(name: string) {
  let best = '', score = 99;
  for (const c of HERO_API) { const s = distance(name, c); if (s < score) { score = s; best = c; } }
  return score <= 3 ? best : null;
}

export function explainError(name: string, message: string): string | null {
  let m: RegExpExecArray | null;
  if ((m = /^hero\.(\w+) is not a function$/.exec(message))) {
    const near = closestHeroCommand(m[1]);
    return near ? `Your hero does not know \`${m[1]}\`. Did you mean \`hero.${near}()\`? Spelling and capital letters must match exactly.` : `Your hero does not know \`${m[1]}\`. Check the list of commands in the lesson.`;
  }
  if ((m = /^(\w+) is not defined$/.exec(message)))
    return `The Oracle has never heard of \`${m[1]}\`. Check the spelling (capital letters matter!), or create it first with \`let\` or \`const\`.`;
  if ((m = /Cannot read properties of (undefined|null) \(reading '(.+)'\)/.exec(message)))
    return `You tried to open \`.${m[2]}\` on something that is \`${m[1]}\`, an empty scroll. Check that the value before the dot really exists.`;
  if ((m = /^(.+) is not a function$/.exec(message)))
    return `\`${m[1]}\` is not a spell you can cast with \`()\`. Check the name, or look at what the value really is.`;
  if (/Assignment to constant variable/.test(message))
    return 'A `const` is sealed forever and cannot be changed. Use `let` if the value needs to change.';
  if (/has already been declared/.test(message))
    return 'You created the same name twice. Create it once, then just change it (without `let`/`const`).';
  if (/Unexpected end of input/.test(message))
    return 'The spell ends too early. A `}` or `)` is probably missing. Count your opening and closing brackets.';
  if (/Unexpected token/.test(message))
    return 'Something is in the wrong place. Look for a missing comma, bracket or quote near this line.';
  if (/Unterminated string constant/.test(message))
    return 'A piece of text is missing its closing quote `"`.';
  if (/Maximum call stack size exceeded/.test(message))
    return 'A function keeps calling itself forever. Give it a way to stop (a base case).';
  if (name === 'Timeout')
    return 'Check your loop condition: does it ever become false? Does the counter change each time?';
  if (/is not a direction/.test(message))
    return 'Directions are text, so they need quotes: `"up"`, `"down"`, `"left"` or `"right"`.';
  return null;
}

export function explainTs(code: number, message: string): string | null {
  if (code === 2322 || code === 2345)
    return 'The rune (type) does not fit. TypeScript expected a different kind of value here.';
  if (code === 2304) return 'TypeScript cannot find this name. Check the spelling or declare it first.';
  if (code === 7006) return 'This parameter needs a type rune, like `(name: string)`.';
  if (code === 2339) return 'That property does not exist on this type. Check the spelling or add it to the type.';
  if (code === 2531 || code === 18047 || code === 18048) return 'This value might be `null`/`undefined`. Check it with an `if` first.';
  if (/Expected \d+ arguments?/.test(message)) return 'The function was called with the wrong number of arguments.';
  return null;
}

/** Friendly explanations for Python and PHP errors. */
export function explainPoly(lang: 'py' | 'php', name: string, message: string): string | null {
  let m: RegExpExecArray | null;
  if (name === 'Timeout') return 'Check your loop condition: does it ever become false? Does the counter change each time?';
  if (lang === 'py') {
    if ((m = /name '(\w+)' is not defined/.exec(message))) return `Python has never heard of \`${m[1]}\`. Check the spelling (capital letters matter!), or give it a value first.`;
    if (name === 'IndentationError' || /indent/.test(message)) return 'Python uses **spaces at the start of a line** to group code. The lines inside `if`, `for`, `while` and `def` need 4 spaces, all the same.';
    if (name === 'SyntaxError') return /':'|expected ':'/.test(message) ? 'A line that starts a block (`if`, `for`, `while`, `def`) must end with a colon `:`.' : 'Python cannot read this line. Look for a missing `:`, bracket or quote.';
    if (name === 'TypeError' && /can only concatenate str/.test(message)) return 'You added text and a number. Turn the number into text first: `str(number)`, or use an f-string: `f"score {n}"`.';
    if (name === 'ZeroDivisionError') return 'Dividing by zero is impossible, even for wizards.';
    if (name === 'IndexError') return 'You asked for a position that is not in the list. Lists start at 0, and the last item is at `len(list) - 1`.';
    if (name === 'KeyError') return 'That key is not in the dictionary. Check the spelling, or use `.get(key)`.';
    if (name === 'AttributeError') return 'That value does not have this method or field. Check the name and the type of the value.';
    if (name === 'ValueError') return 'The value has the right type but a wrong content, for example `int("abc")`.';
    return null;
  }
  if (name === 'ParseError') return /expecting ";"|expecting ","/.test(message) ? 'PHP lines end with a semicolon `;`. One is missing on this line or the line before.' : 'PHP cannot read this line. Look for a missing `;`, bracket, quote or `$`.';
  if (/Call to undefined function (\w+)/.test(message)) return 'PHP does not know this function. Check the spelling, or define it with `function name() { ... }` first.';
  if (/Undefined variable/.test(message)) return 'Variables in PHP start with `$` and must have a value before you use them.';
  if (/Division by zero/.test(message)) return 'Dividing by zero is impossible, even for wizards.';
  return null;
}
