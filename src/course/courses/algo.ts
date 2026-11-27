// Section: algorithms and data structures for junior developers and interviews.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, bug, out, lesson, unit, challenge } from '../dsl';

export const algo: Course = {
  id: 'algo', title: 'Algorithms', realm: 'The Puzzle Tower', color: '#c0392b', emblem: 'loop',
  desc: 'Think like an engineer: Big-O, arrays and hash maps, searching and sorting, stacks and queues, recursion, and how to solve interview problems step by step.',
  units: [
    unit('algo-u1', 'Thinking in Steps', 'Algorithms, Big-O, arrays and hash maps.', `
**Key ideas**
- An **algorithm** is a clear list of steps that solves a problem.
- **Big-O** says how the work grows with the input size n: O(1) constant, O(log n), O(n) linear, O(n log n), O(n²).
- Arrays: index access is O(1); searching an unsorted array is O(n).
- Hash maps (\`{}\` / \`Map\` / Python \`dict\`) find a key in O(1) on average: the classic speed-up.`, [
      lesson('algo-1-1', 'What is an algorithm?', [
        teach('Recipes for computers', 'An **algorithm** is a finite list of precise steps. Making tea is an algorithm; so is finding a name in a phone book.\n\nGood engineers ask: is it **correct** (for every input, including empty ones)? And is it **fast enough** when the input is big?', undefined, 'text'),
        order('Put the steps of "find the biggest number" in order', ['Take the first number as the best', 'Look at the next number', 'If it is bigger, it becomes the best', 'Repeat until the end, then answer the best'], undefined, 'text'),
        mc('Which input do beginners most often forget to test?', ['An empty list', 'A list with 3 items', 'A list of numbers', 'A sorted list'], 0),
        tf('Two different algorithms can solve the same problem at very different speeds.', true),
      ]),
      lesson('algo-1-2', 'Big-O notation', [
        teach('How work grows', '```\nfunction first(list) { return list[0]; }          // O(1)\nfunction total(list) {                            // O(n)\n  let t = 0;\n  for (const x of list) t += x;\n  return t;\n}\nfunction hasDuplicate(list) {                     // O(n²)\n  for (let i = 0; i < list.length; i++)\n    for (let j = i + 1; j < list.length; j++)\n      if (list[i] === list[j]) return true;\n  return false;\n}\n```\nFor 1 million items: O(n) ≈ 1 million steps, O(n²) ≈ 1 trillion (too slow!).', undefined, 'js'),
        match('Match the Big-O', [['O(1)', 'Read one array item'], ['O(log n)', 'Binary search'], ['O(n)', 'One loop over the list'], ['O(n²)', 'A loop inside a loop']]),
        mcc('What is the Big-O of this function?', 'function count(list, x) {\n  let c = 0;\n  for (const item of list) if (item === x) c++;\n  return c;\n}', ['O(n)', 'O(1)', 'O(n²)', 'O(log n)'], 0),
        mc('Sorting with a good algorithm (like JavaScript\'s sort) takes about...', ['O(n log n)', 'O(1)', 'O(n³)', 'O(2ⁿ)'], 0),
      ]),
      lesson('algo-1-3', 'Hash maps', [
        teach('The speed trick', 'Checking "have I seen this?" in an array is O(n). In a **Set** or **Map** it is O(1) on average:\n\n```\nfunction hasDuplicate(list) {   // O(n) instead of O(n²)\n  const seen = new Set();\n  for (const x of list) {\n    if (seen.has(x)) return true;\n    seen.add(x);\n  }\n  return false;\n}\n```', undefined, 'js'),
        out('const seen = new Set([1, 2, 2, 3]);\nconsole.log(seen.size);', ['3', '4', '2', '1'], 0),
        out('const count = {};\nfor (const c of "banana") count[c] = (count[c] || 0) + 1;\nconsole.log(count.a);', ['3', '2', '1', 'undefined'], 0),
        mc('Which structure answers "is this user id banned?" fastest for millions of ids?', ['A Set', 'An array', 'A string', 'A linked list'], 0),
      ]),
      challenge('algo-01'), challenge('algo-04'), challenge('algo-05'),
    ]),
    unit('algo-u2', 'Search and Sort', 'Binary search, sorting, two pointers.', `
**Key ideas**
- **Linear search** checks every item: O(n). **Binary search** halves a **sorted** list each step: O(log n).
- Sorting: know that bubble sort is O(n²) and merge sort / quicksort are O(n log n). In real code, use the built-in \`sort\` with a comparator.
- **Two pointers**: walk from both ends (palindromes) or through two sorted lists (merging).`, [
      lesson('algo-2-1', 'Binary search', [
        teach('Halving the problem', 'Guess a number from 1 to 100. Best strategy? Always guess the **middle**: 50, then 25 or 75... You need at most 7 guesses. That is binary search, **O(log n)**, and it only works on **sorted** data.', undefined, 'text'),
        mc('How many steps does binary search need for about 1,000,000 sorted items?', ['About 20', 'About 1,000', 'About 500,000', 'About 1,000,000'], 0, '2²⁰ is about a million.'),
        bug('Which line makes this binary search loop forever?', 'let lo = 0, hi = arr.length - 1;\nwhile (lo <= hi) {\n  const mid = Math.floor((lo + hi) / 2);\n  if (arr[mid] === x) return mid;\n  if (arr[mid] < x) lo = mid;\n  else hi = mid - 1;\n}', 5, 'When `arr[mid] < x`, move past mid: `lo = mid + 1`. Otherwise `lo` can get stuck.', 'js'),
        tf('Binary search works on any list, sorted or not.', false),
      ]),
      lesson('algo-2-2', 'Sorting', [
        teach('Putting things in order', '```\n[10, 9, 1].sort()                  // [1, 10, 9]  (as text!)\n[10, 9, 1].sort((a, b) => a - b)   // [1, 9, 10]\nnames.sort((a, b) => a.localeCompare(b))\n```\nA comparator returns a **negative** number to put `a` first, **positive** to put `b` first, **0** to keep them.', undefined, 'js'),
        out('console.log([3, 20, 100].sort().join(","));', ['100,20,3', '3,20,100', '100,3,20', '20,3,100'], 0, 'Without a comparator, numbers are sorted as text.'),
        out('console.log([5, 1, 4].sort((a, b) => b - a).join(" "));', ['5 4 1', '1 4 5', '5 1 4', '4 5 1'], 0),
        match('Match the algorithm', [['Bubble sort', 'O(n²), swaps neighbours'], ['Merge sort', 'O(n log n), split and merge'], ['Binary search', 'O(log n), needs sorted data'], ['Linear search', 'O(n), checks every item']]),
        fill('Sort heroes by level, highest first', 'heroes.sort((a, b) => ___.level - ___.level);', ['b', 'a'], ['x', 'y'], undefined, 'js'),
      ]),
      challenge('algo-02'), challenge('algo-03'), challenge('algo-08'),
    ]),
    unit('algo-u3', 'Structures and Recursion', 'Stacks, queues, recursion and problem solving.', `
**Key ideas**
- **Stack**: last in, first out (undo, the call stack, matching brackets). \`push\`/\`pop\`.
- **Queue**: first in, first out (waiting lines, tasks). \`push\`/\`shift\`.
- **Recursion**: a function that calls itself on a smaller problem, with a **base case**.
- Interview method: understand → examples → brute force → improve → code → test edge cases → state the Big-O.`, [
      lesson('algo-3-1', 'Stacks and queues', [
        teach('Piles and lines', '```\nconst stack = [];\nstack.push("a"); stack.push("b");\nstack.pop();      // "b"  (last in, first out)\n\nconst queue = [];\nqueue.push("a"); queue.push("b");\nqueue.shift();    // "a"  (first in, first out)\n```\nYour browser\'s back button is a stack. A printer is a queue.', undefined, 'js'),
        out('const s = [1, 2, 3];\ns.pop();\ns.push(4);\nconsole.log(s.join(""));', ['124', '1234', '234', '34'], 0),
        match('Match each structure to how it works', [['Stack', 'Last in, first out (like a pile of plates)'], ['Queue', 'First in, first out (like a line at a shop)'], ['push / pop', 'Add and remove at the top of a stack'], ['enqueue / dequeue', 'Join the back and leave the front of a queue']]),
        mc('What does LIFO mean?', ['Last in, first out', 'Last in, final out', 'List in, file out', 'Loop if found once'], 0),
      ]),
      lesson('algo-3-2', 'Recursion', [
        teach('Calling yourself', '```\nfunction countdown(n) {\n  if (n === 0) { console.log("Liftoff!"); return; }  // base case\n  console.log(n);\n  countdown(n - 1);                                   // smaller problem\n}\n```\nEvery recursive function needs a **base case**, or it calls itself until the stack overflows.', undefined, 'js'),
        out('function f(n) { return n <= 1 ? 1 : n * f(n - 1); }\nconsole.log(f(4));', ['24', '10', '4', '120'], 0),
        out('function sum(list) { return list.length === 0 ? 0 : list[0] + sum(list.slice(1)); }\nconsole.log(sum([2, 3, 5]));', ['10', '235', '5', '0'], 0),
        bug('What is missing in this recursive function?', 'function countDown(n) {\n  console.log(n);\n  countDown(n - 1);\n}', 3, 'There is no base case: it never stops. Add `if (n === 0) return;` first.', 'js'),
      ]),
      lesson('algo-3-3', 'Solving interview problems', [
        teach('A method that works', 'When you meet a new problem (at an interview or at work):\n\n1. **Understand**: repeat the problem, ask about edge cases.\n2. **Examples**: write small inputs and outputs.\n3. **Brute force** first: a simple, slow solution is a start.\n4. **Improve**: can a hash map, sorting or two pointers help?\n5. **Code**, then **test** with your examples and edge cases (empty, one item, duplicates).\n6. Say the **Big-O** of time and memory.', undefined, 'text'),
        order('Put the steps in order', ['Understand the problem and ask questions', 'Write small examples', 'Find a simple solution', 'Improve it', 'Write the code', 'Test edge cases and give the Big-O'], undefined, 'text'),
        mc('You are stuck in an interview. What is best?', ['Explain your thinking and try a simple solution', 'Stay silent until you know the perfect answer', 'Give up', 'Change the subject'], 0),
        tf('Interviewers care about how you think and communicate, not only about the final code.', true),
      ]),
      challenge('algo-06'), challenge('algo-09'), challenge('algo-07'), challenge('algo-10'),
    ]),
  ],
};
