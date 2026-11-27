// Section: PHP. The language behind WordPress, Laravel and a huge part of the web,
// running on real PHP 8.3 in the browser.
import type { Course } from '../types';
import { teach, mc, tf, fill, match, order, bug, lesson, unit, challenge, outPhp } from '../dsl';

const P = 'php' as const;

export const php: Course = {
  id: 'php', title: 'PHP', realm: 'The Elephant Guildhall', color: '#777bb4', emblem: 'server',
  desc: 'Server-side PHP 8: variables, arrays, functions, forms, security, classes, databases with PDO, Composer and Laravel.',
  units: [
    unit('php-u1', 'PHP Basics', 'echo, variables, strings and numbers.', `
**Key ideas**
- PHP runs on the **server** and sends HTML to the browser. Files start with \`<?php\`.
- \`echo\` prints. Statements end with \`;\`.
- Variables start with \`$\`: \`$name = "Ada";\`. Join strings with \`.\`; double quotes put variables inside: \`"Hi $name"\`.
- PHP powers WordPress, Wikipedia and Laravel apps.`, [
      lesson('php-1-1', 'What is PHP?', [
        teach('The Guildhall', 'PHP is a **server-side** language: it runs on the web server, builds a page, and sends the HTML to the browser.\n\n```\n<?php\necho "<h1>Welcome!</h1>";\n```\nAround 75% of websites that use a server language use PHP, including **WordPress** and apps built with **Laravel**.', undefined, P),
        mc('Where does PHP code run?', ['On the web server', 'In the browser', 'On the graphics card', 'In the CSS file'], 0),
        match('Match', [['WordPress', 'A CMS built with PHP'], ['Laravel', 'A PHP framework'], ['Composer', 'PHP package manager'], ['echo', 'Prints output']]),
        outPhp('<?php\necho "Hello";\necho " guild";', ['Hello guild', 'Hello\nguild', 'Helloguild', 'echo'], 0),
        bug('Which line is missing something?', '<?php\necho "One";\necho "Two"\necho "Three";', 3, 'Each statement ends with a semicolon: `echo "Two";`', P),
      ]),
      lesson('php-1-2', 'Variables and strings', [
        teach('Dollar signs', '```\n<?php\n$name = "Ada";\n$level = 7;\necho $name . " is level " . $level;  // join with .\necho "$name is level $level";          // same\necho \'$name\';                          // prints $name (single quotes do not replace)\n```', undefined, P),
        outPhp('<?php\n$a = "Guild";\n$b = "hall";\necho $a . $b;', ['Guildhall', 'Guild hall', 'Guild.hall', '$a$b'], 0),
        outPhp("<?php\n$x = 5;\necho 'x is $x';", ['x is $x', 'x is 5', 'x is', 'Error'], 0, 'Single quotes keep the text exactly as it is.'),
        fill('Make a variable', '___gold = 40;\necho ___gold;', ['$', '$'], ['@', '#', 'var '], undefined, P),
        mc('How do you join two strings in PHP?', ['With a dot: $a . $b', 'With a plus: $a + $b', 'With &&', 'With a comma only'], 0),
      ]),
      lesson('php-1-3', 'Numbers and types', [
        teach('Numbers', '```\n<?php\necho 7 + 3;        // 10\necho 7 / 2;        // 3.5\necho intdiv(7, 2); // 3\necho 7 % 2;        // 1\necho 2 ** 3;       // 8\nvar_dump(3.0);     // float(3)\n```\n`var_dump()` shows a value and its type: useful for debugging.', undefined, P),
        outPhp('<?php\necho 10 % 4;', ['2', '2.5', '4', '6'], 0),
        outPhp('<?php\necho intdiv(17, 5);', ['3', '3.4', '2', '4'], 0),
        match('Match the type', [['42', 'int'], ['4.2', 'float'], ['"42"', 'string'], ['true', 'bool']]),
      ]),
      challenge('php-01'), challenge('php-02'),
    ]),
    unit('php-u2', 'Control and Arrays', 'if, loops, arrays and functions.', `
**Key ideas**
- \`if (...) { } elseif (...) { } else { }\`. Compare with \`===\` (value and type) rather than \`==\`.
- Loops: \`for\`, \`while\`, and \`foreach ($items as $item)\`.
- Arrays: \`[1, 2, 3]\` and associative arrays \`["name" => "Ada"]\`. \`count()\`, \`$a[] = x\` to add.
- Functions: \`function add(int $a, int $b): int { return $a + $b; }\`.`, [
      lesson('php-2-1', 'Decisions', [
        teach('if, elseif, else', '```\n<?php\n$gold = 30;\nif ($gold >= 50) {\n    echo "Buy the sword";\n} elseif ($gold >= 20) {\n    echo "Buy the dagger";\n} else {\n    echo "Keep saving";\n}\n```\nUse `===` to compare: `"1" == 1` is true, but `"1" === 1` is false.', undefined, P),
        outPhp('<?php\n$x = 12;\nif ($x > 20) { echo "big"; } elseif ($x > 10) { echo "medium"; } else { echo "small"; }', ['medium', 'big', 'small', 'bigmedium'], 0),
        mc('Why prefer `===` over `==`?', ['It also checks the type', 'It is faster to type', 'It works on arrays only', 'There is no difference'], 0),
        outPhp('<?php\nvar_dump("5" === 5);', ['bool(false)', 'bool(true)', 'false', '5'], 0),
      ]),
      lesson('php-2-2', 'Loops and arrays', [
        teach('Lists of things', '```\n<?php\n$heroes = ["Ada", "Bors"];\n$heroes[] = "Cyra";              // add\necho count($heroes);             // 3\nforeach ($heroes as $hero) {\n    echo "$hero\\n";\n}\nfor ($i = 0; $i < 3; $i++) {\n    echo $i;                     // 012\n}\n```', undefined, P),
        outPhp('<?php\n$n = [3, 4, 5];\n$sum = 0;\nforeach ($n as $v) { $sum += $v; }\necho $sum;', ['12', '345', '3', '5'], 0),
        outPhp('<?php\nfor ($i = 1; $i <= 3; $i++) { echo $i * 2; }', ['246', '123', '2 4 6', '6'], 0),
        fill('Loop over every item', '___ ($items as ___) {\n    echo $item;\n}', ['foreach', '$item'], ['for', 'item', 'each'], undefined, P),
        mc('How do you add "Dax" to the end of `$heroes`?', ['$heroes[] = "Dax";', '$heroes.push("Dax");', 'add($heroes, "Dax");', '$heroes + "Dax";'], 0),
      ]),
      lesson('php-2-3', 'Associative arrays and functions', [
        teach('Keys and functions', '```\n<?php\n$hero = ["name" => "Ada", "level" => 12];\necho $hero["name"];\nforeach ($hero as $key => $value) {\n    echo "$key: $value\\n";\n}\n\nfunction greet(string $name, string $title = "traveller"): string {\n    return "Hello $title $name";\n}\necho greet("Ada");\n```\nType hints (`string`, `int`) catch mistakes early.', undefined, P),
        outPhp('<?php\n$p = ["sword" => 50, "shield" => 30];\necho $p["shield"];', ['30', '50', 'shield', 'Array'], 0),
        outPhp('<?php\nfunction twice(int $n): int { return $n * 2; }\necho twice(twice(5));', ['20', '10', '25', '5'], 0),
        match('Match the function', [['count()', 'How many items'], ['array_sum()', 'Adds all values'], ['in_array()', 'Is a value inside?'], ['array_keys()', 'List of the keys']]),
      ]),
      challenge('php-03'), challenge('php-04'), challenge('php-05'),
    ]),
    unit('php-u3', 'PHP on the Web', 'Forms, security, sessions and databases.', `
**Key ideas**
- Form data arrives in \`$_GET\` (from the URL) and \`$_POST\` (from a form).
- **Never trust user input.** Escape output with \`htmlspecialchars()\` (stops XSS).
- Talk to databases with **PDO** and **prepared statements** (stops SQL injection): \`$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?"); $stmt->execute([$id]);\`
- \`session_start()\` and \`$_SESSION\` remember a user between pages. Hash passwords with \`password_hash()\`.`, [
      lesson('php-3-1', 'Forms and superglobals', [
        teach('Reading a form', 'A form sends data to a PHP page:\n\n```\n<form method="post" action="join.php">\n  <input name="hero">\n  <button>Join</button>\n</form>\n```\n```\n<?php // join.php\n$hero = $_POST["hero"] ?? "";\necho "Welcome, " . htmlspecialchars($hero);\n```\n`??` gives a default when the value is missing.', undefined, P),
        match('Match', [['$_GET', 'Values from the URL (?page=2)'], ['$_POST', 'Values sent by a form'], ['$_SESSION', 'Remembered between pages'], ['$_COOKIE', 'Small data stored in the browser']]),
        mc('What does `$_GET["page"] ?? 1` give when there is no page in the URL?', ['1', 'null', 'An error', '"page"'], 0),
        outPhp('<?php\n$input = null;\necho $input ?? "guest";', ['guest', 'null', '', 'Error'], 0),
      ]),
      lesson('php-3-2', 'Security first', [
        teach('Never trust input', 'Two classic attacks:\n\n- **XSS**: someone types `<script>` into a form. Fix: `echo htmlspecialchars($text);`\n- **SQL injection**: someone types `\' OR 1=1 --`. Fix: **prepared statements**:\n\n```\n$stmt = $pdo->prepare("SELECT * FROM heroes WHERE name = ?");\n$stmt->execute([$name]);\n$hero = $stmt->fetch();\n```\nAnd store passwords with `password_hash()`, check them with `password_verify()`.', undefined, P),
        bug('Which line is dangerous?', '<?php\n$name = $_GET["name"];\n$sql = "SELECT * FROM heroes WHERE name = \'$name\'";\n$rows = $pdo->query($sql);', 3, 'Putting user input directly into SQL allows SQL injection. Use `prepare()` with `?` placeholders.', P),
        outPhp('<?php\necho htmlspecialchars("<b>hi</b>");', ['&lt;b&gt;hi&lt;/b&gt;', '<b>hi</b>', 'hi', 'bhib'], 0),
        mc('How should passwords be stored?', ['With password_hash()', 'As plain text', 'With md5()', 'In a cookie'], 0, '`md5` is far too fast to crack. `password_hash` uses a slow, salted algorithm (bcrypt or argon2).'),
        tf('Prepared statements protect against SQL injection.', true),
      ]),
      challenge('php-06'),
    ]),
    unit('php-u4', 'Modern PHP', 'Classes, Composer, Laravel and a project.', `
**Key ideas**
- Classes: properties, \`__construct\`, \`$this->\`, \`public\`/\`private\`. Namespaces organise code.
- **Composer** installs packages (\`composer require monolog/monolog\`) and autoloads classes.
- **Laravel** (routes, controllers, Blade views, Eloquent ORM, migrations) and **Symfony** are the big frameworks.
- PSR-12 is the common code style; PHPUnit or Pest run tests.`, [
      lesson('php-4-1', 'Classes and objects', [
        teach('Objects in PHP', '```\n<?php\nclass Hero {\n    public function __construct(\n        public string $name,\n        private int $hp = 100\n    ) {}\n\n    public function hit(int $damage): void {\n        $this->hp = max(0, $this->hp - $damage);\n    }\n\n    public function hp(): int { return $this->hp; }\n}\n$ada = new Hero("Ada");\n$ada->hit(30);\necho $ada->hp();   // 70\n```', undefined, P),
        outPhp('<?php\nclass Box { public function __construct(public int $n) {} public function add() { $this->n++; return $this; } }\n$b = new Box(1);\necho $b->add()->add()->n;', ['3', '1', '2', 'Error'], 0),
        fill('Call a method', '$ada___hit(10);', ['->'], ['.', '::', '=>'], undefined, P),
        match('Match', [['public', 'Anyone can use it'], ['private', 'Only inside the class'], ['$this', 'The current object'], ['new', 'Creates an object']]),
      ]),
      lesson('php-4-2', 'Composer and Laravel', [
        teach('The modern toolbox', 'Real PHP projects use **Composer**:\n\n```\ncomposer require guzzlehttp/guzzle\n```\nIt writes `composer.json`, downloads to `vendor/`, and gives you `require "vendor/autoload.php";`.\n\n**Laravel** is the most popular framework:\n\n```\n// routes/web.php\nRoute::get("/heroes/{id}", [HeroController::class, "show"]);\n```\nIt brings **Eloquent** (an ORM: `Hero::where("level", ">", 10)->get()`), **Blade** templates and **migrations** for the database.', undefined, P),
        match('Match the Laravel piece', [['Route', 'Maps a URL to code'], ['Controller', 'Handles the request'], ['Eloquent', 'Talks to the database'], ['Blade', 'HTML templates']]),
        order('Start a Laravel project', ['composer create-project laravel/laravel guild', 'cd guild', 'php artisan migrate', 'php artisan serve'], undefined, 'bash'),
        mc('Where does Composer put downloaded packages?', ['vendor/', 'node_modules/', 'lib/', 'packages.json'], 0),
      ]),
      challenge('php-07'), challenge('php-08'),
    ]),
  ],
};
