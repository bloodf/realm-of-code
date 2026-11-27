// Drag-and-drop blocks for the Code Farm (Blockly). Every block becomes a line of
// JavaScript, so players can see (and later type) the same program.
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator, Order } from 'blockly/javascript';
import * as En from 'blockly/msg/en';
import * as PtBr from 'blockly/msg/pt-br';
import * as Es from 'blockly/msg/es';
import { t, tr, getLang } from '../i18n';
import { spriteUrl } from '../components/spriteUrl';

let ready = false;

const img = (name: string, size = 24) => ({ type: 'field_image', src: spriteUrl(name), width: size, height: size, alt: '' });
// labels are translated (the code they make stays English)
let DIRS: string[][] = [];
let CROPS: string[][] = [];

/** Tool name (used in levels) -> block type */
export const TOOL_BLOCK: Record<string, string> = {
  move: 'farm_move', plant: 'farm_plant', water: 'farm_water', harvest: 'farm_harvest', sleep: 'farm_sleep', till: 'farm_till',
  pullWeed: 'farm_pull_weed', nextRow: 'farm_next_row', refill: 'farm_refill', say: 'farm_say',
  repeat: 'farm_repeat', while: 'farm_while', if: 'farm_if', ifelse: 'farm_ifelse',
  isDry: 'farm_is_dry', isRipe: 'farm_is_ripe', hasCrop: 'farm_has_crop', hasWeed: 'farm_has_weed', isGrass: 'farm_is_grass', isField: 'farm_is_field', canMove: 'farm_can_move', not: 'logic_negate',
};

