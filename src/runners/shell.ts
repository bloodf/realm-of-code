// A tiny simulated terminal with an in-memory file system and a mini Git, used by
// the Workshop lessons. It is deliberately small: enough to learn the real commands.

export interface Commit { id: string; msg: string; files: Record<string, string>; parent: string | null; branch: string }

export interface Repo {
  branch: string;
  branches: Record<string, string | null>;   // branch -> commit id
  commits: Record<string, Commit>;
  staged: Record<string, string>;            // path -> content staged
}

const HOME = '/home/hero';

export class Shell {
  files = new Map<string, string>();          // file path -> content
  dirs = new Set<string>(['/', '/home', HOME]);
  cwd = HOME;
  history: string[] = [];
  repo: Repo | null = null;
  repoRoot = '';
  private seq = 0;

  constructor(setup: Record<string, string> = {}, cwd?: string) {
    for (const [p, content] of Object.entries(setup)) {
      const abs = this.abs(p, HOME);
      if (p.endsWith('/')) this.mkdirp(abs.replace(/\/$/, ''));
      else { this.mkdirp(parent(abs)); this.files.set(abs, content); }
    }
    if (cwd) { this.cwd = this.abs(cwd, HOME); this.mkdirp(this.cwd); }
  }

  abs(p: string, from = this.cwd): string {
    if (p === '~' || p === '') return HOME;
    if (p.startsWith('~/')) p = HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : from + '/' + p).split('/');
    const out: string[] = [];
    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') out.pop(); else out.push(part);
    }
    return '/' + out.join('/');
  }

  mkdirp(p: string) {
    const parts = p.split('/').filter(Boolean);
    let cur = '';
    for (const x of parts) { cur += '/' + x; this.dirs.add(cur); }
  }

  isDir(p: string) { return this.dirs.has(p); }
  isFile(p: string) { return this.files.has(p); }
  exists(p: string) { return this.isDir(p) || this.isFile(p); }

  children(dir: string) {
    const names = new Set<string>();
    const pre = dir === '/' ? '/' : dir + '/';
    for (const d of this.dirs) if (d.startsWith(pre) && d !== dir && !d.slice(pre.length).includes('/')) names.add(d.slice(pre.length) + '/');
    for (const f of this.files.keys()) if (f.startsWith(pre) && !f.slice(pre.length).includes('/')) names.add(f.slice(pre.length));
    return [...names].sort();
  }

  prompt() {
    const short = this.cwd === HOME ? '~' : this.cwd.startsWith(HOME + '/') ? '~' + this.cwd.slice(HOME.length) : this.cwd;
    return `hero@realm:${short}$`;
  }

  /** Runs one command line and returns the text output. */
  run(line: string): string {
    const trimmed = line.trim();
    if (!trimmed) return '';
    this.history.push(trimmed);
    let redirect: { file: string; append: boolean } | null = null;
    let cmdLine = trimmed;
    const m = /^(.*?)\s*(>>?)\s*([^\s]+)\s*$/.exec(trimmed);
    if (m && !/^git\s+commit/.test(trimmed)) { cmdLine = m[1]; redirect = { file: m[3], append: m[2] === '>>' }; }
    const args = tokenize(cmdLine);
    const cmd = args.shift() ?? '';
    let output: string;
    try { output = this.exec(cmd, args); } catch (e) { output = (e as Error).message; }
    if (redirect) {
      const p = this.abs(redirect.file);
      if (!this.isDir(parent(p))) return `bash: ${redirect.file}: No such file or directory`;
      this.files.set(p, (redirect.append ? (this.files.get(p) ?? '') : '') + output + '\n');
      return '';
    }
    return output;
  }

  private exec(cmd: string, args: string[]): string {
    const flags = args.filter((a) => a.startsWith('-'));
    const rest = args.filter((a) => !a.startsWith('-'));
    switch (cmd) {
      case 'pwd': return this.cwd;
      case 'whoami': return 'hero';
      case 'echo': return args.join(' ');
      case 'clear': return '\u0000clear';
      case 'help': return 'Commands: pwd ls cd mkdir touch cat echo rm mv cp clear git';
      case 'ls': {
        const target = this.abs(rest[0] ?? '.');
        if (this.isFile(target)) return rest[0];
        if (!this.isDir(target)) return `ls: cannot access '${rest[0]}': No such file or directory`;
        const all = this.children(target);
        const shown = flags.some((f) => f.includes('a')) ? ['./', '../', ...all] : all.filter((n) => !n.startsWith('.'));
        return shown.join('  ');
      }
      case 'cd': {
        const target = this.abs(rest[0] ?? '~');
        if (!this.isDir(target)) return `cd: ${rest[0]}: No such file or directory`;
        this.cwd = target;
        return '';
      }
      case 'mkdir': {
        if (!rest.length) return 'mkdir: missing operand';
        for (const d of rest) {
          const p = this.abs(d);
          if (this.exists(p)) return `mkdir: cannot create directory '${d}': File exists`;
          if (!flags.includes('-p') && !this.isDir(parent(p))) return `mkdir: cannot create directory '${d}': No such file or directory`;
          this.mkdirp(p);
        }
        return '';
      }
      case 'touch': {
        if (!rest.length) return 'touch: missing file operand';
        for (const f of rest) {
          const p = this.abs(f);
          if (!this.isDir(parent(p))) return `touch: cannot touch '${f}': No such file or directory`;
          if (!this.files.has(p)) this.files.set(p, '');
        }
        return '';
      }
      case 'cat': {
        if (!rest.length) return 'cat: missing file operand';
        return rest.map((f) => {
          const p = this.abs(f);
          if (this.isDir(p)) return `cat: ${f}: Is a directory`;
          return this.files.has(p) ? this.files.get(p)!.replace(/\n$/, '') : `cat: ${f}: No such file or directory`;
        }).join('\n');
      }
      case 'rm': {
        if (!rest.length) return 'rm: missing operand';
        for (const f of rest) {
          const p = this.abs(f);
          if (this.isDir(p)) {
            if (!flags.some((x) => x.includes('r'))) return `rm: cannot remove '${f}': Is a directory`;
            for (const d of [...this.dirs]) if (d === p || d.startsWith(p + '/')) this.dirs.delete(d);
            for (const k of [...this.files.keys()]) if (k.startsWith(p + '/')) this.files.delete(k);
          } else if (this.files.has(p)) this.files.delete(p);
          else return `rm: cannot remove '${f}': No such file or directory`;
        }
        return '';
      }
      case 'mv':
      case 'cp': {
        if (rest.length < 2) return `${cmd}: missing destination file operand`;
        const from = this.abs(rest[0]);
        let to = this.abs(rest[1]);
        if (!this.files.has(from)) return `${cmd}: cannot stat '${rest[0]}': No such file or directory`;
        if (this.isDir(to)) to = to + '/' + from.split('/').pop();
        if (!this.isDir(parent(to))) return `${cmd}: cannot move to '${rest[1]}': No such file or directory`;
        this.files.set(to, this.files.get(from)!);
        if (cmd === 'mv') this.files.delete(from);
        return '';
      }
      case 'git': return this.git(args);
      case 'npm': return this.npm(args);
      case 'code': return rest[0] ? `(Opening ${rest[0]} in the editor...)` : '';
      default: return `${cmd}: command not found`;
    }
  }

  // ---------------- mini git ----------------
  private inRepo() {
    return this.repo && (this.cwd === this.repoRoot || this.cwd.startsWith(this.repoRoot + '/'));
  }

  private workTree(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [p, c] of this.files) if (p.startsWith(this.repoRoot + '/') && !p.startsWith(this.repoRoot + '/.git/')) out[p.slice(this.repoRoot.length + 1)] = c;
    return out;
  }

  private head(): Commit | null {
    const r = this.repo!;
    const id = r.branches[r.branch];
    return id ? r.commits[id] : null;
  }

  private git(args: string[]): string {
    const sub = args[0];
    if (sub === 'init') {
      if (this.inRepo()) return 'Reinitialized existing Git repository';
      this.repo = { branch: 'main', branches: { main: null }, commits: {}, staged: {} };
      this.repoRoot = this.cwd;
      this.mkdirp(this.cwd + '/.git');
      return `Initialized empty Git repository in ${this.cwd}/.git/`;
    }
    if (sub === '--version') return 'git version 2.45.0';
    if (!this.inRepo()) return 'fatal: not a git repository (or any of the parent directories): .git';
    const r = this.repo!;
    const committed = this.head()?.files ?? {};
    const base = { ...committed, ...r.staged };
    const tree = this.workTree();
    const rel = (f: string) => this.abs(f).slice(this.repoRoot.length + 1);
    switch (sub) {
      case 'status': {
        const staged = Object.keys(r.staged).filter((f) => r.staged[f] !== committed[f]);
        const modified = Object.keys(tree).filter((f) => f in base && base[f] !== tree[f]);
        const untracked = Object.keys(tree).filter((f) => !(f in base));
        const lines = [`On branch ${r.branch}`];
        if (!this.head()) lines.push('', 'No commits yet');
        if (staged.length) lines.push('', 'Changes to be committed:', ...staged.map((f) => `\tnew file / modified:   ${f}`));
        if (modified.length) lines.push('', 'Changes not staged for commit:', ...modified.map((f) => `\tmodified:   ${f}`));
        if (untracked.length) lines.push('', 'Untracked files:', '  (use "git add <file>..." to include in what will be committed)', ...untracked.map((f) => `\t${f}`));
        if (!staged.length && !modified.length && !untracked.length) lines.push('nothing to commit, working tree clean');
        return lines.join('\n');
      }
      case 'add': {
        const targets = args.slice(1);
        if (!targets.length) return 'Nothing specified, nothing added.';
        for (const t of targets) {
          if (t === '.' || t === '-A' || t === '--all') { Object.assign(r.staged, tree); continue; }
          const f = rel(t);
          if (!(f in tree)) return `fatal: pathspec '${t}' did not match any files`;
          r.staged[f] = tree[f];
        }
        return '';
      }
      case 'commit': {
        const mi = args.indexOf('-m');
        if (mi < 0 || !args[mi + 1]) return 'error: please use git commit -m "your message" in this realm';
        const changed = Object.keys(r.staged).filter((f) => r.staged[f] !== committed[f]);
        if (!changed.length) return `On branch ${r.branch}\nnothing to commit, working tree clean`;
        const id = (++this.seq).toString(16).padStart(7, '0').replace(/^0/, 'a');
        r.commits[id] = { id, msg: args[mi + 1], files: { ...committed, ...r.staged }, parent: r.branches[r.branch], branch: r.branch };
        r.branches[r.branch] = id;
        r.staged = {};
        return `[${r.branch} ${id}] ${args[mi + 1]}\n ${changed.length} file${changed.length > 1 ? 's' : ''} changed`;
      }
      case 'log': {
        const out: string[] = [];
        let c = this.head();
        while (c) { out.push(args.includes('--oneline') ? `${c.id} ${c.msg}` : `commit ${c.id}\n\n    ${c.msg}\n`); c = c.parent ? r.commits[c.parent] : null; }
        return out.length ? out.join('\n') : `fatal: your current branch '${r.branch}' does not have any commits yet`;
      }
      case 'branch': {
        const name = args[1];
        if (!name) return Object.keys(r.branches).map((b) => (b === r.branch ? '* ' : '  ') + b).join('\n');
        if (name in r.branches) return `fatal: a branch named '${name}' already exists`;
        r.branches[name] = r.branches[r.branch];
        return '';
      }
      case 'switch':
      case 'checkout': {
        const create = args.includes('-c') || args.includes('-b');
        const name = args.filter((a) => !a.startsWith('-'))[1];
        if (!name) return 'fatal: missing branch name';
        if (create) { if (name in r.branches) return `fatal: a branch named '${name}' already exists`; r.branches[name] = r.branches[r.branch]; }
        else if (!(name in r.branches)) return `fatal: invalid reference: ${name}`;
        r.branch = name;
        this.restore(this.head()?.files ?? {});
        return `Switched to ${create ? 'a new ' : ''}branch '${name}'`;
      }
      case 'merge': {
        const name = args[1];
        if (!name || !(name in r.branches)) return `merge: ${name ?? ''} - not something we can merge`;
        const theirs = r.branches[name] ? r.commits[r.branches[name]!] : null;
        if (!theirs) return 'Already up to date.';
        const merged = { ...(this.head()?.files ?? {}), ...theirs.files };
        const id = (++this.seq).toString(16).padStart(7, '0').replace(/^0/, 'a');
        r.commits[id] = { id, msg: `Merge branch '${name}'`, files: merged, parent: r.branches[r.branch], branch: r.branch };
        r.branches[r.branch] = id;
        this.restore(merged);
        return `Merge made by the 'ort' strategy.`;
      }
      case 'remote': return args[1] === 'add' ? '' : 'origin';
      case 'push': return `To https://github.com/hero/${this.repoRoot.split('/').pop()}.git\n * [new branch]      ${r.branch} -> ${r.branch}`;
      case 'pull': return 'Already up to date.';
      default: return `git: '${sub}' is not a git command in this realm. Try: init, status, add, commit, log, branch, switch, merge`;
    }
  }

  private restore(snapshot: Record<string, string>) {
    for (const p of [...this.files.keys()]) if (p.startsWith(this.repoRoot + '/') && !p.startsWith(this.repoRoot + '/.git/')) this.files.delete(p);
    for (const [f, c] of Object.entries(snapshot)) { const p = this.repoRoot + '/' + f; this.mkdirp(parent(p)); this.files.set(p, c); }
  }

  private npm(args: string[]): string {
    const pkg = this.abs('package.json');
    if (args[0] === 'init') {
      this.files.set(pkg, JSON.stringify({ name: this.cwd.split('/').pop(), version: '1.0.0', scripts: { test: 'echo "no tests"' } }, null, 2));
      return `Wrote to ${pkg}`;
    }
    if (args[0] === 'install' || args[0] === 'i') {
      if (!this.files.has(pkg)) return 'npm error code ENOENT: no package.json here. Run npm init -y first.';
      const names = args.slice(1).filter((a) => !a.startsWith('-'));
      const data = JSON.parse(this.files.get(pkg)!);
      const dev = args.includes('-D') || args.includes('--save-dev');
      for (const n of names) { const key = dev ? 'devDependencies' : 'dependencies'; data[key] = { ...(data[key] ?? {}), [n]: '^1.0.0' }; }
      this.files.set(pkg, JSON.stringify(data, null, 2));
      this.mkdirp(this.abs('node_modules'));
      return `added ${names.length ? names.length * 7 : 42} packages in 1s`;
    }
    if (args[0] === 'run') {
      if (!this.files.has(pkg)) return 'npm error: no package.json';
      const data = JSON.parse(this.files.get(pkg)!);
      const script = data.scripts?.[args[1]];
      if (!script) return `npm error Missing script: "${args[1]}"`;
      return `> ${data.name}@${data.version} ${args[1]}\n> ${script}\n\n${args[1] === 'dev' ? '  VITE ready in 312 ms\n  ➜  Local:   http://localhost:5173/' : '(done)'}`;
    }
    return 'Usage: npm init -y | npm install <package> | npm run <script>';
  }
}

function parent(p: string) {
  const i = p.lastIndexOf('/');
  return i <= 0 ? '/' : p.slice(0, i);
}

function tokenize(line: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

export const HOME_DIR = HOME;
