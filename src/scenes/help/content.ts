// Everything Lumi (the helper fairy) can say: what each screen is for, step-by-step
// tours that point at the real buttons, "I'm stuck" advice, and the FAQ.

/** One step of a guided tour. `target` is a UI id (or a list: the first one on screen wins). */
export interface TourStep { target?: string | string[]; title: string; text: string }
/** Advice for when the player is stuck. `action` presses a button of the screen for them. */
export interface StuckTip { q: string; a: string; action?: { label: string; ui?: string | string[]; go?: string } }
export interface ScreenHelp { title: string; icon: string; about: string; steps: TourStep[]; stuck: StuckTip[]; faq: string[] }

const LEAVE_TIP: StuckTip = { q: 'I want to do something else', a: 'That is fine! Your progress is saved after every lesson, game and field. Come back any time.' };

export const SCREEN_HELP: Record<string, ScreenHelp> = {
  World: {
    title: 'The village of Codehaven', icon: 'map',
    about: 'This is your home base. Every building is a part of the game: **lessons** in the Academy, **coding puzzles** on the Farm, **games and items** in the Tavern, **quests** at the Guild. Walk to a door (or click a building) to go in.',
    steps: [
      { title: 'Welcome, adventurer!', text: 'I am **Lumi**, your guide. This quick tour shows you around the village. You can replay it any time from the **Help** button.' },
      { target: 'world.hero', title: 'This is you', text: 'Move with the **arrow keys** or **WASD**, or **click the ground** to walk there. On a phone, tap where you want to go.' },
      { target: 'place.learn', title: 'The Academy', text: 'Start here! Short lessons teach you to code, step by step, from zero. Click the castle to walk to its door.' },
      { target: 'place.farm', title: 'Greenhollow Farm', text: 'Program a farmer to plant and harvest. You start with **blocks** and end up writing real **JavaScript**.' },
      { target: 'place.practice', title: 'The Tavern', text: 'Minigames, practice and a **merchant** who sells hints and potions for gold.' },
      { target: 'hud.hotbar', title: 'The travel bar', text: 'A shortcut to every building. You do not have to walk if you are in a hurry.' },
      { target: 'hud.hero', title: 'Your hero', text: 'Your **level** and **XP**. The green bar is today\'s goal. Click it to see your profile.' },
      { target: 'hud.resources', title: 'Streak, gold and items', text: '**Streak** = days in a row you learned. **Gold** buys items. **Hearts** are lost on wrong answers in lessons. Lightbulbs give hints, torches give second chances, potions give hearts.' },
      { target: 'hud.help', title: 'Need help? Tap me!', text: 'I am always here. Tap me on any screen to see what it does, get a tour, or get unstuck.' },
    ],
    stuck: [
      { q: 'I don\'t know what to do first', a: 'Go to **the Academy** and press the glowing stop on the map. Lessons are short (2-5 minutes).', action: { label: 'Open the Academy', go: 'learn' } },
      { q: 'My hero won\'t move', a: 'Click on the game first, then use the arrow keys or WASD. Or just click the place you want to walk to. Buildings and trees block the way, so walk around them.' },
      { q: 'How do I go inside a building?', a: 'Walk to its door and press **Enter** (or the Enter button that appears). Clicking a building walks there and goes in automatically.' },
      { q: 'I can\'t find a building', a: 'Use the travel bar at the bottom of the screen. It opens every building directly.' },
    ],
    faq: ['start', 'save', 'xp', 'streak', 'hearts'],
  },
  'W:learn': {
    title: 'The Academy', icon: 'castle',
    about: 'Your learning path, drawn as a map. Each **stop** is a short lesson. Finish one to unlock the next. Along the way you will meet **review stops** (to remember), **minigames**, **coding challenges** and a **unit test** at the end of each unit.',
    steps: [
      { target: 'node.current', title: 'Your next lesson', text: 'The glowing stop is where you are. Click it, then press **Start**.' },
      { target: 'learn.path', title: 'Your path', text: 'The path you chose (for example *Web Developer*). You can switch paths any time at the **Path Board**.' },
      { target: 'learn.pace', title: 'Your pace', text: 'I watch how you do. If a topic is hard, I add **review stops**. If it is easy, I offer **shortcuts** to skip ahead.' },
      { target: ['learn.next', 'learn.prev'], title: 'More of the map', text: 'The map is split into sections, one unit at a time. Use the arrows to look ahead or back.' },
      { target: 'window.close', title: 'Back to the village', text: 'Close the window (or press **Esc**) to go back outside.' },
    ],
    stuck: [
      { q: 'A stop is locked', a: 'Stops open in order. Finish the glowing one first. Strong learners get a **shortcut** stop to jump ahead.' },
      { q: 'The lessons are too easy', a: 'Answer well and I will offer **shortcut** stops to jump to the next unit. You can also pick a more advanced path at the Path Board.', action: { label: 'Open the Path Board', go: 'paths' } },
      { q: 'The lessons are too hard', a: 'Take it slow: use **lightbulbs** for hints, turn **Hearts** off in Settings (Relaxed mode), and replay earlier lessons. Mistakes come back later so you can learn them.' },
      { q: 'What is a review stop?', a: 'A short lesson with questions you missed before. They help you remember. They are quick, I promise.' },
    ],
    faq: ['lesson-types', 'review', 'unit-test', 'paths', 'hearts'],
  },
  'W:paths': {
    title: 'The Path Board', icon: 'board',
    about: 'A **path** is a list of courses in a good order for a goal: web design, front-end, back-end, data, and more. Pick one and the Academy map follows it. Your finished lessons count in every path.',
    steps: [
      { title: 'Choose a path', text: 'Click a path card to see its courses, then pick it. You keep everything you already learned.' },
      { target: 'window.close', title: 'Done?', text: 'Close the board to go back to the village.' },
    ],
    stuck: [{ q: 'Which path should I pick?', a: 'New to coding? **Web Designer** (HTML and CSS) shows results fastest. Want games or apps? Try the JavaScript paths. Data lover? The SQL path.' }],
    faq: ['paths', 'languages'],
  },
  'W:farm': {
    title: 'Greenhollow Farm', icon: 'tree',
    about: '30 fields, each a small puzzle. You write a **program** for the farmer: move, plant, water, harvest. Chapters 1-3 use **blocks**, then blocks turn into **JavaScript**, and at the end you type real code.',
    steps: [
      { target: ['farm.continue', 'farm.f1'], title: 'Pick a field', text: 'Click a field to play it. Each one gives up to **3 stars**.' },
      { title: 'Stars', text: '1 star = all goals done. 2 stars = **no mistakes** (no bumping, no planting on grass). 3 stars = a **short program** (the "par").' },
    ],
    stuck: [
      { q: 'A field is locked', a: 'Fields open one by one. Finish the one before it (1 star is enough).' },
      { q: 'I can\'t get 3 stars', a: 'The third star wants a short program. Look for repeated blocks and put them in a **repeat** loop.' },
    ],
    faq: ['farm', 'blocks-to-code'],
  },
  'W:practice': {
    title: 'The Tavern', icon: 'mug',
    about: 'Practice what you learned. Replay your **mistakes**, play **minigames** for items, and buy hints or potions from the **merchant**.',
    steps: [
      { target: ['arcade.bughunt', 'arcade.link'], title: 'Minigames', text: 'Quick games about the topics you learned. Stars give **items** (lightbulbs, torches, potions).' },
      { target: ['buy.bulb', 'buy.torch'], title: 'The merchant', text: 'Spend gold on items. You earn gold in lessons, games, fields and quests.' },
    ],
    stuck: [
      { q: 'A minigame is locked', a: 'Each minigame needs a few lessons of its topic first. Keep going in the Academy.' },
      { q: 'I have no gold', a: 'Finish lessons (5 gold each, more if perfect), quests and minigames. Daily quests are a quick way to earn some.', action: { label: 'See today\'s quests', go: 'quests' } },
    ],
    faq: ['items', 'gold', 'games'],
  },
  'W:quests': {
    title: 'The Guild Hall', icon: 'board',
    about: 'Three new **daily quests** every day (like "finish 2 lessons"). Done quests give gold and XP: press **Claim** to collect. You can also buy a **streak freeze** here.',
    steps: [{ title: 'Daily quests', text: 'Quests fill up while you play. Come back and press **Claim** when one is done.' }],
    stuck: [{ q: 'My quest did not count', a: 'Some quests only count lessons (not reviews), or need a perfect lesson. Read the quest text closely.' }],
    faq: ['streak', 'gold'],
  },
  'W:skills': {
    title: 'The Library', icon: 'book',
    about: 'All your **skills**, one per course: how far you went and how fresh it is in your memory. Skills fade a little over time: practice them to keep them strong.',
    steps: [{ title: 'Your skills', text: 'Each book is a course. The bar shows progress. Press **Practice** for a quick mixed session of that course.' }],
    stuck: [{ q: 'A skill is getting weak', a: 'That is normal: memory fades. A short practice session makes it strong again.' }],
    faq: ['review', 'languages'],
  },
  'W:trophies': {
    title: 'Hall of Trophies', icon: 'trophy',
    about: 'Your **achievements**. Grey ones are still to win: the text tells you how.',
    steps: [{ title: 'Achievements', text: 'Finish courses, keep streaks, play games and farm to unlock them all.' }],
    stuck: [],
    faq: ['xp'],
  },
  'W:profile': {
    title: 'Your Cottage', icon: 'helm',
    about: 'Your hero: name, look, class, level and stats. Change your tunic colour or class any time.',
    steps: [{ title: 'Your hero', text: 'Change the look of your hero here. It does not change your progress.' }],
    stuck: [],
    faq: ['save', 'xp'],
  },
  'W:settings': {
    title: 'Settings', icon: 'gear',
    about: 'Sound, music, **Hearts** on or off (Relaxed mode), daily goal, code font and size, tips, and a backup of your save.',
    steps: [{ title: 'Settings', text: 'Changes are saved at once. Turn off **Hearts** if mistakes make you nervous: you still learn the same.' }],
    stuck: [],
    faq: ['hearts', 'save', 'font'],
  },
  'W:help': {
    title: 'Help & FAQ', icon: 'hint',
    about: 'Answers to common questions. Type in the search box or pick a topic.',
    steps: [],
    stuck: [],
    faq: [],
  },
  Homestead: {
    title: 'Your Homestead', icon: 'home',
    about: 'Your own little farm. **Grow vegetables** in the garden plots and **care for animals** in the pen. Crops grow in real time (minutes to hours), so plant before a lesson and harvest after. Sell what you grow at the **market stall** for gold.',
    steps: [
      { target: 'home.hero', title: 'Walk around', text: 'Move with **WASD** or the **arrow keys**, or click the ground. Stand next to something and press **Space** to use it.' },
      { target: 'plot.0', title: 'Garden plots', text: 'Press **Space** (or click) on an empty plot to plant a seed. **Water** it to make it grow faster. When it is ripe, harvest it.' },
      { target: ['home.stall', 'home.shop'], title: 'The market stall', text: 'Buy seeds, hay, new plots and animals here, and sell your vegetables, eggs, milk and wool.' },
      { target: 'home.basket', title: 'Your basket', text: 'Everything you harvested or collected. Pets eat vegetables from your basket too.' },
    ],
    stuck: [
      { q: 'Nothing is growing', a: 'Crops grow in **real time**. Each seed shows how long it takes. Watered plots grow faster. Check back after a lesson!' },
      { q: 'My plants withered', a: 'If you stay away for a long time, weeds grow and ripe crops can wither. Press **Space** on the plot to clear it and plant again.' },
      { q: 'How do I get an animal?', a: 'Buy one at the market stall (Animals tab). Feed it **hay** once a day and it gives eggs, milk, wool or truffles. Pet it to make it happy.', action: { label: 'Open the shop', ui: 'home.shop' } },
      { q: 'I have no gold for seeds', a: 'Finish a lesson or a daily quest, then come back. Wheat is the cheapest seed and grows in 3 minutes: a good start.' },
      LEAVE_TIP,
    ],
    faq: ['homestead', 'move', 'away'],
  },
  'W:pets': {
    title: 'The Pet Sanctuary', icon: 'heart',
    about: 'Hatch **eggs** into pets, care for them, and complete your **Petdex**. There are **20 kinds** of pets, from common bunnies to **ultra rare** phoenixes, and any of them can hatch **shiny** (1 in 20). Your active pet follows you and gives a small **XP bonus** when it is happy.',
    steps: [
      { target: ['egg.hatch.0', 'egg.0'], title: 'Eggs', text: 'Eggs warm up while you learn: every **XP** you earn counts. When an egg is ready, press **Hatch!**' },
      { target: ['pet.feed.0', 'pet.play.0'], title: 'Care', text: 'Feed your pet vegetables from your homestead and play with it. Happy pets give more XP and follow you around the village.' },
      { target: ['egg.buy.common', 'window.close'], title: 'More eggs', text: 'Buy eggs with gold. Rarer eggs cost more but have better odds of rare pets.' },
    ],
    stuck: [
      { q: 'My egg will not hatch', a: 'Eggs hatch with **XP**. Finish a lesson, a minigame or a battle and come back.', action: { label: 'Go to the Academy', go: 'learn' } },
      { q: 'My pet is sad', a: 'It is hungry or lonely. Feed it and play with it. Pets get sad if you stay away for many days, but they always forgive you.' },
      { q: 'I have no food for my pet', a: 'Pets eat vegetables and animal products from your homestead basket.', action: { label: 'Go to the homestead', go: 'home' } },
    ],
    faq: ['pets', 'shiny'],
  },
  'W:battle': {
    title: 'The Monster Gate', icon: 'sword',
    about: 'Monsters made of bugs live beyond the gate. Each **region** has its own monsters and a **boss**. You fight with what you learned: **Strike** answers a question, **Spell** asks you to type a word fast. The final **Junior Trial** against the Elder Dragon is the exam of your path.',
    steps: [
      { target: ['fight.meadow.slime', 'window.close'], title: 'Pick a monster', text: 'Click a monster (or **Fight**) to start a battle. Harder regions open as your level grows.' },
      { target: ['boss.meadow', 'window.close'], title: 'Bosses', text: 'Each region has a boss. Bosses hit hard but give big rewards, rare eggs and achievements. The last ones are dragons.' },
      { target: ['trial', 'window.close'], title: 'The Junior Trial', text: 'When most of your path is done, face the Trial. Win it to earn the **Junior Developer** rank.' },
    ],
    stuck: [
      { q: 'I keep losing', a: 'Fight easier monsters first to gain levels. Use **Defend** when your HP is low and drink a **potion**. Questions come from lessons you finished, so review helps too.', action: { label: 'Practice in the Tavern', go: 'practice' } },
      { q: 'A region is locked', a: 'Regions open at higher hero levels. Lessons, games and your homestead all give XP.' },
    ],
    faq: ['battles', 'trial'],
  },
  Battle: {
    title: 'A battle', icon: 'sword',
    about: 'Turn-based battle. On your turn pick an action. **Strike**: answer a question, right = a hit. **Spell**: type the word before the time runs out, fast typing hits harder. **Defend** halves the next hit. **Potion** heals you.',
    steps: [
      { target: ['battle.start', 'act.strike'], title: 'Strike', text: 'Answer a question about what you learned. Right answers hurt the monster, wrong ones let it hit you.' },
      { target: ['act.spell', 'battle.start'], title: 'Spell', text: 'A word appears: type it and press **Enter** before the bar empties.' },
      { target: ['act.defend', 'battle.start'], title: 'Defend', text: 'Take half damage on the next hit. Good when your HP is low.' },
      { target: ['battle.flee', 'battle.help'], title: 'Run away', text: 'You can always leave the battle. Nothing is lost, but you get no reward.' },
    ],
    stuck: [
      { q: 'I don\'t know the answer', a: 'Take your best guess, or **Defend** instead. Every question is from a lesson you finished, and wrong ones come back in your reviews.' },
      { q: 'I type too slowly for spells', a: 'Use **Strike** instead, or practice in the **Rune Typist** minigame at the Tavern.' },
      { q: 'I want to leave', a: 'Press the run-away button at the top. Your progress is saved.', action: { label: 'Run away', ui: 'battle.flee' } },
    ],
    faq: ['battles'],
  },
  'W:inbox': {
    title: 'The Raven Post', icon: 'scroll',
    about: 'Letters from Lumi and the villagers: welcome-back news, gifts, reminders and tips. You can also turn on **browser notifications** here so Lumi reminds you to practise each day.',
    steps: [{ target: ['inbox.notify', 'window.close'], title: 'Daily reminders', text: 'Allow notifications and Lumi will remind you once a day at the time you choose in Settings.' }],
    stuck: [{ q: 'I do not get reminders', a: 'Your browser must allow notifications for this site, and the game must have been opened recently. You can change the time in **Settings**.', action: { label: 'Open Settings', go: 'settings' } }],
    faq: ['notify', 'away'],
  },
  'W:welcome': {
    title: 'Welcome back!', icon: 'heart',
    about: 'While you were away the realm changed: weeds grew, pets missed you and monsters came to the village. One lesson makes everything better again.',
    steps: [{ target: ['wb.lesson', 'window.close'], title: 'Back on track', text: 'Do one short lesson to clean up the village and get a comeback gift.' }],
    stuck: [],
    faq: ['away'],
  },
  Debug: {
    title: 'Developer mode', icon: 'gear',
    about: 'Tools for developers and testers: change XP, gold and items, unlock lessons, skip time, hatch pets, grow crops, start battles, test notifications and jump to any screen. Changes are saved into your game, so make a backup first.',
    steps: [],
    stuck: [],
    faq: ['dev'],
  },
  Lesson: {
    title: 'A lesson', icon: 'scroll',
    about: 'A lesson is a few short questions. Read the question, answer, then press **Check**. Right answers give XP. Wrong answers cost a **heart** (if hearts are on) and come back later so you can learn them.',
    steps: [
      { target: ['opt.0', 'tile.0', 'slot.0', 'match.l.0', 'link.l.0', 'bugline.1', 'type.input'], title: 'Answer here', text: 'Tap an answer (or type it). The line above the answers tells you what to do.' },
      { target: ['lesson.check', 'lesson.continue'], title: 'Check', text: 'When you are ready, press **Check** (or **Enter**). You will see if you are right, and why.' },
      { target: 'lesson.hint', title: 'Lightbulb', text: 'Stuck? A lightbulb removes wrong answers or places a piece for you. Shortcut: **H**.' },
      { target: 'lesson.quit', title: 'Progress bar', text: 'The bar fills as you go. The **X** leaves the lesson (you will start it again later).' },
    ],
    stuck: [
      { q: 'Give me a hint', a: 'A lightbulb lights up a clue for this question.', action: { label: 'Use a lightbulb', ui: 'lesson.hint' } },
      { q: 'I got it wrong and don\'t understand why', a: 'Read the green **correct answer** and the explanation at the bottom. The question will come back later in the lesson, so you get another try.' },
      { q: 'I keep making mistakes', a: 'After two wrong answers in a row I show the teaching card again, and your next lightbulb is **free**. You can also turn Hearts off in Settings.' },
      { q: 'Try again without losing', a: 'Burn a **torch** after a wrong answer to retry at once.', action: { label: 'Use a torch', ui: 'lesson.torch' } },
      { q: 'I ran out of hearts', a: 'Drink a potion, wait (one heart comes back every 20 minutes), or practice old lessons in the Tavern to earn hearts back.', action: { label: 'Drink a potion', ui: 'lesson.potion' } },
      LEAVE_TIP,
    ],
    faq: ['hearts', 'items', 'lesson-types', 'review'],
  },
  'Lesson:code': {
    title: 'A coding challenge', icon: 'code',
    about: 'Here you write real code. Read the **task** on the left, write code in the **editor**, then press **Run & check**. The objectives tick green when your code does what was asked.',
    steps: [
      { target: ['code.task', 'codetab.task'], title: 'The task', text: 'What to build and the **objectives** to pass. Hints are at the bottom of this panel.' },
      { target: ['code.editor', 'term.box', 'codetab.code'], title: 'The editor', text: 'Write your code here. It is a real editor: **Tab** indents, **Ctrl+Enter** runs your code.' },
      { target: ['code.output', 'codetab.result'], title: 'The result', text: 'Your web page, the console output, or the hero\'s map appears here when you run.' },
      { target: 'lesson.check', title: 'Run & check', text: 'Runs your code and checks each objective. Try as many times as you like: no hearts are lost here.' },
    ],
    stuck: [
      { q: 'Give me a hint', a: 'Each challenge has hints, from small to big.', action: { label: 'Show a hint', ui: ['code.hint', 'sql.hint', 'term.hint'] } },
      { q: 'My code shows an error', a: 'Read the error: it often says the **line number**. Common causes: a missing `)` or `}`, a missing quote `"`, or a name spelled differently (JavaScript cares about upper and lower case).' },
      { q: 'Nothing happens when I run', a: 'Did you save the result? In JavaScript, use `console.log(...)` to print. On a web page, check the preview after you run.' },
      { q: 'I broke everything', a: 'Press **Reset** under the editor to get the starting code back.', action: { label: 'Reset the code', ui: 'code.reset' } },
      { q: 'Show me the answer', a: 'After two tries the **Show solution** button appears. Read it, then type it yourself: that is how it sticks.', action: { label: 'Show the solution', ui: 'lesson.solution' } },
      LEAVE_TIP,
    ],
    faq: ['editor', 'errors', 'font'],
  },
  Minigame: {
    title: 'A minigame', icon: 'rune',
    about: 'A quick game about what you learned. Score well for **stars**: each new star gives you an **item**. There is no penalty for losing, so have fun and try again.',
    steps: [
      { target: 'game.host', title: 'The rules', text: 'Your host explains how this game works. Read it before you start.' },
      { target: 'game.rewards', title: 'Stars and prizes', text: 'Score well to win **stars**. Each new star puts items in your satchel.' },
      { target: 'game.play', title: 'Ready?', text: 'Press **Play** (or Enter) to start. There is a clock, so stay sharp!' },
      { target: 'game.bulb', title: 'Items', text: 'A lightbulb reveals an answer. A torch adds time.' },
      { target: 'game.quit', title: 'Leave', text: 'You can leave any time. Your best score is kept.' },
      { target: 'game.help', title: 'Ask me', text: 'If a game confuses you, tap me: I explain how it works.' },
    ],
    stuck: [
      { q: 'Show me an answer', a: 'A lightbulb reveals the answer to the current question.', action: { label: 'Use a lightbulb', ui: 'game.bulb' } },
      { q: 'I need more time', a: 'A torch adds time to the clock.', action: { label: 'Use a torch', ui: 'game.torch' } },
      { q: 'This game is too hard', a: 'The games use the lessons you already did. Replay those lessons, then come back. Even 1 star gives you an item.' },
      LEAVE_TIP,
    ],
    faq: ['games', 'items'],
  },
  FarmLevel: {
    title: 'A farm field', icon: 'tree',
    about: 'Build a **program** for the farmer with blocks. Drag blocks from the left and snap them under **when ▶ Run**. Press **Run** to watch the farmer do exactly what the blocks say, in order.',
    steps: [
      { target: 'farm.say', title: 'Bess explains the job', text: 'Bess the farmer tells you what this field needs.' },
      { target: 'farm.code', title: 'Your program', text: 'Drag blocks from the list on the left into the work area. Snap them **under "when ▶ Run"**, one after the other. Drag a block back to the list to delete it.' },
      { target: 'farm.run', title: 'Run it', text: 'Press **Run** and watch. Blocks light up as they run. **Reset** puts the farm back.' },
      { target: 'farm.goals', title: 'Goals and stars', text: 'Tick every goal for 1 star. No mistakes for 2. A program as short as the **par** for 3.' },
      { target: 'farm.hint', title: 'Hints', text: 'The first hint is free. More hints cost a lightbulb.' },
    ],
    stuck: [
      { q: 'Give me a hint', a: 'Bess will tell you what to try.', action: { label: 'Get a hint', ui: 'farm.hint' } },
      { q: 'The farmer does nothing', a: 'Blocks must be **attached under "when ▶ Run"**. Loose blocks turn grey and do not run. Drag them until they click into place.' },
      { q: 'The farmer walks the wrong way', a: 'Press **Run** at **1x** speed and watch which block lights up when it goes wrong. That is the block to change.' },
      { q: 'How do I delete a block?', a: 'Drag it back to the block list on the left, or onto the bin.' },
      { q: 'Show me the answer', a: 'After two tries a **Solution** button appears next to the hint button.', action: { label: 'Show the solution', ui: 'farm.solution' } },
      LEAVE_TIP,
    ],
    faq: ['farm', 'blocks-to-code'],
  },
  'FarmLevel:code': {
    title: 'A farm field (code)', icon: 'code',
    about: 'Now you type **JavaScript** for the farmer. Click a command at the top of the editor to insert it. Press **Run** (or Ctrl+Enter) to watch the farmer follow your code line by line.',
    steps: [
      { target: 'farm.say', title: 'The job', text: 'Bess explains what this field needs.' },
      { target: 'farm.cmds', title: 'Commands', text: 'Every command the farmer knows. Click one to insert it into your code.' },
      { target: 'farm.code', title: 'Your code', text: 'Type here. Each command ends with `;` and text goes in quotes: `move("right");`' },
      { target: 'farm.run', title: 'Run it', text: 'The running line is highlighted while the farmer works.' },
    ],
    stuck: [
      { q: 'Give me a hint', a: 'Bess will tell you what to try.', action: { label: 'Get a hint', ui: 'farm.hint' } },
      { q: 'I get an error', a: 'Check the spelling (`move`, not `Move`), the quotes around words (`"right"`), and that every `(` has a `)` and every `{` has a `}`.' },
      { q: 'My loop runs forever', a: 'A `while` loop needs something that changes so it can stop. A `for` loop needs `i++` at the end of its first line.' },
      { q: 'Show me the answer', a: 'After two tries a **Solution** button appears.', action: { label: 'Show the solution', ui: 'farm.solution' } },
      LEAVE_TIP,
    ],
    faq: ['farm', 'errors', 'editor'],
  },
  Title: {
    title: 'Realm of Code', icon: 'castle',
    about: 'A medieval adventure where you **learn to code from zero**: HTML, CSS, JavaScript, TypeScript, React, Node.js, SQL and more. Short lessons, coding puzzles on a farm, minigames, XP, gold and trophies. Press **Get started** to create your hero: it takes one minute.',
    steps: [],
    stuck: [
      { q: 'What do I do here?', a: 'Press **Get started**. I ask you 5 quick questions (your goal, your level, a daily goal, your name) and then you arrive in the village.' },
      { q: 'Do I need an account?', a: 'No. Your progress is saved in this browser. You can back it up to a file from **Settings**.' },
      { q: 'I have a backup file', a: 'Create a hero first (any name), then go to **Settings → Load a backup**.' },
    ],
    faq: ['start', 'need', 'languages', 'age', 'save'],
  },
  Create: {
    title: 'Create your hero', icon: 'helm',
    about: 'Five quick questions so the game fits you: your goal, how much code you know, a daily goal, the kind of lessons you like, and your hero. You can change everything later.',
    steps: [],
    stuck: [
      { q: 'Which path should I pick?', a: 'New to coding? **Web Designer** or **Frontend Developer** shows results fastest (you build web pages). Data lovers can pick the data path. You can switch any time.' },
      { q: 'The Continue button is grey', a: 'Pick one of the cards first. On the last step, type a **name** for your hero.' },
      { q: 'I already know some code', a: 'Say so on the second question. Answer well in the first lessons and **shortcut** stops will let you skip ahead.' },
    ],
    faq: ['paths', 'need', 'age'],
  },
};

