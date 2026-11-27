// Hash routes: #/learn, #/lesson/html-1-1 ... (src/game/director.ts maps them to scenes).
export function go(path: string) {
  location.hash = '#/' + path.replace(/^\//, '');
}
