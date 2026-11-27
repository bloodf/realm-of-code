// Section: Python. From print() to classes, with real Python running in the browser.
import type { Course } from '../types';
import { teach, mc, tf, fill, match, order, bug, lesson, unit, challenge, outPy } from '../dsl';

const P = 'py' as const;

export const python: Course = {
  id: 'python', title: 'Python', realm: 'The Serpent Library', color: '#3776ab', emblem: 'book2',
  desc: 'The friendliest programming language: variables, decisions, loops, lists, dictionaries, functions, errors and classes. Used for the web, data, automation and AI.',
  units: [
    unit('py-u1', 'First Words', 'print, strings, numbers and variables.', `
**Key ideas**
- \`print("Hello")\` shows text. Text is a **string**, in quotes.
- Variables: \`name = "Ada"\` (no \`let\`, no \`;\`). Names use \`snake_case\`.
- Numbers: \`int\` (7) and \`float\` (7.5). Maths: \`+ - * / // % **\`.
- f-strings: \`f"{name} has {gold} gold"\`. Comments start with \`#\`.
- Python is used for websites (Django, Flask, FastAPI), data science, automation and AI.`, [
      lesson('py-1-1', 'Meet Python', [
        teach('The Serpent Library', 'Python is one of the most popular languages in the world. It reads almost like English:\n\n```\nprint("Hello, reader!")\n```\nPeople use it to build **websites** (Django, FastAPI), analyse **data**, **automate** boring tasks and train **AI** models.', undefined, P),
        mc('What does `print("Hi")` do?', ['Shows Hi on the screen', 'Prints on paper', 'Saves a file', 'Nothing'], 0),
        match('Match the Python tool to its use', [['Django', 'Websites'], ['pandas', 'Data tables'], ['PyTorch', 'Artificial intelligence'], ['pytest', 'Testing code']]),
        outPy('print("Ready")\nprint("Set")', ['Ready\nSet', 'Ready Set', 'Set\nReady', 'print'], 0),
        tf('In Python, lines do not need a semicolon at the end.', true),
      ]),
      lesson('py-1-2', 'Variables and strings', [
        teach('Names for values', '```\nname = "Ada"\nlevel = 3\nlevel = level + 1      # now 4\nprint(name, level)      # Ada 4\n```\nVariable names use **snake_case**: `max_health`, `book_count`. Strings can use `"double"` or `\'single\'` quotes.', undefined, P),
        fill('Create a variable and print it', '___ = "Serpent"\nprint(___)', ['library', 'library'], ['print', '"library"', 'var'], undefined, P),
        outPy('gold = 10\ngold = gold + 5\nprint(gold)', ['15', '10', '105', 'gold'], 0),
        bug('Which line has the bug?', 'name = "Ada\nprint(name)', 1, 'The string is missing its closing quote: `"Ada"`.', P),
        mc('Which name follows Python style?', ['book_count', 'BookCount', 'book-count', '2books'], 0, '`snake_case` is the Python way. Names cannot start with a digit or contain `-`.'),
      ]),
      lesson('py-1-3', 'Numbers and maths', [
        teach('Doing maths', '```\nprint(7 + 2)    # 9\nprint(7 / 2)    # 3.5  (always a float)\nprint(7 // 2)   # 3    (whole division)\nprint(7 % 2)    # 1    (remainder)\nprint(2 ** 3)   # 8    (power)\n```\n`int("42")` turns text into a number, `str(42)` turns a number into text.', undefined, P),
        outPy('print(10 // 3)\nprint(10 % 3)', ['3\n1', '3.33\n1', '3\n3', '1\n3'], 0),
        match('Match the operator', [['//', 'Whole division'], ['%', 'Remainder'], ['**', 'Power'], ['/', 'Division (float)']]),
        outPy('print(2 ** 4)', ['16', '8', '6', '2222'], 0),
        mc('What is `int("7") + 3`?', ['10', '73', 'An error', '"10"'], 0),
      ]),
      lesson('py-1-4', 'f-strings and input', [
        teach('Putting values in text', '```\nname = "Ada"\ngold = 150\nprint(f"{name} has {gold} gold")    # Ada has 150 gold\nprint(f"Half: {gold / 2}")          # Half: 75.0\n```\n`input("Your name? ")` asks the user to type something (it always returns a string).', undefined, P),
        outPy('book = "Dune"\npages = 412\nprint(f"{book}: {pages} pages")', ['Dune: 412 pages', '{book}: {pages} pages', 'book: pages pages', 'Dune 412'], 0),
        fill('Finish the f-string', 'print(___"Level {level}")', ['f'], ['s', '$', 'fmt'], undefined, P),
        mc('What type does `input()` return?', ['A string', 'An int', 'A float', 'It depends'], 0, 'Always a string: convert with `int(...)` when you need a number.'),
      ]),
      challenge('py-01'), challenge('py-02'), challenge('py-03'),
    ]),
    unit('py-u2', 'Decisions', 'Booleans, comparisons, if, elif, else.', `
**Key ideas**
- Booleans: \`True\` and \`False\` (capital letters!).
- Compare: \`== != < > <= >=\`. Combine: \`and\`, \`or\`, \`not\`.
- \`if\` / \`elif\` / \`else\`: the line ends with \`:\` and the block is **indented** with 4 spaces.
- Indentation is not style in Python: it is the syntax.`, [
      lesson('py-2-1', 'True or False', [
        teach('Booleans', '```\nprint(5 > 3)           # True\nprint("a" == "A")      # False\nis_open = True\nprint(not is_open)     # False\nprint(3 > 1 and 2 > 5) # False\n```\nIn Python, `True` and `False` start with a **capital letter**.', undefined, P),
        outPy('print(10 >= 10 and 3 != 3)', ['False', 'True', 'None', 'Error'], 0),
        match('Match', [['and', 'Both must be true'], ['or', 'At least one is true'], ['not', 'Flips True and False'], ['==', 'Is equal to']]),
        bug('Which line has the bug?', 'ready = true\nprint(ready)', 1, 'Python writes `True` with a capital T.', P),
      ]),
      lesson('py-2-2', 'if, elif, else', [
        teach('Making choices', '```\nage = 15\nif age < 12:\n    print("Children\'s room")\nelif age < 18:\n    print("Young readers")\nelse:\n    print("Main hall")\n```\nEach condition line ends with **`:`**. The code inside is **indented** with 4 spaces.', undefined, P),
        outPy('x = 7\nif x > 10:\n    print("big")\nelif x > 5:\n    print("medium")\nelse:\n    print("small")', ['medium', 'big', 'small', 'big\nmedium'], 0),
        order('Put the lines in order', ['if gold >= 50:', '    print("You can buy the sword")', 'else:', '    print("Not enough gold")'], undefined, P),
        bug('Which line is wrong?', 'if score > 100\n    print("High score!")', 1, 'The `if` line must end with a colon: `if score > 100:`', P),
        mc('What makes code part of the `if` block in Python?', ['The indentation', 'Curly braces { }', 'The word then', 'A semicolon'], 0),
      ]),
      lesson('py-2-3', 'Truthy and falsy', [
        teach('Empty means False', 'In an `if`, empty things count as **False**: `0`, `""`, `[]`, `{}`, `None`. Everything else is **True**.\n\n```\nname = ""\nif not name:\n    print("Please type a name")\n```\n`None` means "no value" (like `null`).', undefined, P),
        outPy('items = []\nif items:\n    print("full")\nelse:\n    print("empty")', ['empty', 'full', 'None', '[]'], 0),
        tf('`None` is Python\'s way to say "no value".', true),
        mc('Which of these is truthy?', ['"0"', '0', '""', 'None'], 0, '`"0"` is a non-empty string, so it is truthy.'),
      ]),
      challenge('py-04'),
    ]),
    unit('py-u3', 'Loops', 'while, for, range, break and continue.', `
**Key ideas**
- \`for item in list:\` visits every item. \`for i in range(5):\` counts 0 to 4.
- \`range(start, stop, step)\`: the stop is **not** included.
- \`while condition:\` repeats until the condition is false (make sure it changes!).
- \`break\` leaves the loop, \`continue\` skips to the next round.`, [
      lesson('py-3-1', 'for and range', [
        teach('Repeating', '```\nfor i in range(3):\n    print(i)        # 0 1 2\n\nfor i in range(1, 10, 2):\n    print(i)        # 1 3 5 7 9\n\nfor letter in "abc":\n    print(letter)   # a b c\n```', undefined, P),
        outPy('for i in range(2, 5):\n    print(i)', ['2\n3\n4', '2\n3\n4\n5', '3\n4\n5', '2 3 4'], 0),
        outPy('total = 0\nfor n in range(4):\n    total += n\nprint(total)', ['6', '10', '4', '3'], 0, '0 + 1 + 2 + 3 = 6'),
        fill('Count from 1 to 10', 'for n in ___(1, ___):\n    print(n)', ['range', '11'], ['10', 'list', 'loop'], undefined, P),
        mc('How many times does `for i in range(5)` run?', ['5', '4', '6', 'Forever'], 0),
      ]),
      lesson('py-3-2', 'while, break, continue', [
        teach('Looping with a condition', '```\nenergy = 3\nwhile energy > 0:\n    print("Working...")\n    energy -= 1\n\nfor n in range(10):\n    if n == 5:\n        break       # stop the loop\n    if n % 2 == 0:\n        continue    # skip even numbers\n    print(n)        # 1 3\n```', undefined, P),
        outPy('n = 1\nwhile n < 20:\n    n = n * 3\nprint(n)', ['27', '9', '20', '81'], 0),
        outPy('for c in "hello":\n    if c == "l":\n        break\n    print(c)', ['h\ne', 'h\ne\nl', 'hello', 'h\ne\nl\nl\no'], 0),
        bug('Which line makes this loop run forever?', 'count = 0\nwhile count < 5:\n    print(count)\n    count == count + 1', 4, '`==` compares, it does not change `count`. Use `count = count + 1` or `count += 1`.', P),
        match('Match', [['break', 'Leave the loop now'], ['continue', 'Skip to the next round'], ['while', 'Repeat while a condition is true'], ['range(3)', '0, 1, 2']]),
      ]),
      challenge('py-05'), challenge('py-06'),
    ]),
    unit('py-u4', 'Collections', 'Lists, dictionaries, tuples, sets and comprehensions.', `
**Key ideas**
- **list** \`[1, 2, 3]\`: ordered, changeable. \`append\`, \`remove\`, \`len\`, \`[0]\`, \`[-1]\`, slices \`[1:3]\`.
- **dict** \`{"key": value}\`: look up by key. \`.get()\`, \`.items()\`, \`in\`.
- **tuple** \`(x, y)\`: like a list that cannot change. **set** \`{1, 2}\`: unique values.
- Comprehensions: \`[x * 2 for x in nums if x > 0]\`.`, [
      lesson('py-4-1', 'Lists', [
        teach('Lists', '```\nheroes = ["Ada", "Bors", "Cyra"]\nprint(heroes[0])      # Ada\nprint(heroes[-1])     # Cyra (last)\nprint(heroes[0:2])    # [\'Ada\', \'Bors\'] (a slice)\nheroes.append("Dax")\nprint(len(heroes))    # 4\n```', undefined, P),
        outPy('nums = [10, 20, 30, 40]\nprint(nums[1])\nprint(nums[-2])', ['20\n30', '10\n30', '20\n40', '10\n20'], 0),
        outPy('letters = ["a", "b", "c", "d"]\nprint(letters[1:3])', ["['b', 'c']", "['b', 'c', 'd']", "['a', 'b']", 'b c'], 0),
        fill('Add "Eryn" to the list', 'heroes.___("Eryn")', ['append'], ['push', 'add', 'insert_end'], undefined, P),
        mc('What is `len([3, 5, 7])`?', ['3', '7', '15', '2'], 0),
      ]),
      lesson('py-4-2', 'Dictionaries', [
        teach('Key and value', '```\nhero = {"name": "Ada", "level": 12}\nprint(hero["name"])         # Ada\nhero["level"] += 1\nprint(hero.get("gold", 0))  # 0 (no error when missing)\nfor key, value in hero.items():\n    print(key, value)\n```\nDictionaries are like JSON objects.', undefined, P),
        outPy('stock = {"apples": 3, "pears": 5}\nstock["apples"] += 2\nprint(stock["apples"])', ['5', '3', '2', '7'], 0),
        outPy('d = {"a": 1}\nprint(d.get("b", "none"))', ['none', 'None', 'b', 'Error'], 0),
        bug('Which line raises a KeyError?', 'prices = {"sword": 50}\nprint(prices["sword"])\nprint(prices["shield"])', 3, 'There is no "shield" key. Use `prices.get("shield")` to avoid the error.', P),
        match('Match the collection', [['[1, 2, 3]', 'list'], ['{"a": 1}', 'dict'], ['(1, 2)', 'tuple'], ['{1, 2, 3}', 'set']]),
      ]),
      lesson('py-4-3', 'Tuples, sets and comprehensions', [
        teach('More collections', '```\npoint = (3, 4)          # tuple: cannot change\nx, y = point            # unpacking\ntags = {"html", "css", "html"}\nprint(len(tags))        # 2 (sets keep unique values)\nsquares = [n * n for n in range(5)]   # [0, 1, 4, 9, 16]\n```', undefined, P),
        outPy('print(len({"a", "b", "a", "c", "b"}))', ['3', '5', '2', '4'], 0),
        outPy('evens = [n for n in range(10) if n % 2 == 0]\nprint(evens)', ['[0, 2, 4, 6, 8]', '[2, 4, 6, 8]', '[2, 4, 6, 8, 10]', '[1, 3, 5, 7, 9]'], 0),
        mc('Why use a tuple instead of a list?', ['The values should not change', 'It is faster to type', 'It can hold more items', 'Lists cannot hold numbers'], 0),
      ]),
      challenge('py-07'), challenge('py-08'), challenge('py-10'),
    ]),
    unit('py-u5', 'Functions and Modules', 'def, return, parameters, scope, imports.', `
**Key ideas**
- \`def name(params):\` then an indented body. \`return\` gives a value back.
- Default values: \`def greet(name, title="reader"):\`. Call with keywords: \`greet(title="sir", name="Ada")\`.
- Variables made inside a function are **local**.
- \`import math\`, \`from random import choice\`. Install packages with \`pip install\`, keep them in a **virtual environment** (\`python -m venv .venv\`).`, [
      lesson('py-5-1', 'def and return', [
        teach('Your own functions', '```\ndef area(width, height):\n    return width * height\n\nprint(area(3, 4))    # 12\n```\nA function without `return` gives back `None`.', undefined, P),
        outPy('def double(n):\n    return n * 2\n\nprint(double(double(3)))', ['12', '6', '9', '3'], 0),
        outPy('def greet(name, title="reader"):\n    return f"Hi {title} {name}"\n\nprint(greet("Ada"))\nprint(greet("Bors", "sir"))', ['Hi reader Ada\nHi sir Bors', 'Hi Ada reader\nHi Bors sir', 'Hi reader Ada\nHi reader Bors', 'Error'], 0),
        bug('Why does this print None?', 'def add(a, b):\n    total = a + b\n\nprint(add(2, 3))', 2, 'The function computes `total` but never returns it. Add `return total`.', P),
        fill('Finish the function', '___ square(n):\n    ___ n * n', ['def', 'return'], ['function', 'print', 'fn'], undefined, P),
      ]),
      lesson('py-5-2', 'Modules and pip', [
        teach('Borrowing tools', '```\nimport math\nprint(math.sqrt(16))      # 4.0\n\nfrom random import choice\nprint(choice(["a", "b"]))  # a or b\n```\nPython comes with a big **standard library**. Other packages come from **PyPI** with `pip install requests`. Keep each project\'s packages in a **virtual environment**:\n\n```\npython -m venv .venv\nsource .venv/bin/activate\npip install requests\npip freeze > requirements.txt\n```', undefined, P),
        outPy('import math\nprint(math.floor(7.9))', ['7', '8', '7.9', '8.0'], 0),
        order('Start a new Python project', ['python -m venv .venv', 'source .venv/bin/activate', 'pip install requests', 'pip freeze > requirements.txt'], undefined, 'bash'),
        mc('What is `requirements.txt` for?', ['Listing the packages a project needs', 'Writing the documentation', 'Storing passwords', 'Running tests'], 0),
        match('Match', [['pip', 'Installs packages'], ['PyPI', 'The package index'], ['venv', 'An isolated environment'], ['import', 'Uses a module in your code']]),
      ]),
      challenge('py-09'),
    ]),
    unit('py-u6', 'Errors and Objects', 'try/except, classes, and a real project.', `
**Key ideas**
- Errors have names: \`ValueError\`, \`KeyError\`, \`IndexError\`, \`TypeError\`, \`ZeroDivisionError\`.
- Catch them with \`try:\` / \`except ValueError:\`. \`raise ValueError("why")\` makes your own.
- Classes: \`class Book:\` with \`__init__(self, ...)\` and methods that take \`self\`.
- Test with \`assert\` or **pytest**: \`def test_area(): assert area(2, 3) == 6\`.`, [
      lesson('py-6-1', 'try and except', [
        teach('When things go wrong', '```\ntry:\n    days = int("seven")\nexcept ValueError:\n    days = 7\nprint(days)   # 7\n```\nWithout `try`, the program would crash with a **traceback**. Read tracebacks from the bottom: the last line says what went wrong.', undefined, P),
        outPy('try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print("no dividing by zero")', ['no dividing by zero', 'Infinity', '0', 'Error'], 0),
        match('Match the error', [['int("abc")', 'ValueError'], ['[1, 2][5]', 'IndexError'], ['{"a": 1}["b"]', 'KeyError'], ['"a" + 1', 'TypeError']]),
        mc('Where do you look first in a Python traceback?', ['The last line', 'The first line', 'The middle', 'Nowhere, just run it again'], 0),
      ]),
      lesson('py-6-2', 'Classes and objects', [
        teach('Blueprints', '```\nclass Hero:\n    def __init__(self, name):\n        self.name = name\n        self.hp = 100\n\n    def hit(self, damage):\n        self.hp -= damage\n\nada = Hero("Ada")\nada.hit(30)\nprint(ada.hp)   # 70\n```\n`__init__` runs when the object is created. `self` is the object itself.', undefined, P),
        outPy('class Counter:\n    def __init__(self):\n        self.n = 0\n    def add(self):\n        self.n += 1\n\nc = Counter()\nc.add()\nc.add()\nprint(c.n)', ['2', '0', '1', 'None'], 0),
        fill('Finish the class', 'class Dog:\n    def ___(self, name):\n        ___.name = name', ['__init__', 'self'], ['init', 'this', 'constructor'], undefined, P),
        tf('Every method of a class takes `self` as its first parameter.', true),
      ]),
      lesson('py-6-3', 'Testing with pytest', [
        teach('Proving your code works', 'Professional Python code has **tests**:\n\n```\n# test_library.py\nfrom library import due_date\n\ndef test_default_loan():\n    assert due_date(1) == 15\n\ndef test_short_loan():\n    assert due_date(10, 7) == 17\n```\nRun `pytest` in the terminal: it finds files named `test_*.py` and runs every `test_` function.', undefined, P),
        mc('What does `assert x == 3` do when x is 5?', ['Raises an AssertionError', 'Prints False', 'Changes x to 3', 'Nothing'], 0),
        order('Write a test', ['from shop import price_with_tax', 'def test_tax():', '    assert price_with_tax(100) == 120'], undefined, P),
        match('Match', [['pytest', 'Runs the tests'], ['assert', 'Checks a fact'], ['test_*.py', 'Where tests live'], ['traceback', 'The error report']]),
      ]),
      challenge('py-11'), challenge('py-12'), challenge('py-13'),
    ]),
  ],
};
