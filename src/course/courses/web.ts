// Section: Web Foundations. No code yet: how the web works and how programmers think.
import type { Course } from '../types';
import { teach, mc, mcc, tf, match, order, type, lesson, unit } from '../dsl';

export const web: Course = {
  id: 'web', title: 'Web Foundations', realm: 'The Village Gate', color: '#c2703d', emblem: 'castle',
  desc: 'How the internet and websites work, and how programmers think.',
  units: [
    unit('web-u1', 'How the Web Works', 'Browsers, servers, addresses and the three languages of the web.', `
**Key ideas**
- A **browser** (Chrome, Firefox, Safari, Edge) shows web pages.
- A **server** is a computer that sends pages when a browser asks for them.
- A **URL** is an address: \`https://realm.dev/quests?level=2\` = protocol + domain + path + query.
- Browsers and servers talk with **HTTP**: the browser sends a *request*, the server sends a *response* with a *status code* (200 OK, 404 Not Found, 500 Server Error).
- **HTML** builds the structure, **CSS** adds style, **JavaScript** adds behaviour.
- The **front end** runs in the browser; the **back end** runs on the server (databases, logins, payments).`, [
      lesson('web-1-1', 'Browsers and servers', [
        teach('The web is a conversation', 'When you open a website, your **browser** (the app you use to visit websites) asks another computer, called a **server**, for the page.\n\nThe server answers by sending files back, and your browser draws the page on your screen.'),
        mc('What is a browser?', ['A program that shows web pages', 'A computer that stores websites', 'A kind of cable', 'A programming language'], 0),
        mc('Which of these is a browser?', ['Firefox', 'Wi-Fi', 'HTML', 'Google Search'], 0, 'Google Search is a *website*. Chrome is Google\'s browser.'),
        tf('A server is a computer that sends websites to other computers when they ask.', true),
        match('Match each word to its meaning', [['Browser', 'Shows pages to you'], ['Server', 'Sends pages when asked'], ['Internet', 'The network linking computers'], ['Website', 'A group of related pages']]),
        order('Put the steps in order', ['You type an address', 'The browser asks the server', 'The server sends the files', 'The browser shows the page'], undefined, 'text'),
        mc('When your browser asks a server for something, that message is called a...', ['request', 'response', 'download', 'cookie'], 0, 'The browser sends a **request**; the server replies with a **response**.'),
        tf('A website lives inside your browser, even when you are offline.', false, 'The files live on a server. Your browser downloads them when you visit.'),
      ]),
      lesson('web-1-2', 'Web addresses (URLs)', [
        teach('Anatomy of a URL', 'A **URL** is the address of a page:\n\n```\nhttps://shop.realm.dev/swords?color=gold\n```\n- `https` is the **protocol** (how to talk)\n- `shop.realm.dev` is the **domain** (which server)\n- `/swords` is the **path** (which page)\n- `?color=gold` is the **query** (extra options)'),
        match('Match the parts of https://shop.realm.dev/swords?color=gold', [['https', 'Protocol'], ['shop.realm.dev', 'Domain'], ['/swords', 'Path'], ['?color=gold', 'Query']]),
        mc('In `https://maps.realm.dev/castles/42`, what is the path?', ['/castles/42', 'maps.realm.dev', 'https', 'realm.dev'], 0),
        mc('In `https://realm.dev/search?q=dragon`, what does the query ask for?', ['A search for "dragon"', 'The domain called q', 'A secure connection', 'Page number 42'], 0),
        tf('`https` is safer than `http` because the connection is encrypted.', true, 'The "s" stands for *secure*: nobody in between can read the data.'),
        type('Which protocol should every modern website use? Type it.', ['https'], { placeholder: 'protocol' }),
        teach('Names and numbers', 'Computers find each other with numbers called **IP addresses** (like `93.184.216.34`). Humans prefer names like `realm.dev`.\n\nThe **DNS** (Domain Name System) is the internet\'s phone book: it turns a domain name into an IP address.'),
        mc('What does DNS do?', ['Turns a domain name into an IP address', 'Makes websites faster to load', 'Stores your passwords', 'Draws the page on the screen'], 0),
        tf('Two different websites can share the exact same domain name.', false, 'A domain name is unique, like a postal address. Whoever registers it owns it.'),
      ]),
      lesson('web-1-3', 'Requests and responses', [
        teach('HTTP: the language of the web', 'Browsers and servers talk using **HTTP**. Each request has a **method**:\n- `GET`: "give me something" (open a page)\n- `POST`: "here is new data" (send a form)\n\nEach response has a **status code**:\n- `200` OK\n- `404` Not Found\n- `500` Server Error'),
        mc('You open a page to read it. Which HTTP method does the browser use?', ['GET', 'POST', 'DELETE', 'SEND'], 0),
        mc('You submit a sign-up form. Which method is used to send the new data?', ['POST', 'GET', 'READ', 'OPEN'], 0),
        match('Match the status code with its meaning', [['200', 'OK, here you go'], ['404', 'Not found'], ['500', 'The server had an error'], ['301', 'Moved to a new address']]),
        tf('A 404 error means the server crashed.', false, '404 means the page does not exist. A crash is usually a 5xx code, like 500.'),
        mc('Status codes starting with 4 (like 403 or 404) usually mean...', ['The request has a problem (client error)', 'Everything worked', 'The server is broken', 'The page moved'], 0, '4xx = the request is wrong (missing page, not allowed). 5xx = the server failed.'),
        teach('What comes back', 'A response is not only HTML. A server can send **HTML** pages, **CSS** files, **JavaScript** files, **images**, and data in a format called **JSON**.\n\nOne web page usually needs many requests: one for the HTML, then more for its styles, scripts and images.'),
        tf('Loading one web page can take many requests.', true),
        mc('Which format do servers often use to send plain data to apps?', ['JSON', 'MP3', 'PDF', 'ZIP'], 0, 'JSON looks like `{ "name": "Ada", "level": 3 }`. You will use it a lot.'),
      ]),
      lesson('web-1-4', 'The three languages', [
        teach('HTML, CSS and JavaScript', 'Every website uses three languages:\n- **HTML** builds the structure (walls and rooms)\n- **CSS** makes it look good (paint and banners)\n- **JavaScript** makes it do things (magic!)'),
        match('Match the language with its job', [['HTML', 'Structure and content'], ['CSS', 'Colours and layout'], ['JavaScript', 'Behaviour and logic']]),
        mc('You want the title to be red. Which language do you use?', ['CSS', 'HTML', 'JavaScript', 'SQL'], 0),
        mc('You want a message to appear when someone clicks a button. Which language?', ['JavaScript', 'CSS', 'HTML', 'HTTP'], 0),
        mcc('Which language is this?', '<h1>Welcome to the castle</h1>', ['HTML', 'CSS', 'JavaScript', 'JSON'], 0, undefined, 'html'),
        mcc('Which language is this?', 'h1 {\n  color: red;\n}', ['CSS', 'HTML', 'JavaScript', 'JSON'], 0, undefined, 'css'),
        mcc('Which language is this?', 'button.addEventListener("click", () => {\n  alert("Hail!");\n});', ['JavaScript', 'CSS', 'HTML', 'SQL'], 0),
        tf('A web page can work with HTML alone, without CSS or JavaScript.', true, 'It will be plain, but it works. HTML is the foundation; CSS and JS are added on top.'),
      ]),
      lesson('web-1-5', 'Front end and back end', [
        teach('Two sides of every app', 'The **front end** is everything that runs in the browser: what you see and click.\n\nThe **back end** runs on servers: it stores data in **databases**, checks passwords, takes payments and sends data to the front end.\n\nA **full-stack** developer works on both.'),
        match('Match each word with its meaning', [['Front end', 'Runs in the browser'], ['Back end', 'Runs on the server'], ['Database', 'Stores the data'], ['Full-stack', 'Works on both sides']]),
        mc('Where should a password be checked?', ['On the back end (server)', 'In the CSS', 'In the browser only', 'In the URL'], 0, 'Anything in the browser can be seen and changed by the user, so secrets and checks belong on the server.'),
        mc('What is a database?', ['An organised store of data', 'A fast browser', 'A kind of web page', 'A design tool'], 0),
        tf('React, Vue and Svelte are tools for building front ends.', true),
        mc('A developer who builds both the interface and the server is called...', ['Full-stack', 'Half-stack', 'Back-office', 'Cross-browser'], 0),
        mc('Which language runs **both** in the browser and on servers (with Node.js)?', ['JavaScript', 'CSS', 'HTML', 'SQL'], 0),
      ]),
    ]),
    unit('web-u2', 'Thinking Like a Programmer', 'Programs, algorithms, bugs and the tools developers use.', `
**Key ideas**
- A **program** is a list of instructions. The computer follows them exactly, in order.
- An **algorithm** is a step-by-step plan to solve a problem. Break big problems into small steps.
- Repeated steps become **loops**; decisions ("if it rains...") become **conditions**.
- A **bug** is a mistake in a program. Debugging = finding and fixing it: read the error, change one thing at a time, test again.
- Developers write code in an **editor** (like VS Code), save files with extensions (\`.html\`, \`.css\`, \`.js\`) and use the browser **DevTools** (F12).
- Good learners practise a little every day, read the docs (MDN), and ask clear questions.`, [
      lesson('web-2-1', 'What is a program?', [
        teach('Instructions, in order', 'A **program** is a list of instructions for a computer. The computer follows them **exactly** and **in order**, one after another.\n\nComputers are fast, but they do not guess what you meant. That is why precise instructions matter.'),
        tf('A computer understands what you meant, even when your instructions are unclear.', false, 'Computers do exactly what the code says, nothing more and nothing less.'),
        order('Put the instructions for making toast in order', ['Take a slice of bread', 'Put it in the toaster', 'Press the lever down', 'Wait until it pops up', 'Spread the butter'], undefined, 'text'),
        mc('What is the best description of a program?', ['Exact instructions a computer follows in order', 'A picture on a screen', 'A kind of computer', 'A website address'], 0),
        mc('A robot must follow: "Walk forward. Turn left. Walk forward." What happens if you swap the last two lines?', ['It ends in a different place', 'Nothing changes', 'The robot refuses', 'It walks twice as far'], 0, 'Order matters! Changing the order changes the result.'),
        match('Match the word with its meaning', [['Code', 'Text written in a programming language'], ['Program', 'A set of instructions that does a job'], ['Programmer', 'A person who writes code'], ['Run', 'Tell the computer to do the instructions']]),
        tf('The same task can often be solved by many different programs.', true),
      ]),
      lesson('web-2-2', 'Algorithms and patterns', [
        teach('Break it down', 'An **algorithm** is a step-by-step plan. Programmers solve big problems by breaking them into small steps.\n\nLook for **patterns**:\n- Steps that repeat → a **loop** ("do this 10 times")\n- Decisions → a **condition** ("if it rains, take an umbrella")'),
        mc('"Knock on each of the 20 doors in the street." Which idea fits best?', ['A loop', 'A condition', 'A variable name', 'A bug'], 0),
        mc('"If the door is locked, use the key." Which idea fits best?', ['A condition', 'A loop', 'A comment', 'An error'], 0),
        order('An algorithm to find the tallest knight in a line', ['Remember the first knight as the tallest', 'Look at the next knight', 'If they are taller, remember them instead', 'Repeat until you reach the end of the line', 'Announce the tallest knight'], undefined, 'text'),
        tf('An algorithm must be written in a programming language.', false, 'An algorithm is the plan. You can write it in plain words first, then turn it into code.'),
        mc('Why do programmers break big problems into smaller steps?', ['Small steps are easier to solve and test', 'Computers cannot run long programs', 'It makes the program slower', 'It is required by law'], 0),
        match('Match the everyday task with the programming idea', [['Repeat 10 push-ups', 'Loop'], ['If hungry, eat', 'Condition'], ['Write your name on a box', 'Variable'], ['A recipe', 'Algorithm']]),
      ]),
      lesson('web-2-3', 'Bugs and debugging', [
        teach('Everyone writes bugs', 'A **bug** is a mistake in a program. All programmers, even experts, write bugs every day.\n\n**Debugging** means finding and fixing them:\n1. Read the error message carefully\n2. Find where it happens\n3. Change **one** thing\n4. Test again'),
        tf('Good programmers never make mistakes.', false, 'Good programmers make mistakes all the time. They are just good at finding and fixing them.'),
        order('Put the debugging steps in order', ['Read the error message', 'Find the line where it happens', 'Change one thing', 'Run the code again to test'], undefined, 'text'),
        mc('Your code shows an error. What should you do first?', ['Read the error message carefully', 'Delete all the code', 'Restart the computer', 'Change many things at once'], 0),
        mc('Why change only one thing at a time when debugging?', ['So you know which change fixed (or broke) it', 'Because editors only allow one change', 'To make the program faster', 'It does not matter'], 0),
        teach('The rubber duck', 'A famous trick: explain your code, line by line, to a rubber duck (or a friend, or a pet). Saying it out loud often reveals the bug. It is called **rubber duck debugging**.'),
        tf('Explaining your code out loud can help you find bugs.', true),
        mc('The word "bug" became famous when engineers found a real insect stuck in a computer. Today a bug means...', ['A mistake in a program', 'A computer virus', 'A slow internet connection', 'A broken screen'], 0),
      ]),
      lesson('web-2-4', 'Your tools', [
        teach('The developer\'s workshop', 'Developers write code in a **code editor**. The most popular one is **VS Code** (free).\n\nCode is saved in **files** inside **folders**. The file **extension** tells what is inside:\n- `.html` for HTML\n- `.css` for CSS\n- `.js` for JavaScript'),
        match('Match the file to its language', [['index.html', 'HTML'], ['style.css', 'CSS'], ['app.js', 'JavaScript'], ['data.json', 'JSON data']]),
        mc('What is VS Code?', ['A free code editor', 'A programming language', 'A web browser', 'A website builder for kids only'], 0),
        teach('DevTools', 'Every browser has built-in **DevTools** (open them with **F12** or right-click → *Inspect*). You can:\n- see the HTML of any page\n- try CSS changes live\n- read errors in the **Console**'),
        mc('How do you usually open the browser DevTools?', ['Press F12 or right-click → Inspect', 'Type "devtools" in the URL bar', 'Restart the browser', 'Install a new browser'], 0),
        mc('Where do JavaScript errors appear in DevTools?', ['In the Console', 'In the URL bar', 'In the bookmarks', 'In the downloads list'], 0),
        tf('The main page of a website is usually called index.html.', true, 'Servers look for `index.html` by default when you visit a folder.'),
        type('What extension does a JavaScript file have? (for example: .txt)', ['.js', 'js'], { placeholder: '.ext' }),
      ]),
      lesson('web-2-5', 'How to learn code', [
        teach('Learning like a pro', 'Nobody memorises everything. Professional developers:\n- practise **a little every day**\n- read the **documentation** (for the web: **MDN**, developer.mozilla.org)\n- search for error messages\n- ask clear questions, showing their code and the error'),
        mc('Which site is the best reference for HTML, CSS and JavaScript?', ['MDN (developer.mozilla.org)', 'A random forum post from 2009', 'A social media app', 'A video game wiki'], 0),
        tf('Professional developers look things up all the time.', true, 'Searching and reading docs is a core skill, not cheating.'),
        mc('Which question is easiest for someone to answer?', ['"My button does nothing when clicked. Here is my code and the error from the console."', '"My code is broken, help!"', '"Why doesn\'t it work?"', '"Is coding hard?"'], 0),
        mc('AI assistants can write code. What is the smart way to use them while learning?', ['Ask them to explain, then write and understand the code yourself', 'Copy everything without reading it', 'Never check their answers', 'Use them instead of practising'], 0, 'AI tools make mistakes. You need to understand code to notice them. That is why learning the basics still matters.'),
        mc('What helps you remember new skills best?', ['Short practice every day', 'One 10-hour session per month', 'Reading without trying', 'Only watching videos'], 0, 'Short daily practice beats long rare sessions. That is why this game has streaks!'),
        match('Match the habit with why it helps', [['Daily practice', 'Builds memory'], ['Reading error messages', 'Finds bugs faster'], ['Building projects', 'Shows employers your skills'], ['Asking clear questions', 'Gets better help']]),
      ]),
    ]),
  ],
};
