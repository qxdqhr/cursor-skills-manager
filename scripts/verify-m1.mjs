#!/usr/bin/env node
import {
  scanPersonalSkills,
  scanProjectSkills,
  defaultPersonalRoot,
} from '../packages/core/dist/index.js';

const personal = await scanPersonalSkills({
  root: defaultPersonalRoot(),
  checkAgents: false,
});
const { skills: project } = await scanProjectSkills();

console.log(`personal skills: ${personal.length}`);
console.log(`project skills: ${project.length}`);
if (personal.length < 17) {
  console.error(`Expected >= 17 personal skills, got ${personal.length}`);
  process.exit(1);
}
const profile = project.find((s) => s.skillId.includes('profile-v1'));
if (!profile) {
  console.warn('warn: profile-v1 project skill not found (optional)');
} else {
  console.log(`found project skill: ${profile.skillId}`);
}
console.log('M1 verify ok');
