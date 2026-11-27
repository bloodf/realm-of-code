// All courses (sections). Paths pick from these.
import type { Course } from '../types';
import { web } from './web';
import { html } from './html';
import { css } from './css';
import { js } from './js';
import { tools } from './tools';
import { api } from './api';
import { ts } from './ts';
import { tailwind } from './tailwind';
import { react } from './react';
import { vue } from './vue';
import { svelte } from './svelte';
import { testing } from './testing';
import { quality } from './quality';
import { nodeCourse } from './node';
import { sqlCourse } from './sql';
import { career } from './career';
import { python } from './python';
import { php } from './php';
import { nosql } from './nosql';
import { algo } from './algo';

export const COURSES: Course[] = [web, html, css, js, tools, api, ts, tailwind, react, vue, svelte, nodeCourse, python, php, sqlCourse, nosql, algo, testing, quality, career];
