// All code challenges (editor + live preview / hero map / console), by id.
import type { Lesson } from './types';
import { htmlLessons } from './lessons/html';
import { cssLessons } from './lessons/css';
import { jsLessons } from './lessons/js';
import { tsLessons } from './lessons/ts';
import { tailwindLessons } from './lessons/tailwind';
import { reactLessons } from './lessons/react';
import { vueLessons } from './lessons/vue';
import { svelteLessons } from './lessons/svelte';
import { apiLessons } from './lessons/api';
import { testingLessons } from './lessons/testing';
import { nodeLessons } from './lessons/node';
import { qualityLessons } from './lessons/quality';
import { pythonLessons } from './lessons/python';
import { phpLessons } from './lessons/php';
import { algoLessons } from './lessons/algo';

export const ALL_CODE_LESSONS: Lesson[] = [
  ...htmlLessons, ...cssLessons, ...jsLessons, ...tsLessons, ...tailwindLessons, ...reactLessons,
  ...vueLessons, ...svelteLessons, ...apiLessons, ...testingLessons, ...nodeLessons, ...qualityLessons,
  ...pythonLessons, ...phpLessons, ...algoLessons,
];

export const CODE_LESSONS: Record<string, Lesson> = Object.fromEntries(ALL_CODE_LESSONS.map((l) => [l.id, l]));