/** How to answer each kind of question (used by "I'm stuck" in lessons). */
export const TYPE_TIPS: Record<string, string> = {
  teach: 'This is a **teaching card**: nothing to answer. Read it and press **Continue**. The next questions use what it says.',
  choice: 'Read the question and the code (if any), then **tap one answer** and press **Check**. Tip: cross out answers you know are wrong first.',
  fill: 'Tap a tile at the bottom to put it in the **first empty gap**. Tap a placed tile to take it back. Fill every gap, then press **Check**.',
  order: 'Tap the pieces **in the order they should run**, top to bottom. Tap a placed piece to remove it.',
  match: 'Tap an item on the left, then its partner on the right. Pairs that belong together disappear.',
  link: 'Drag a rope from a rune on the left to its meaning on the right (or tap both). Link all pairs, then press **Check**.',
  type: 'Type the answer in the box and press **Enter**. Spelling matters in code, but extra spaces are ignored.',
  bug: 'One line has a bug. Read each line slowly, **tap the broken one**, then press **Check**.',
  sql: 'Write a query in the editor and press **Run & check**. Compare your result table with the **expected** table.',
  terminal: 'Type commands in the terminal and press **Enter** after each. The goal ticks when you get there. `ls` lists files, `cd` moves into a folder.',
};

