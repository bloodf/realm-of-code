// Builds a session (the list of exercises and what happens at the end) for every way
// of playing: a lesson, practice, mistake review, a review stop, a unit test, a preview.
import { useGame, type LessonResult } from '../../game/store';
import { COURSE_BY_ID, NODE_BY_ID, PATH_BY_ID, UNIT_BY_ID, courseProgress, currentIndex, exKey, exerciseByKey, isNodeOpen, isQuick, pathNodes, pathProgress } from '../../course';
import { adaptLesson, type SessionItem } from '../../lesson/adapt';
import { pendingReview } from '../../course/adaptive';

export type SessionMode = 'lesson' | 'practice' | 'test' | 'review';

export interface SessionPlan {
  mode: SessionMode;
  title: string;
  courseId: string;
  nodeId: string;
  kind: LessonResult['kind'];
  items: SessionItem[];
  exitTo: string;
  note?: string | null;
  maxMistakes?: number;
  onFinish?: (passed: boolean, mistakes: number) => Partial<LessonResult> | null | void;
}

export type Blocked = { blocked: string; action?: { label: string; to: string } };

function shuffle<T>(a: T[]) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export function buildSession(d: Record<string, unknown>): SessionPlan | Blocked {
  const s = useGame.getState();
  const pathId = s.pathId ?? 'explore';
  switch (d.mode) {
    case 'lesson': {
      const id = String(d.id);
      const ref = NODE_BY_ID[id];
      if (!ref) return { blocked: 'This lesson does not exist.' };
      if (!isNodeOpen(pathId, id, s.done)) return { blocked: 'This lesson is still locked. Finish the lessons before it first.' };
      const pending = pendingReview(s.reviews);
      if (pending && !s.done[id]) return { blocked: 'Lumi asks you to finish your review stop first. It is short, and it never costs hearts.', action: { label: 'Start the review', to: 'review-stop/' + pending } };
      const base = ref.node.exercises.map((ex, i) => ({ ex, key: exKey(id, i) }));
      const { items, note } = adaptLesson(base, id, { history: s.history, mistakes: s.mistakes, done: s.done });
      return {
        mode: 'lesson', title: ref.node.title, courseId: ref.course.id, nodeId: id, kind: ref.node.kind, items, note, exitTo: 'learn',
        onFinish: () => {
          const after = { ...useGame.getState().done, [id]: { times: 1, best: 100, at: Date.now() } };
          const cp = courseProgress(ref.course.id, after);
          const path = PATH_BY_ID[pathId];
          const pp = path ? pathProgress(path.id, after) : null;
          return {
            courseComplete: cp.done === cp.total ? { id: 'course:' + ref.course.id, name: `${ref.course.title} mastered` } : null,
            pathComplete: pp && path && pp.done === pp.total && path.id !== 'explore' ? { id: 'path:' + path.id, name: `${path.role}: path complete` } : null,
          };
        },
      };
    }
    case 'practice': {
      const courseId = d.course === 'all' ? undefined : String(d.course);
      const pool: SessionItem[] = [];
      for (const [id, ref] of Object.entries(NODE_BY_ID)) {
        if (!s.done[id] || (courseId && ref.course.id !== courseId)) continue;
        ref.node.exercises.forEach((ex, i) => { if (isQuick(ex)) pool.push({ ex, key: exKey(id, i) }); });
      }
      const weak = shuffle(pool.filter((p) => s.mistakes[p.key]));
      const rest = shuffle(pool.filter((p) => !s.mistakes[p.key]));
      const items = [...weak.slice(0, 5), ...rest].slice(0, 10);
      if (items.length < 3) return { blocked: 'Finish a few lessons first, then come back to practise them.' };
      return { mode: 'practice', title: courseId ? `Practice: ${COURSE_BY_ID[courseId]?.title}` : 'Mixed practice', courseId: courseId ?? 'practice', nodeId: 'practice-' + (courseId ?? 'all'), kind: 'practice', items, exitTo: 'practice' };
    }
    case 'mistakes': {
      const items = shuffle(Object.keys(s.mistakes)).map((k) => exerciseByKey(k)).filter((x) => x && isQuick(x.ex)).slice(0, 12)
        .map((x) => ({ ex: x!.ex, key: exKey(x!.ref.node.id, x!.ref.node.exercises.indexOf(x!.ex)) }));
      if (!items.length) return { blocked: 'No mistakes to review. Flawless!' };
      return { mode: 'practice', title: 'Mistake review', courseId: 'practice', nodeId: 'practice-mistakes', kind: 'practice', items, exitTo: 'practice' };
    }
    case 'review': {
      const lessonId = String(d.id);
      const ref = NODE_BY_ID[lessonId];
      const review = s.reviews[lessonId];
      if (!ref || !review) return { blocked: 'There is no review here.' };
      const ex = ref.node.exercises.map((e, i) => ({ ex: e, key: exKey(lessonId, i) }));
      const teach = ex.filter((x) => x.ex.t === 'teach').slice(0, 2).map((x) => ({ ...x, tag: 'refresher' as const }));
      const missed = review.keys.map((k) => ex.find((x) => x.key === k)).filter((x): x is SessionItem => !!x && isQuick(x.ex));
      const others = shuffle(ex.filter((x) => isQuick(x.ex) && !review.keys.includes(x.key)));
      const quiz = [...missed, ...others].slice(0, Math.max(5, missed.length));
      const items = [...teach, ...shuffle(quiz)];
      if (items.length < 2) { s.completeReview(lessonId); return { blocked: 'Review done!' }; }
      return { mode: 'review', title: `Review: ${ref.node.title}`, courseId: ref.course.id, nodeId: 'review-' + lessonId, kind: 'practice', items, exitTo: 'learn', onFinish: (passed) => { if (passed) useGame.getState().completeReview(lessonId); return null; } };
    }
    case 'test': {
      const unitId = String(d.unit);
      const ref = UNIT_BY_ID[unitId];
      if (!ref) return { blocked: 'This unit does not exist.' };
      const nodes = pathNodes(pathId);
      const target = nodes.findIndex((n) => n.unit.id === unitId);
      const from = currentIndex(pathId, s.done);
      const skipped = target > from ? nodes.slice(from, target) : [];
      if (!skipped.length) return { blocked: 'You can already open this unit.' };
      const pool: SessionItem[] = [];
      skipped.forEach((n) => n.node.exercises.forEach((ex, i) => { if (isQuick(ex) && ex.t !== 'match') pool.push({ ex, key: exKey(n.node.id, i) }); }));
      const items = shuffle(pool).slice(0, 12);
      const ids = skipped.map((n) => n.node.id);
      if (items.length < 4) { s.markTestedOut(unitId, ids); return { blocked: 'Unit unlocked!' }; }
      return { mode: 'test', title: `Jump to: ${ref.unit.title}`, courseId: ref.course.id, nodeId: 'test-' + unitId, kind: 'test', items, exitTo: 'learn', maxMistakes: 3, onFinish: (passed) => { if (passed) useGame.getState().markTestedOut(unitId, ids); return null; } };
    }
    case 'preview': {
      const nodeId = String(d.id);
      const ref = NODE_BY_ID[nodeId];
      const ex = ref?.node.exercises[Number(d.index)];
      if (!ref || !ex) return { blocked: 'No such exercise.' };
      return { mode: 'practice', title: `${ref.node.title} #${d.index}`, courseId: ref.course.id, nodeId: 'preview-' + nodeId, kind: 'practice', items: [{ ex, key: exKey(nodeId, Number(d.index)) }], exitTo: 'learn' };
    }
  }
  return { blocked: 'Nothing to play here.' };
}
