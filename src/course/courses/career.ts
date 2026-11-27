// Section: Career: from learner to junior developer.
import type { Course } from '../types';
import { teach, mc, tf, match, order, lesson, unit } from '../dsl';

export const career: Course = {
  id: 'career', title: 'Getting Hired', realm: 'The Guild Hall', color: '#7d4e9e', emblem: 'briefcase',
  desc: 'From learner to junior developer: portfolio projects, GitHub, deploying, CV, interviews and your first job on a team.',
  units: [
    unit('career-u1', 'Your Portfolio', 'Projects that prove your skills.', `
**Key ideas**
- Employers hire juniors for **proof of skills** and **ability to learn**: real projects beat certificates.
- Build 3–5 projects that solve real problems, each a bit harder. Deploy them so anyone can click a link.
- Each repo needs a good **README**: what it is, screenshot, live link, tech used, how to run it, what you learned.
- A tidy GitHub profile with a pinned projects section and regular commits.
- Free hosting: GitHub Pages, Netlify, Vercel (front end); Render, Railway, Fly.io (back end).`, [
      lesson('career-1-1', 'What employers look for', [
        teach('Proof, not promises', 'For junior roles, companies mainly want to see:\n- you can **build working things** (projects)\n- you understand the **fundamentals** (HTML, CSS, JS, Git, APIs)\n- you can **learn** and **communicate**\n- you can work in a **team** (Git, pull requests, asking good questions)\n\nNobody expects a junior to know everything.'),
        mc('What convinces employers most that a junior can code?', ['Working projects they can see and try', 'A long list of course certificates', 'Saying "I am a fast learner"', 'A very colourful CV'], 0),
        tf('Juniors are expected to know every framework before their first job.', false),
        match('Match the skill with the proof', [['Can build UIs', 'Deployed projects'], ['Works with teams', 'Clean Git history, PRs'], ['Communicates well', 'Clear README files'], ['Keeps learning', 'Recent activity and new skills']]),
      ]),
      lesson('career-1-2', 'Projects to build', [
        teach('A ladder of projects', 'Build projects that grow in difficulty:\n1. A **personal site** (HTML/CSS, responsive, accessible)\n2. An **interactive app** (JS: quiz, todo with localStorage, weather app with an API)\n3. A **framework app** (React/Vue/Svelte + TypeScript + routing + API data)\n4. A **full-stack app** (your own API + database + login)\n\nBest of all: solve a **real problem** for someone (a club, a family business, yourself).'),
        order('Order these projects from easiest to hardest', ['Personal website with HTML and CSS', 'Todo app with JavaScript and localStorage', 'React app that loads data from an API', 'Full-stack app with login and a database'], undefined, 'text'),
        mc('Which project idea stands out most to employers?', ['An app that solves a real problem for a real group of people', 'A copy of a tutorial with no changes', 'A "hello world" page', 'A project that is not deployed'], 0),
        tf('It is fine to build projects with a tutorial, as long as you then extend them with your own features.', true),
      ]),
      lesson('career-1-3', 'GitHub and READMEs', [
        teach('Your shop window', 'Recruiters and developers will look at your GitHub. Make it easy:\n- **pin** your best 3–6 repositories\n- a profile README: who you are, what you build, how to contact you\n- each project README:\n\n```\n# Quest Board\nA todo app for adventurers. Live: https://quest.example.dev\n![Screenshot](screenshot.png)\n## Features\n## Tech: React, TypeScript, Vite\n## Run locally: npm install && npm run dev\n## What I learned\n```'),
        order('Order a good project README', ['Project name and one-line description', 'Live link and screenshot', 'Features', 'Tech used and how to run it', 'What I learned'], undefined, 'text'),
        mc('What is the single most important link in a project README?', ['The live demo link', 'Your favourite song', 'A link to the framework docs', 'A link to another repo'], 0),
        tf('Meaningful commit messages make your projects look more professional.', true),
      ]),
      lesson('career-1-4', 'Deploying your work', [
        teach('Put it online', '- **Static sites** (HTML/CSS/JS, React/Vue/Svelte builds): GitHub Pages, Netlify, Vercel, Cloudflare Pages (free)\n- **Backends** (Node + database): Render, Railway, Fly.io\n- Connect the repo: every push to `main` redeploys automatically\n- Optional: buy a custom domain (a few euros/dollars per year)'),
        match('Match the project with a host', [['A React app (static build)', 'Netlify or Vercel'], ['A Node API with a database', 'Render or Railway'], ['A simple HTML portfolio', 'GitHub Pages'], ['Your own name as the address', 'A custom domain']]),
        mc('Why deploy your projects instead of only sharing code?', ['Recruiters can try them in one click', 'It makes the code shorter', 'GitHub requires it', 'It is the only way to save code'], 0),
      ]),
    ]),
    unit('career-u2', 'Getting Hired', 'CV, job search and interviews.', `
**Key ideas**
- **CV**: one page, skills, projects with links and results, relevant experience (also from earlier careers!).
- LinkedIn + GitHub + portfolio site tell the same story.
- Job search: apply regularly, tailor each application, network (meetups, online communities), referrals work best.
- Interviews: screening call → technical interview (live coding, take-home, or questions) → behavioural interview (STAR).
- Think out loud, ask clarifying questions, and it is OK to say "I don't know, but here is how I would find out".`, [
      lesson('career-2-1', 'Your CV and profiles', [
        teach('One page that opens doors', '- Keep it to **one page**, clean and easy to scan\n- Top: name, role you want ("Junior Frontend Developer"), links (GitHub, portfolio, LinkedIn)\n- **Projects** with one line each: what it does, tech, a link\n- Skills you can actually discuss\n- Previous experience: career switchers bring real value (teamwork, domain knowledge, customer skills)!'),
        mc('A career switcher worked 5 years in a restaurant. Should that be on the CV?', ['Yes: teamwork, pressure and customer skills are valuable', 'No, only tech jobs count', 'Only if it was a tech restaurant', 'Hide it completely'], 0),
        mc('Which project line is strongest?', ['"Built a React booking app used by my climbing club (30 members)"', '"Did a React project"', '"Knows React"', '"Interested in React"'], 0),
        tf('Listing 40 technologies you have only heard of makes your CV stronger.', false, 'Interviewers ask about what you list. Only include what you can talk about.'),
      ]),
      lesson('career-2-2', 'The job search', [
        teach('A steady campaign', '- Apply regularly (many junior applications get no answer; it is not personal)\n- **Tailor** each application: match the job\'s keywords and say why this company\n- **Network**: meetups, online communities, open source, friends in tech. Referrals are the fastest way in\n- Track applications in a simple spreadsheet\n- Look beyond big tech: agencies, startups, local businesses, internships, apprenticeships'),
        mc('What usually gives the best chance of an interview?', ['A referral from someone who works there', 'Sending the same CV to 500 jobs in one day', 'Only applying to famous companies', 'Waiting for recruiters to find you'], 0),
        tf('Many successful developers were rejected many times before their first job.', true),
        match('Match the place with what you get', [['Meetups', 'People and referrals'], ['Open source', 'Real teamwork on your CV'], ['Job boards', 'Lots of openings'], ['Internships', 'Paid learning on the job']]),
      ]),
      lesson('career-2-3', 'Behavioural interviews', [
        teach('The STAR method', 'Behavioural questions ask about your past: "Tell me about a time you solved a hard problem." Answer with **STAR**:\n- **S**ituation: the context\n- **T**ask: what you had to do\n- **A**ction: what **you** did\n- **R**esult: what happened (numbers help!)'),
        order('Order a STAR answer', ['Situation: our club\'s booking sheet kept double-booking', 'Task: I offered to build a booking app', 'Action: I built it with React and a small API', 'Result: no double bookings in 3 months, 30 members use it'], undefined, 'text'),
        mc('"What is your biggest weakness?" A good answer...', ['Names a real weakness and what you do to improve it', 'Says you have no weaknesses', 'Says you work too hard', 'Criticises a former boss'], 0),
        mc('At the end, the interviewer asks if you have questions. You should...', ['Ask thoughtful questions about the team and the work', 'Say no', 'Ask only about holidays', 'Ask for the answers to the interview'], 0),
      ]),
      lesson('career-2-4', 'Technical interviews', [
        teach('Show how you think', '- **Think out loud**: interviewers care about your reasoning\n- Ask clarifying questions before coding\n- Start simple, then improve\n- Test your code with an example\n- If stuck, say what you are thinking; it is OK to say "I don\'t know, but I would look it up here..."\n\nCommon junior topics: `let`/`const`/`var`, `==` vs `===`, the box model, flexbox, HTTP methods, async/await, React state and props, Git basics.'),
        mc('You do not understand the exercise. What do you do?', ['Ask clarifying questions', 'Start typing anything', 'Stay silent', 'Leave'], 0),
        match('Quick interview revision', [['=== vs ==', 'Strict vs loose equality'], ['let vs const', 'Can vs cannot be reassigned'], ['props vs state', 'Input from parent vs own memory'], ['GET vs POST', 'Read vs create/send data']]),
        tf('Saying "I don\'t know, but here is how I would find out" can leave a good impression.', true),
      ]),
    ]),
    unit('career-u3', 'Your First Job', 'How teams work and how to grow.', `
**Key ideas**
- Teams often work in **Agile/Scrum**: short **sprints**, daily **stand-ups**, **tickets** in Jira/Linear/GitHub Issues, demos and retrospectives.
- Your flow: pick a ticket → branch → small commits → PR → review → merge → deploy.
- Code review etiquette: be kind, specific and curious; don't take feedback personally.
- Ask for help after you have tried for a while (e.g. 30–60 minutes) and write down what you tried.
- Imposter syndrome is normal. Keep learning: read code, docs, and ask seniors how they think.`, [
      lesson('career-3-1', 'How teams work', [
        teach('Sprints and stand-ups', 'Many teams use **Scrum**, a kind of **Agile**:\n- work is split into **tickets** (Jira, Linear, GitHub Issues)\n- a **sprint** is 1–2 weeks of planned work\n- a short daily **stand-up**: what I did, what I will do, what blocks me\n- a **demo** at the end, and a **retrospective** to improve the process'),
        match('Match the Agile word', [['Sprint', '1–2 weeks of planned work'], ['Stand-up', 'Short daily sync'], ['Ticket', 'One piece of work to do'], ['Retrospective', 'Meeting to improve how we work']]),
        mc('In a stand-up you are stuck on a bug. You should...', ['Mention it as a blocker and ask who can help', 'Hide it until you solve it alone', 'Skip the stand-up', 'Blame the computer'], 0),
        order('Order the daily workflow for a ticket', ['Pick a ticket and understand it', 'Create a branch', 'Make small commits', 'Open a pull request', 'Address review comments and merge'], undefined, 'text'),
      ]),
      lesson('career-3-2', 'Code review etiquette', [
        teach('Kind and useful', 'As an **author**: keep PRs small, describe what and why, add screenshots for UI, respond openly to comments.\n\nAs a **reviewer**: be kind and specific, ask questions ("What happens if the list is empty?"), praise good things, and separate must-fix from nice-to-have ("nit:").'),
        mc('Which review comment is best?', ['"Nice refactor! One question: what happens if user is null here?"', '"This is wrong."', '"Rewrite all of it."', '"Why didn\'t you use my way?"'], 0),
        mc('A reviewer asks you to change something you disagree with. Best reaction?', ['Explain your reasoning politely and discuss it', 'Ignore the comment', 'Close the PR angrily', 'Change it without understanding'], 0),
        tf('Feedback on your code is feedback on you as a person.', false, 'It is about the code. Everyone, including seniors, gets review comments.'),
      ]),
      lesson('career-3-3', 'Growing as a developer', [
        teach('The long game', '- **Ask for help** after trying for a while, and explain what you already tried\n- Write things down: notes, docs, "today I learned"\n- Read other people\'s code: it is the fastest way to level up\n- Feeling like an imposter is normal, even for seniors\n- Keep practising: a little every day (like here!)'),
        mc('You have been stuck for two hours on a problem. What now?', ['Ask a teammate, sharing what you tried', 'Keep trying alone all week', 'Quietly give up on the ticket', 'Copy random code until it works'], 0),
        tf('Even senior developers look things up every day.', true),
        mc('What is imposter syndrome?', ['Feeling like you are not as skilled as others think, despite evidence', 'Pretending to be someone else online', 'A JavaScript error', 'A kind of interview'], 0),
        match('Match the habit with its benefit', [['Reading others\' code', 'Learn new patterns'], ['Writing notes', 'Remember and share knowledge'], ['Asking good questions', 'Get unstuck faster'], ['Daily practice', 'Steady growth']]),
      ]),
    ]),
  ],
};