/** How each minigame works (used by "I'm stuck" in minigames). */
export const GAME_TIPS: Record<string, string> = {
  link: 'Tap a rune on the left, then its meaning on the right. Link every pair before the sand runs out.',
  memory: 'Flip two tiles. If they belong together (a code word and its meaning), they stay open. Remember where you saw each tile!',
  torchrun: 'Answer fast: every right answer feeds the torch. When the torch burns out, the run ends.',
  bughunt: 'Each spell has **one** broken line. Tap it before the torch burns out.',
  archery: 'Type a **CSS selector** that hits every glowing target and nothing else, then shoot. `.name` = class, `#name` = id, `a b` = b inside a.',
  archive: 'Read the SQL query and tap **exactly** the rows it returns. Check the `WHERE` part for each row.',
  gemforge: 'Swap two gems next to each other to line up **3 or more** of the same colour. Lines of 4 or 5 score extra. When the rune glows, answer its question for bonus time.',
  typist: 'Words fall towards the village. **Type a word** and press Enter (or just finish it) to zap it before it lands. Longer words give more points.',
  loop: 'Count how many times the loop runs. Look at the start value, the condition, and the step (`i++` adds 1, `i += 2` adds 2).',
};

export interface Faq { id: string; cat: string; q: string; a: string }
export const FAQ_CATS: { id: string; label: string; icon: string }[] = [
  { id: 'start', label: 'Getting started', icon: 'map' },
  { id: 'learn', label: 'Lessons', icon: 'scroll' },
  { id: 'code', label: 'Writing code', icon: 'code' },
  { id: 'play', label: 'Games & farm', icon: 'rune' },
  { id: 'world', label: 'Pets, homestead & battles', icon: 'heart' },
  { id: 'rewards', label: 'Rewards & items', icon: 'coin' },
  { id: 'account', label: 'Progress & settings', icon: 'gear' },
];