export function setupBlocks(avatar: string) {
  if (ready) return;
  ready = true;
  Blockly.setLocale((getLang() === 'pt' ? PtBr : getLang() === 'es' ? Es : En) as unknown as Record<string, string>);
  DIRS = [[t('right'), 'right'], [t('left'), 'left'], [t('down'), 'down'], [t('up'), 'up']];
  CROPS = [[t('wheat'), 'wheat'], [t('carrot'), 'carrot'], [t('pumpkin'), 'pumpkin']];
  const sense = (type: string, text: string) => ({ type, message0: text, output: 'Boolean', style: 'farm_sense', tooltip: 'A question: true or false' });
  const defs: Record<string, unknown>[] = [
    { type: 'farm_start', message0: 'when ▶ Run', nextStatement: null, style: 'farm_start', tooltip: 'Your program starts here' },
    { type: 'farm_move', message0: '%1 move %2', args0: [img(avatar), { type: 'field_dropdown', name: 'DIR', options: DIRS }], previousStatement: null, nextStatement: null, style: 'farm_move', tooltip: 'Walk one tile' },
    { type: 'farm_plant', message0: '%1 plant %2', args0: [img('seedBag'), { type: 'field_dropdown', name: 'CROP', options: CROPS }], previousStatement: null, nextStatement: null, style: 'farm_action', tooltip: 'Plant a seed on this tile' },
    { type: 'farm_water', message0: '%1 water', args0: [img('wateringCan')], previousStatement: null, nextStatement: null, style: 'farm_action', tooltip: 'Water this tile' },
    { type: 'farm_harvest', message0: '%1 harvest', args0: [img('basket')], previousStatement: null, nextStatement: null, style: 'farm_action', tooltip: 'Pick a ripe crop' },
    { type: 'farm_sleep', message0: '%1 sleep until morning', args0: [img('starIcon')], previousStatement: null, nextStatement: null, style: 'farm_action', tooltip: 'Watered crops grow one step overnight' },
    { type: 'farm_till', message0: '%1 till the grass', args0: [img('stump')], previousStatement: null, nextStatement: null, style: 'farm_action', tooltip: 'Turn grass into farmland' },
    { type: 'farm_pull_weed', message0: '%1 pull weed', args0: [img('weed')], previousStatement: null, nextStatement: null, style: 'farm_action', tooltip: 'Pull the weeds on this tile' },
    { type: 'farm_next_row', message0: '%1 next row', args0: [img('sign')], previousStatement: null, nextStatement: null, style: 'farm_move', tooltip: 'Go down one row and back to the left side' },
    { type: 'farm_refill', message0: '%1 refill can', args0: [img('wateringCan')], previousStatement: null, nextStatement: null, style: 'farm_action', tooltip: 'Fill your can at the pond' },
    { type: 'farm_say', message0: 'say %1', args0: [{ type: 'field_input', name: 'TEXT', text: 'Hello!' }], previousStatement: null, nextStatement: null, style: 'farm_action' },
    { type: 'farm_repeat', message0: 'repeat %1 times %2 %3', args0: [{ type: 'field_number', name: 'TIMES', value: 3, min: 1, max: 99, precision: 1 }, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }], previousStatement: null, nextStatement: null, style: 'farm_loop', tooltip: 'Run the blocks inside again and again' },
    { type: 'farm_while', message0: 'while %1 %2 %3', args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }], previousStatement: null, nextStatement: null, style: 'farm_loop', tooltip: 'Keep going as long as the question is true' },
    { type: 'farm_if', message0: 'if %1 then %2 %3', args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }], previousStatement: null, nextStatement: null, style: 'farm_logic', tooltip: 'Only when the question is true' },
    { type: 'farm_ifelse', message0: 'if %1 then %2 %3 else %4 %5', args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'ELSE' }], previousStatement: null, nextStatement: null, style: 'farm_logic', tooltip: 'Two paths: one for true, one for false' },
    sense('farm_is_dry', t('dry?')), sense('farm_is_ripe', t('ripe?')), sense('farm_has_crop', 'crop here?'), sense('farm_has_weed', 'weeds here?'),
    sense('farm_is_grass', t('grass?')), sense('farm_is_field', 'on farmland?'),
    { type: 'farm_can_move', message0: 'can move %1 ?', args0: [{ type: 'field_dropdown', name: 'DIR', options: DIRS }], output: 'Boolean', style: 'farm_sense' },
  ];
  for (const d of defs) { d.message0 = tr(d.message0 as string); if (d.message1) d.message1 = tr(d.message1 as string); if (d.tooltip) d.tooltip = tr(d.tooltip as string); }
  Blockly.common.defineBlocksWithJsonArray(defs);

  const g = javascriptGenerator;
  const stmt = (code: string) => () => code + '\n';
  g.forBlock['farm_start'] = () => '';
  g.forBlock['farm_move'] = (b) => `move("${b.getFieldValue('DIR')}");\n`;
  g.forBlock['farm_plant'] = (b) => `plant("${b.getFieldValue('CROP')}");\n`;
  g.forBlock['farm_water'] = stmt('water();');
  g.forBlock['farm_harvest'] = stmt('harvest();');
  g.forBlock['farm_sleep'] = stmt('sleep();');
  g.forBlock['farm_till'] = stmt('till();');
  g.forBlock['farm_pull_weed'] = stmt('pullWeed();');
  g.forBlock['farm_next_row'] = stmt('nextRow();');
  g.forBlock['farm_refill'] = stmt('refill();');
  g.forBlock['farm_say'] = (b) => `say(${JSON.stringify(b.getFieldValue('TEXT'))});\n`;
  g.forBlock['farm_repeat'] = (b, gen) => {
    let depth = 0;
    for (let p = b.getSurroundParent(); p; p = p.getSurroundParent()) if (p.type === 'farm_repeat') depth++;
    const v = ['i', 'j', 'k', 'm', 'n'][Math.min(depth, 4)];
    return `for (let ${v} = 0; ${v} < ${Number(b.getFieldValue('TIMES'))}; ${v}++) {\n${gen.statementToCode(b, 'DO')}}\n`;
  };
  g.forBlock['farm_while'] = (b, gen) => `while (${gen.valueToCode(b, 'COND', Order.NONE) || 'false'}) {\n${gen.statementToCode(b, 'DO')}}\n`;
  g.forBlock['farm_if'] = (b, gen) => `if (${gen.valueToCode(b, 'COND', Order.NONE) || 'false'}) {\n${gen.statementToCode(b, 'DO')}}\n`;
  g.forBlock['farm_ifelse'] = (b, gen) => `if (${gen.valueToCode(b, 'COND', Order.NONE) || 'false'}) {\n${gen.statementToCode(b, 'DO')}} else {\n${gen.statementToCode(b, 'ELSE')}}\n`;
  const q = (name: string) => () => [`${name}()`, Order.FUNCTION_CALL] as [string, Order];
  g.forBlock['farm_is_dry'] = q('isDry');
  g.forBlock['farm_is_ripe'] = q('isRipe');
  g.forBlock['farm_has_crop'] = q('hasCrop');
  g.forBlock['farm_has_weed'] = q('hasWeed');
  g.forBlock['farm_is_grass'] = q('isGrass');
  g.forBlock['farm_is_field'] = q('isField');
  g.forBlock['farm_can_move'] = (b) => [`canMove("${b.getFieldValue('DIR')}")`, Order.FUNCTION_CALL];
}

