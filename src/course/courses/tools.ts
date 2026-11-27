// Section: The Developer Workshop (process skills): terminal, Git, GitHub, npm, build tools, debugging.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, type, bug, lesson, unit, term, node } from '../dsl';

const H = '/home/hero';

export const tools: Course = {
  id: 'tools', title: 'Developer Workshop', realm: "The Artificers' Workshop", color: '#4f6d7a', emblem: 'terminal',
  desc: 'How developers really work: the terminal, Git and GitHub, pull requests, npm, build tools and debugging.',
  units: [
    unit('tools-u1', 'The Terminal', 'Move around and manage files by typing commands.', `
**Key ideas**
- The **terminal** (command line, shell) runs programs by typing commands.
- \`pwd\` shows where you are, \`ls\` lists files, \`cd folder\` moves in, \`cd ..\` moves up, \`cd ~\` goes home.
- \`mkdir name\` makes a folder, \`touch file\` makes an empty file, \`cat file\` shows a file.
- \`mv a b\` moves/renames, \`cp a b\` copies, \`rm file\` deletes (\`rm -r folder\` for folders). There is no recycle bin!
- Press ↑ to repeat commands, Tab to auto-complete names.`, [
      lesson('tools-1-1', 'What is the terminal?', [
        teach('Talking to the computer', 'The **terminal** lets you control the computer by typing **commands** instead of clicking. Developers use it every day to run servers, install packages, use Git and much more.\n\n```\nhero@realm:~$ ls\nprojects  notes.txt\n```\nThe text before `$` is the **prompt**: it shows who and where you are.'),
        mc('Why do developers use the terminal?', ['Many tools (Git, npm, servers) are run by typing commands', 'It is the only way to open files', 'It makes the computer faster', 'Only for hacking'], 0),
        match('Match the command with what it does', [['pwd', 'Print the current folder'], ['ls', 'List files'], ['cd', 'Change folder'], ['mkdir', 'Make a folder']]),
        tf('In `hero@realm:~$`, the `~` means your home folder.', true),
        mc('What does `..` mean in `cd ..`?', ['The folder above (the parent)', 'The current folder', 'The home folder', 'All folders'], 0),
        type('Which command shows the folder you are in?', ['pwd']),
      ]),
      lesson('tools-1-2', 'Moving around', [
        teach('Navigation', '```\npwd              # where am I?\nls               # what is here?\ncd dungeon       # go into "dungeon"\ncd dungeon/cellar  # go two levels down\ncd ..            # go up one level\ncd ~             # go home\n```\nTip: press **Tab** to complete a name, **↑** to reuse a command.'),
        mcc('You are in `/home/hero/castle/hall`. Where are you after this?', 'cd ..', ['/home/hero/castle', '/home/hero', '/home/hero/castle/hall/..', '/'], 0, undefined, 'bash'),
        mc('Which command lists hidden files too (like `.git`)?', ['ls -a', 'ls -hidden', 'show all', 'cd -a'], 0),
        term({
          id: 'tools-t1', task: 'A treasure is hidden in the `cellar` inside the `dungeon` folder. Go there with `cd` and read `treasure.txt` with `cat`.',
          hint: 'Use `ls` to look around. `cd dungeon`, then `cd cellar`, then `cat treasure.txt`.',
          setup: { 'dungeon/hall/': '', 'dungeon/cellar/treasure.txt': 'You found 500 gold coins!', 'dungeon/cellar/rats.txt': 'Squeak.', 'notes.txt': 'Remember: the treasure is deep below.' },
          check: (sh) => sh.cwd === `${H}/dungeon/cellar` && sh.history.some((c) => /^cat\s+(\.\/)?treasure\.txt$/.test(c)),
          solution: ['cd dungeon/cellar', 'cat treasure.txt'],
        }),
      ]),
      lesson('tools-1-3', 'Files and folders', [
        teach('Creating and cleaning up', '```\nmkdir my-site          # new folder\ntouch index.html       # new empty file\nmv old.txt new.txt     # rename (move)\ncp a.txt backup.txt    # copy\nrm notes.txt           # delete a file\nrm -r old-folder       # delete a folder and everything in it\n```\nCareful: `rm` does not use a recycle bin. Deleted means gone.'),
        match('Match the command', [['touch', 'Create an empty file'], ['mv', 'Move or rename'], ['cp', 'Copy'], ['rm', 'Delete']]),
        tf('Files deleted with `rm` go to the recycle bin.', false),
        mc('Which creates a folder called `images`?', ['mkdir images', 'touch images', 'cd images', 'new images'], 0, undefined, { codeOptions: true }),
        term({
          id: 'tools-t2', task: 'Set up a new website project: create a folder `my-site` containing `index.html`, `style.css` and an `images` folder.',
          hint: '`mkdir my-site`, `cd my-site`, `touch index.html style.css`, `mkdir images`.',
          check: (sh) => sh.isDir(`${H}/my-site`) && sh.isFile(`${H}/my-site/index.html`) && sh.isFile(`${H}/my-site/style.css`) && sh.isDir(`${H}/my-site/images`),
          solution: ['mkdir my-site', 'cd my-site', 'touch index.html style.css', 'mkdir images'],
        }),
      ]),
    ]),
    unit('tools-u2', 'Git Basics', 'Save points for your code: init, add, commit, log.', `
**Key ideas**
- **Git** records the history of your project as **commits** (save points). **GitHub** hosts Git projects online.
- \`git init\` starts a repository. \`git status\` shows what changed.
- \`git add file\` (or \`git add .\`) **stages** changes; \`git commit -m "message"\` saves them.
- \`git log --oneline\` shows the history.
- Good commits are small and have clear messages in the imperative: "Add login form".
- \`.gitignore\` lists files Git should ignore (\`node_modules\`, \`.env\`, \`dist\`).`, [
      lesson('tools-2-1', 'Why version control?', [
        teach('Save points for code', '**Git** keeps the full history of a project. Each save point is a **commit**. With Git you can:\n- go back to any earlier version\n- see who changed what and why\n- work on new features without breaking the main version\n- work with a team without overwriting each other\n\n**GitHub** (or GitLab, Bitbucket) stores Git projects online.'),
        mc('What is a commit?', ['A saved snapshot of the project', 'A file that was deleted', 'A kind of branch', 'A GitHub account'], 0),
        tf('Git and GitHub are the same thing.', false, 'Git is the tool on your computer. GitHub is a website that hosts Git repositories.'),
        match('Match the word', [['Repository (repo)', 'A project tracked by Git'], ['Commit', 'A saved snapshot'], ['GitHub', 'Website that hosts repos'], ['History', 'All commits in order']]),
        mc('Why do companies require Git?', ['Teams can work together and undo mistakes safely', 'It makes code run faster', 'It is needed to write HTML', 'It replaces testing'], 0),
      ]),
      lesson('tools-2-2', 'Your first commit', [
        teach('The three steps', '```\ngit init                     # start tracking this folder\ngit status                   # what changed?\ngit add index.html           # stage a file (or: git add .)\ngit commit -m "Add homepage" # save the snapshot\n```\n**Staging** lets you choose exactly what goes into the next commit.'),
        order('Put the commands in order for a first commit', ['git init', 'git add .', 'git commit -m "First commit"'], undefined, 'bash'),
        mc('What does `git add` do?', ['Stages changes for the next commit', 'Creates a new file', 'Uploads to GitHub', 'Deletes old commits'], 0),
        fill('Commit with a message', 'git ___ -m "Add quest list"', ['commit'], ['save', 'push', 'add'], undefined, 'bash'),
        term({
          id: 'tools-t3', task: 'Put the `quest-log` project under version control: initialise a repository, stage `index.html` and make your first commit (with a message).',
          hint: '`git init`, then `git add index.html` (or `git add .`), then `git commit -m "Add quest log page"`. Use `git status` to see what is going on.',
          setup: { 'quest-log/index.html': '<h1>Quests</h1>' }, cwd: 'quest-log',
          check: (sh) => !!sh.repo && Object.values(sh.repo.commits).some((c) => 'index.html' in c.files),
          solution: ['git init', 'git add index.html', 'git commit -m "Add quest log page"'],
        }),
      ]),
      lesson('tools-2-3', 'Good commits and .gitignore', [
        teach('Habits of good developers', '- Commit **small, focused** changes often\n- Write messages in the imperative: "Add login form", "Fix price rounding"\n- Check `git status` and `git diff` before committing\n- Never commit secrets (passwords, API keys)\n\nA `.gitignore` file lists things Git should ignore:\n\n```\nnode_modules\ndist\n.env\n```'),
        mc('Which commit message is best?', ['Fix total price rounding in cart', 'stuff', 'asdf', 'changes'], 0),
        mc('Which folder should almost always be in `.gitignore`?', ['node_modules', 'src', 'public', 'tests'], 0, '`node_modules` can be rebuilt with `npm install`, and it is huge.'),
        tf('It is fine to commit a `.env` file with your API keys to a public repository.', false, 'Bots scan GitHub for leaked keys within minutes. Keep secrets out of Git.'),
        mc('Which command shows the history in short form?', ['git log --oneline', 'git history', 'git show all', 'git status -h'], 0, undefined, { codeOptions: true }),
        term({
          id: 'tools-t4', task: 'Make **two** commits in the `shop` project: first commit the page, then create `style.css` and commit it separately. Check your work with `git log --oneline`.',
          hint: '`git init`, `git add .`, `git commit -m "Add shop page"`, `touch style.css`, `git add style.css`, `git commit -m "Add styles"`.',
          setup: { 'shop/index.html': '<h1>Shop</h1>' }, cwd: 'shop',
          check: (sh) => !!sh.repo && Object.keys(sh.repo.commits).length >= 2 && Object.values(sh.repo.commits).some((c) => 'style.css' in c.files),
          solution: ['git init', 'git add .', 'git commit -m "Add shop page"', 'touch style.css', 'git add style.css', 'git commit -m "Add styles"'],
        }),
      ]),
    ]),
    unit('tools-u3', 'Branches and GitHub', 'Work in parallel, share code and review it as a team.', `
**Key ideas**
- A **branch** is a separate line of work. \`git switch -c feature\` creates one and moves to it.
- \`git switch main\` goes back; \`git merge feature\` brings the work into the current branch.
- A **remote** (\`origin\`) is a copy on GitHub. \`git push\` uploads, \`git pull\` downloads, \`git clone url\` copies a repo.
- **Pull requests (PRs)**: propose merging a branch; teammates review it before it is merged.
- **Merge conflicts** happen when two branches change the same lines: edit the file, remove the \`<<<<<<<\`/\`=======\`/\`>>>>>>>\` markers, then commit.`, [
      lesson('tools-3-1', 'Branches', [
        teach('Parallel timelines', 'A **branch** lets you work on something new without touching the main version:\n\n```\ngit switch -c add-moat     # create a branch and move to it\n# ...edit, add, commit...\ngit switch main            # back to main\ngit merge add-moat         # bring the changes in\n```\n(`git checkout -b` is the older way to write `git switch -c`.)'),
        mc('Why use a branch for a new feature?', ['To work without breaking the main version', 'To delete old code', 'To make Git faster', 'Branches are only for big teams'], 0),
        order('Workflow: create a branch, commit, and merge it back', ['git switch -c new-feature', 'git add .', 'git commit -m "Add new feature"', 'git switch main', 'git merge new-feature'], undefined, 'bash'),
        mc('Which command lists the branches?', ['git branch', 'git list', 'git log --branches-only', 'git switch'], 0, undefined, { codeOptions: true }),
        term({
          id: 'tools-t5', task: 'In the `castle` project: make a first commit on `main`. Then create a branch `add-moat`, add a file `moat.html` and commit it there. Finally switch back to `main` and merge `add-moat`.',
          hint: '`git init` → `git add .` → `git commit -m "First castle"` → `git switch -c add-moat` → `touch moat.html` → `git add moat.html` → `git commit -m "Add moat"` → `git switch main` → `git merge add-moat`',
          setup: { 'castle/index.html': '<h1>Castle</h1>' }, cwd: 'castle',
          check: (sh) => !!sh.repo && 'add-moat' in sh.repo.branches && sh.repo.branch === 'main' && !!sh.repo.branches.main && 'moat.html' in sh.repo.commits[sh.repo.branches.main!].files,
          solution: ['git init', 'git add .', 'git commit -m "First castle"', 'git switch -c add-moat', 'touch moat.html', 'git add moat.html', 'git commit -m "Add moat"', 'git switch main', 'git merge add-moat'],
        }),
      ]),
      lesson('tools-3-2', 'GitHub and remotes', [
        teach('Your code in the cloud', '```\ngit clone https://github.com/guild/quests.git   # copy a repo to your computer\ngit remote add origin https://github.com/you/site.git\ngit push origin main    # upload your commits\ngit pull                # download new commits\n```\n`origin` is the usual name for the main remote.'),
        match('Match the command', [['git clone', 'Copy a repo from GitHub'], ['git push', 'Upload your commits'], ['git pull', 'Download new commits'], ['git remote', 'Manage online copies']]),
        mc('A teammate pushed new commits. How do you get them?', ['git pull', 'git push', 'git init', 'git commit'], 0),
        tf('`git commit` automatically uploads your work to GitHub.', false, 'Commits are local until you `git push`.'),
        type('Which command copies an existing repository from GitHub to your computer? (just the two words)', ['git clone']),
      ]),
      lesson('tools-3-3', 'Pull requests and code review', [
        teach('Teamwork on GitHub', 'In most companies you never push straight to `main`. Instead:\n1. Create a branch and commit your work\n2. Push the branch to GitHub\n3. Open a **pull request** (PR): "please merge my branch"\n4. Teammates **review** the code and comment\n5. Automated checks (tests) run\n6. After approval, the PR is merged'),
        order('Order the pull-request workflow', ['Create a branch and commit', 'Push the branch to GitHub', 'Open a pull request', 'Teammates review and tests run', 'Merge into main'], undefined, 'text'),
        mc('Which review comment is most helpful?', ['"This loop runs on every render; could we move it into useMemo?"', '"Bad code."', '"I would never do it like this."', '"Why?"'], 0),
        mc('Why keep pull requests small?', ['They are easier and faster to review well', 'GitHub limits PRs to 10 lines', 'Big PRs are not allowed by Git', 'It makes the app smaller'], 0),
        tf('Code review is also a great way for juniors to learn from seniors.', true),
      ]),
      lesson('tools-3-4', 'Merge conflicts', [
        teach('When two changes collide', 'If two branches change the **same lines**, Git cannot decide and marks a **conflict**:\n\n```\n<<<<<<< HEAD\n<h1>Welcome to the Castle</h1>\n=======\n<h1>Welcome to the Fortress</h1>\n>>>>>>> rename-castle\n```\nTo fix it: edit the file to the version you want, delete the markers, then `git add` and `git commit`.'),
        mcc('In this conflict, which text comes from your current branch?', '<<<<<<< HEAD\ncolor: red;\n=======\ncolor: blue;\n>>>>>>> theme', ['color: red;', 'color: blue;', 'Both', 'Neither'], 0, 'The part between `<<<<<<< HEAD` and `=======` is from your current branch (HEAD).', 'css'),
        order('Resolve a merge conflict', ['Open the file with the conflict', 'Choose the correct version and remove the markers', 'git add the file', 'git commit'], undefined, 'text'),
        tf('Merge conflicts mean you did something wrong.', false, 'They are completely normal when people work in parallel. Communicating and pulling often keeps them small.'),
      ]),
    ]),
    unit('tools-u4', 'npm and Build Tools', 'Packages, package.json, scripts, Vite and builds.', `
**Key ideas**
- **Node.js** runs JavaScript outside the browser. **npm** installs packages (other people's code).
- \`package.json\` describes the project: name, **scripts**, **dependencies** and **devDependencies**.
- \`npm install\` (or \`npm i\`) installs everything into \`node_modules\` (never commit it).
- \`npm install react\` adds a dependency; \`npm install -D vitest\` adds a dev-only tool.
- \`npm run dev\` starts the dev server; \`npm run build\` makes an optimised \`dist/\` folder.
- **Vite** is a fast build tool used by many frameworks.`, [
      lesson('tools-4-1', 'Node and npm', [
        teach('Standing on giants\' shoulders', '**npm** (Node Package Manager) downloads **packages**: code written by others, like React or Express. Each project has a `package.json`:\n\n```\n{\n  "name": "tavern-app",\n  "scripts": { "dev": "vite", "build": "vite build" },\n  "dependencies": { "react": "^19.0.0" },\n  "devDependencies": { "vite": "^7.0.0" }\n}\n```'),
        match('Match the part of package.json', [['scripts', 'Commands you can run'], ['dependencies', 'Packages the app needs'], ['devDependencies', 'Tools only for development'], ['name', 'The project name']]),
        mc('Where do installed packages go?', ['node_modules', 'dist', 'src', 'public'], 0),
        tf('You should commit the `node_modules` folder to Git.', false, 'Anyone can recreate it with `npm install`. It is huge, so it goes in `.gitignore`.'),
        mc('A testing tool used only while developing belongs in...', ['devDependencies', 'dependencies', 'scripts', 'node_modules/.git'], 0),
      ]),
      lesson('tools-4-2', 'Installing packages', [
        teach('npm commands', '```\nnpm init -y              # create package.json\nnpm install express      # add a dependency\nnpm install -D vitest    # add a dev dependency\nnpm install              # install everything listed in package.json\n```\n`package-lock.json` records the exact versions, so everyone gets the same ones. Commit it.'),
        fill('Add vitest as a dev dependency', 'npm install ___ vitest', ['-D'], ['-g', '--prod', '-x'], undefined, 'bash'),
        mc('You cloned a project. What do you run before starting it?', ['npm install', 'npm delete', 'git push', 'npm publish'], 0),
        term({
          id: 'tools-t6', task: 'Start a Node project in `tavern-app`: create a `package.json`, install `express` as a dependency and `vitest` as a dev dependency. Then look at the result with `cat package.json`.',
          hint: '`npm init -y`, then `npm install express`, then `npm install -D vitest`.',
          setup: { 'tavern-app/': '' }, cwd: 'tavern-app',
          check: (sh) => { const p = sh.files.get(`${H}/tavern-app/package.json`); if (!p) return false; const j = JSON.parse(p); return !!j.dependencies?.express && !!j.devDependencies?.vitest; },
          solution: ['npm init -y', 'npm install express', 'npm install -D vitest'],
        }),
      ]),
      lesson('tools-4-3', 'Scripts, Vite and builds', [
        teach('From code to website', 'During development, a **dev server** shows changes instantly:\n\n```\nnpm run dev     # e.g. Vite at http://localhost:5173\n```\nFor production, a **build** bundles and minifies everything into a `dist/` folder that you upload to a host:\n\n```\nnpm run build\n```'),
        mc('What does `npm run build` usually create?', ['An optimised dist/ folder ready to deploy', 'A new Git branch', 'A database', 'The node_modules folder'], 0),
        mc('What is Vite?', ['A fast build tool and dev server', 'A CSS framework', 'A database', 'A browser'], 0),
        mcc('How do you run the `test` script?', '"scripts": {\n  "dev": "vite",\n  "test": "vitest"\n}', ['npm run test', 'npm test.js', 'run test', 'node test'], 0, '`npm test` also works as a shortcut for this one script.', 'json'),
        match('Match the tool', [['Vite', 'Build tool / dev server'], ['npm', 'Package manager'], ['Node.js', 'Runs JS outside the browser'], ['dist/', 'Output of a build']]),
      ]),
    ]),
    unit('tools-u5', 'Debugging Like a Pro', 'DevTools, error messages, stack traces and breakpoints.', `
**Key ideas**
- DevTools panels: **Elements** (HTML/CSS), **Console** (logs, errors), **Network** (requests), **Sources** (breakpoints), **Application** (storage).
- Read error messages: the **type** (TypeError...), the **message**, and the **file:line** in the stack trace.
- \`console.log\`, \`console.table\`, and the \`debugger\` statement / breakpoints to pause code.
- Strategy: reproduce → read the error → form a guess → test one change → repeat. Comment out halves to find the culprit.`, [
      lesson('tools-5-1', 'A tour of DevTools', [
        teach('Your X-ray glasses', 'Open DevTools with **F12** (or right-click → Inspect):\n- **Elements**: see and edit the HTML and CSS live\n- **Console**: logs and errors, and you can type JS\n- **Network**: every request, its status and timing\n- **Sources**: set breakpoints and step through code\n- **Application**: localStorage, cookies'),
        match('Which panel?', [['A request returns 404', 'Network'], ['A button has the wrong colour', 'Elements'], ['An error message appeared', 'Console'], ['Pause code on line 20', 'Sources']]),
        tf('Changes you make in the Elements panel are saved to your files.', false, 'They are only temporary experiments in the browser. Copy what works into your code.'),
        mc('`console.table(knights)` shows...', ['An array of objects as a table', 'A red error', 'Only the first item', 'Nothing'], 0),
      ]),
      lesson('tools-5-2', 'Reading error messages', [
        teach('Errors are clues', '```\nUncaught TypeError: Cannot read properties of undefined (reading \'name\')\n    at showHero (app.js:14:23)\n    at main (app.js:30:3)\n```\n- **TypeError**: the kind of error\n- the message: something was `undefined` when we read `.name`\n- the **stack trace**: where it happened, **app.js line 14**, called from line 30'),
        mcc('On which line did the error happen?', 'Uncaught ReferenceError: gold is not defined\n    at buy (shop.js:8:5)\n    at onClick (shop.js:21:3)', ['8 in shop.js', '21 in shop.js', '5', 'Unknown'], 0, 'The top line of the stack trace is where it actually happened.', 'text'),
        mc('"Cannot read properties of undefined (reading \'name\')" means...', ['You used .name on something that is undefined', 'The variable name is misspelled in CSS', 'The page has no title', 'name is a reserved word'], 0),
        match('Match the error', [['ReferenceError', 'Using a variable that does not exist'], ['TypeError', 'Wrong kind of value (e.g. calling a non-function)'], ['SyntaxError', 'Code that cannot be read (missing bracket)'], ['404 in Network', 'The file or endpoint was not found']]),
        bug('The console says "TypeError: knight is undefined" at line 3. Which line is the real cause?', 'const knights = [{ id: 1, name: "Ada" }];\nconst knight = knights.find((k) => k.id === "1");\nconsole.log(knight.name);', 2, 'The crash is on line 3, but the cause is line 2: `"1"` (text) never equals `1` (number), so `find` returns `undefined`.'),
      ]),
      lesson('tools-5-3', 'Breakpoints and strategy', [
        teach('Pause time', 'Add a **breakpoint** by clicking a line number in DevTools → Sources, or write `debugger;` in your code. The code pauses there and you can inspect every variable, then **step over** line by line.\n\nA good debugging process:\n1. Reproduce the bug reliably\n2. Read the error and stack trace\n3. Guess the cause\n4. Test **one** change\n5. Repeat'),
        order('Order a good debugging process', ['Reproduce the bug', 'Read the error and stack trace', 'Form a guess about the cause', 'Test one change', 'Check if the bug is gone'], undefined, 'text'),
        mc('What does the `debugger;` statement do when DevTools is open?', ['Pauses the code at that line', 'Fixes the bug', 'Deletes the line', 'Prints all variables'], 0),
        mc('A big function is broken and you have no idea where. A classic trick is to...', ['Comment out half and see if the bug remains (then repeat)', 'Rewrite everything', 'Add random changes', 'Wait for it to fix itself'], 0),
        tf('Before asking for help, it is good to write down what you tried.', true),
      ]),
      node('tools-bughunt', 'Bug hunt: spot the mistakes', 'challenge', [
        teach('Bug hunt!', 'Time to use your debugging eyes. Each snippet has **one** broken line. Read carefully, like a code reviewer.'),
        bug('Find the bug', 'const prices = [5, 10, 15];\nlet total = 0;\nfor (let i = 1; i < prices.length; i++) {\n  total += prices[i];\n}\nconsole.log(total);', 3, 'The loop starts at `1`, so it skips the first price. Arrays start at index `0`.'),
        bug('Find the bug', 'function isAdult(age) {\n  if (age > 18) {\n    return true;\n  }\n  return false;\n}', 2, 'An 18-year-old is an adult: use `>=`.'),
        bug('Find the bug', 'const form = document.querySelector("form");\nform.addEventListener("submit", (e) => {\n  console.log("Sent!");\n});', 3, 'Without `e.preventDefault()`, the page reloads and the log disappears.'),
        bug('Find the bug', 'async function load() {\n  const res = await fetch("/api/quests");\n  const quests = res.json();\n  return quests.length;\n}', 3, '`res.json()` returns a promise: it needs `await`.'),
        bug('Find the bug', 'const user = { name: "Ada" };\nconst copy = user;\ncopy.name = "Bo";\nconsole.log(user.name); // expected "Ada"', 2, '`copy = user` points to the same object. Use `{ ...user }` to make a copy.'),
      ]),
    ]),
  ],
};