export const FAQ: Faq[] = [
  { id: 'start', cat: 'start', q: 'Where do I start?', a: 'In **the Academy** (the castle). Press the glowing stop on the map and then **Start**. Each lesson takes 2-5 minutes.' },
  { id: 'need', cat: 'start', q: 'Do I need to know anything before?', a: 'No. The first lessons start from zero: what code is, what a tag is, what a variable is. If you already code, say so when you create your hero, and answer well: **shortcut** stops let you skip what you know.' },
  { id: 'move', cat: 'start', q: 'How do I move in the village?', a: 'Arrow keys or WASD, or click (tap) where you want to go. Click a building to walk to it and go in. The bar at the bottom opens every building directly.' },
  { id: 'languages', cat: 'start', q: 'Which languages can I learn?', a: 'HTML, CSS, JavaScript, TypeScript, Tailwind, React, Vue, Svelte, Node.js, **Python**, **PHP**, SQL and NoSQL, Git and the terminal, APIs, algorithms, testing, accessibility and security. Everything runs **in your browser**: real Python and PHP interpreters are loaded the first time you need them.' },
  { id: 'paths', cat: 'start', q: 'What is a path? Can I change it?', a: 'A path is a list of courses in a good order for a goal (like *Front-end Developer*). Change it any time at the **Path Board** in the village. Lessons you finished stay finished.' },
  { id: 'age', cat: 'start', q: 'Is it for kids or adults?', a: 'Both. Kids can turn **Hearts off** (Relaxed mode) and start on the Farm with blocks. Adults can turn on **Sage\'s notes** in Settings for real-world details.' },
  { id: 'lesson-types', cat: 'learn', q: 'What kinds of questions are there?', a: 'Pick an answer, fill the gaps, put lines in order, match pairs, link runes, type an answer, find the bug, and real **coding challenges** where you write and run code.' },
  { id: 'wrong', cat: 'learn', q: 'What happens when I answer wrong?', a: 'You see the right answer and why. The question comes back later in the same lesson, and again in a review stop. If hearts are on, you lose one heart.' },
  { id: 'review', cat: 'learn', q: 'What are review stops and warm-ups?', a: 'I remember what you got wrong. **Review stops** appear on the map with those questions, and lessons may start with a **warm-up** of one old mistake. This is how your memory gets strong.' },
  { id: 'unit-test', cat: 'learn', q: 'What is the unit test?', a: 'At the end of each unit, a short test of everything in it. Pass it to open the next unit. You may make a few mistakes; hints are off.' },
  { id: 'skip', cat: 'learn', q: 'Can I skip lessons I already know?', a: 'Yes. If you answer well, **shortcut** stops appear that let you jump to the next unit by passing a short test.' },
  { id: 'replay', cat: 'learn', q: 'Can I replay a lesson?', a: 'Yes. Click any finished stop on the map and press **Practice again**. You get half the XP, but it is great practice.' },
  { id: 'editor', cat: 'code', q: 'How does the code editor work?', a: 'Type like in any editor. **Tab** indents, **Ctrl+Enter** (Cmd+Enter on Mac) runs. Some challenges have several files: switch with the tabs above the editor. Your code is saved as you type.' },
  { id: 'errors', cat: 'code', q: 'My code has an error. What do I do?', a: 'Read the message: it usually gives a **line number**. Most errors are a missing bracket `)` `}`, a missing quote, a missing comma, or a name with different upper/lower case. Fix one thing, run again.' },
  { id: 'runs', cat: 'code', q: 'Where does my code run?', a: 'In your browser. JavaScript and TypeScript run in a safe sandbox (endless loops are stopped), SQL runs on a real SQLite database compiled to **WebAssembly**, and web pages render in a preview frame. No server sees your code.' },
  { id: 'solution', cat: 'code', q: 'Can I see the solution?', a: 'Yes, after two tries a **Show solution** button appears. Read it, then try to type it yourself: that is how you learn.' },
  { id: 'font', cat: 'code', q: 'The code is hard to read', a: 'In **Settings**, turn on **Classic code font** and choose a bigger **Editor text size**.' },
  { id: 'games', cat: 'play', q: 'What are the minigames for?', a: 'Quick practice with a twist (and a clock). New stars give **items**. Minigame stops appear on the Academy map, and you can replay them in the Tavern arcade.' },
  { id: 'farm', cat: 'play', q: 'What is the Code Farm?', a: 'Thirty puzzle fields. You program a farmer to move, plant, water and harvest. It teaches **sequences, loops, conditions, variables and functions**, from blocks to real JavaScript.' },
  { id: 'blocks-to-code', cat: 'play', q: 'Blocks are easy. When do I type code?', a: 'From chapter 4 the Farm shows the JavaScript your blocks make, and you can press **Type it instead**. Later fields are code only.' },
  { id: 'mistake-farm', cat: 'play', q: 'What counts as a mistake on the farm?', a: 'Walking into a tree or fence, planting on grass, harvesting an empty tile, or watering with an empty can. The farmer says "Ouch!" when it happens.' },
  { id: 'xp', cat: 'rewards', q: 'How do XP and levels work?', a: 'Every lesson, game, field and quest gives **XP**. XP raises your level and fills your **daily goal** (the green bar). Perfect lessons give more.' },
  { id: 'gold', cat: 'rewards', q: 'How do I get gold?', a: 'Lessons (5 gold, +3 if perfect), projects (30), minigames, farm fields and daily quests. Spend it at the Tavern merchant.' },
  { id: 'items', cat: 'rewards', q: 'What do the items do?', a: '**Lightbulb**: a hint (removes wrong answers or places a piece). **Torch**: retry after a wrong answer without losing a heart; more time in minigames. **Potion**: one heart back.' },
  { id: 'hearts', cat: 'rewards', q: 'What are hearts?', a: 'You have 5. A wrong answer in a lesson costs one. At 0 you must stop, refill (potion or gold), or practice. One heart comes back every 20 minutes. Turn them off in **Settings** if you prefer Relaxed mode.' },
  { id: 'streak', cat: 'rewards', q: 'What is a streak?', a: 'The number of days in a row you finished at least one lesson. Miss a day and it starts again, unless you own a **streak freeze** (buy it at the Guild Hall).' },
  { id: 'trainee', cat: 'start', q: 'Can this get me a job?', a: 'The paths follow what junior developers and trainees are asked to know: one language well, the web, SQL, Git, APIs, algorithms, testing and career skills (CV, portfolio, interviews). Finish a path and the **Junior Trial** to earn the Junior Developer rank. Then build your own projects: employers want to see them.' },
  { id: 'homestead', cat: 'world', q: 'How does the homestead work?', a: 'Plant seeds in your garden plots; they grow in **real time** (a few minutes to a few hours). Water them to grow faster. Buy animals at the market stall, feed them hay once a day and collect eggs, milk, wool and more. Sell it all for gold.' },
  { id: 'pets', cat: 'world', q: 'How do I get pets?', a: 'Lumi gives you a first egg. Eggs hatch with **XP**, and you can buy more in the Pet Sanctuary. There are 20 kinds: common, uncommon, rare and **ultra rare** (phoenix, unicorn, kitsune). Happy pets give a small XP bonus.' },
  { id: 'shiny', cat: 'world', q: 'What is a shiny pet?', a: 'Every pet has a 1 in 20 chance to hatch **shiny**: same pet, different colours and a sparkle. Shiny ultra rare pets are the rarest thing in the realm.' },
  { id: 'battles', cat: 'world', q: 'How do battles work?', a: 'At the **Monster Gate** you fight bug monsters, turn by turn. **Strike** = answer a question, **Spell** = type a word in time, **Defend** = half damage, **Potion** = heal. Win for XP, gold and sometimes eggs. The strongest monsters are dragons.' },
  { id: 'trial', cat: 'world', q: 'What is the Junior Trial?', a: 'The final battle of your path against the **Elder Dragon of Bugs**. It opens when most of your path is done and asks questions from every course in it. Win it to become a **Junior Developer**.' },
  { id: 'away', cat: 'world', q: 'What happens if I don\'t play for a while?', a: 'The realm notices! After a day or more, weeds grow on your homestead, ripe crops may wither, pets get sad and bug monsters wander into the village. After a few days the sky over the village turns grey and it starts to rain. Do **one lesson** to clean it all up and get a comeback gift.' },
  { id: 'notify', cat: 'account', q: 'Can Lumi remind me to practise?', a: 'Yes. In **Settings**, turn on **Daily reminders** and choose a time. Your browser will ask for permission. Reminders only work in browsers that support notifications.' },
  { id: 'language', cat: 'account', q: 'Can I play in Portuguese or Spanish?', a: 'Yes: **Settings → Language** (or the flags on the title screen). Menus, help, achievements and the lessons (teaching cards, questions and explanations) are translated. Some coding-challenge instructions are still in English. Code itself (keywords like `if` or `print`) stays in English, as in real work.' },
  { id: 'dev', cat: 'account', q: 'What is developer mode?', a: 'A panel for developers and testers: add XP, gold or items, unlock everything, skip time, hatch pets, grow crops, start battles and test notifications. Turn it on in **Settings → Developer mode**, or add `?debug` to the address. Press the **`** key or the DEV button to open it.' },
  { id: 'save', cat: 'account', q: 'Is my progress saved?', a: 'Yes, automatically, in this browser. To move it to another computer, use **Settings → Back up my progress**, then **Load a backup** on the other one.' },
  { id: 'reset', cat: 'account', q: 'How do I start over?', a: '**Settings → Start over** deletes your hero and all progress in this browser. Make a backup first if you may want it back.' },
  { id: 'sound', cat: 'account', q: 'How do I turn the sound off?', a: 'In **Settings**: sound effects and music have their own switches.' },
  { id: 'phone', cat: 'account', q: 'Can I play on a phone?', a: 'Yes. Everything works with touch. Coding challenges use tabs (Task / Code / Result) on small screens. A keyboard helps for long code.' },
  { id: 'tips', cat: 'account', q: 'How do I see the tours again?', a: 'Press the **Lumi** button on any screen and choose **Show me step by step**. In Settings you can also **Replay the welcome tour** or switch the first-visit tips on and off.' },
];

export const FAQ_BY_ID = Object.fromEntries(FAQ.map((f) => [f.id, f]));
