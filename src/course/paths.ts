// Career paths. Courses shared between paths keep their progress when you switch.
import type { Path } from './types';

const FOUNDATION = ['web', 'html', 'css', 'js', 'tools'];

export const PATHS: Path[] = [
  {
    id: 'frontend-react', title: 'Frontend Developer', subtitle: 'with React', icon: 'rune', color: '#1f9fd0',
    role: 'Junior Frontend Developer (React)',
    desc: 'Build websites and web apps people use every day. The most requested frontend skill set.',
    courses: [...FOUNDATION, 'api', 'ts', 'tailwind', 'react', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'frontend-vue', title: 'Frontend Developer', subtitle: 'with Vue', icon: 'vale', color: '#3aa776',
    role: 'Junior Frontend Developer (Vue)',
    desc: 'Build web apps with Vue, a friendly framework loved in Europe and Asia.',
    courses: [...FOUNDATION, 'api', 'ts', 'tailwind', 'vue', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'frontend-svelte', title: 'Frontend Developer', subtitle: 'with Svelte', icon: 'flame', color: '#e4572e',
    role: 'Junior Frontend Developer (Svelte)',
    desc: 'Build fast web apps with Svelte, the compiler framework developers love.',
    courses: [...FOUNDATION, 'api', 'ts', 'tailwind', 'svelte', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'backend-node', title: 'Backend Developer', subtitle: 'with Node.js & SQL', icon: 'mug', color: '#5c8a3a',
    role: 'Junior Backend Developer (Node.js)',
    desc: 'Build the servers, APIs and databases behind every app.',
    courses: ['web', 'html', 'js', 'tools', 'api', 'ts', 'node', 'sql', 'nosql', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'fullstack', title: 'Full-Stack Developer', subtitle: 'React + Node.js + SQL', icon: 'crown', color: '#8a5cc7',
    role: 'Junior Full-Stack Developer',
    desc: 'Do it all: interfaces, servers and databases. The longest path, and the most versatile.',
    courses: [...FOUNDATION, 'api', 'ts', 'react', 'node', 'sql', 'nosql', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'backend-python', title: 'Backend Developer', subtitle: 'with Python & SQL', icon: 'book2', color: '#3776ab',
    role: 'Junior Backend Developer (Python)',
    desc: 'Python is the friendliest first language and powers web servers, data and AI. Real Python runs in your browser.',
    courses: ['web', 'html', 'tools', 'api', 'python', 'sql', 'nosql', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'backend-php', title: 'Backend Developer', subtitle: 'with PHP & SQL', icon: 'scroll', color: '#777bb4',
    role: 'Junior Backend Developer (PHP)',
    desc: 'PHP runs a huge part of the web (WordPress, Laravel). Real PHP 8 runs in your browser.',
    courses: ['web', 'html', 'css', 'tools', 'api', 'php', 'sql', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'trainee', title: 'Software Trainee', subtitle: 'to Junior Engineer', icon: 'star', color: '#d4a017',
    role: 'Junior Software Engineer',
    desc: 'A broad trainee programme like the ones big companies run: web, JavaScript, Python, SQL, APIs, algorithms, testing and career skills.',
    courses: [...FOUNDATION, 'python', 'sql', 'api', 'algo', 'testing', 'quality', 'career'],
  },
  {
    id: 'explore', title: 'Not sure yet', subtitle: 'Start with the foundations', icon: 'map', color: '#c2703d',
    role: 'Choose your path later',
    desc: 'Learn how the web works, HTML, CSS, JavaScript and the developer tools. Every path starts here, so nothing is wasted. You can choose a path at any time.',
    courses: FOUNDATION,
  },
];