export const theme = () => Blockly.Theme.defineTheme('realm-farm', {
  name: 'realm-farm',
  base: Blockly.Themes.Classic,
  blockStyles: {
    farm_start: { colourPrimary: '#c0462a', colourSecondary: '#e0603a', colourTertiary: '#8e2a23', hat: 'cap' },
    farm_move: { colourPrimary: '#3f8fd6', colourSecondary: '#5aa6e8', colourTertiary: '#285c94' },
    farm_action: { colourPrimary: '#4e9f35', colourSecondary: '#6cc04a', colourTertiary: '#2f6a1e' },
    farm_loop: { colourPrimary: '#d9902a', colourSecondary: '#e7a72c', colourTertiary: '#a86e16' },
    farm_logic: { colourPrimary: '#8a56c9', colourSecondary: '#a47ce0', colourTertiary: '#5c3590' },
    farm_sense: { colourPrimary: '#2f9a8a', colourSecondary: '#4ab8a6', colourTertiary: '#1f6a5e' },
    logic_blocks: { colourPrimary: '#8a56c9', colourSecondary: '#a47ce0', colourTertiary: '#5c3590' },
  },
  categoryStyles: {},
  componentStyles: {
    workspaceBackgroundColour: '#f3e2b8', toolboxBackgroundColour: '#6b4226', flyoutBackgroundColour: '#e2c994', flyoutOpacity: 1,
    scrollbarColour: '#a8743f', scrollbarOpacity: 0.8, insertionMarkerColour: '#2b1a12', insertionMarkerOpacity: 0.3, cursorColour: '#2b1a12',
  },
  fontStyle: { family: "'Jersey 15', sans-serif", weight: 'normal', size: 15 },
  startHats: true,
});

/** The block palette for a level's tools. */
export function toolboxFor(tools: string[]) {
  const contents: Record<string, unknown>[] = [];
  for (const t of tools) {
    const type = TOOL_BLOCK[t];
    if (!type) continue;
    if (t === 'move') for (const d of ['right', 'left', 'down', 'up']) contents.push({ kind: 'block', type, fields: { DIR: d } });
    else if (t === 'repeat') contents.push({ kind: 'block', type, fields: { TIMES: 3 } });
    else contents.push({ kind: 'block', type });
  }
  return { kind: 'flyoutToolbox', contents };
}

/** JavaScript for the program under "when Run". With ids, each statement first calls __hl(id). */
export function workspaceCode(ws: Blockly.Workspace, withIds: boolean): string {
  const g = javascriptGenerator;
  g.STATEMENT_PREFIX = withIds ? '__hl(%1);\n' : null;
  g.init(ws);
  const start = ws.getTopBlocks(false).find((b) => b.type === 'farm_start');
  let code = start ? (g.blockToCode(start) as string) : '';
  code = g.finish(code);
  g.STATEMENT_PREFIX = null;
  return code.trim();
}

/** Blocks used (attached to "when Run", not counting it). */
export function blockCountOf(ws: Blockly.Workspace): number {
  const start = ws.getTopBlocks(false).find((b) => b.type === 'farm_start');
  return start ? start.getDescendants(false).filter((b) => !b.isShadow()).length - 1 : 0;
}

export { Blockly };
