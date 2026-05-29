import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ENABLED_PLATFORMS,
  defaultPlatformsConfig,
  migratePlatformsFromV1,
  resolvePlatforms,
} from './registry.js';
import { defaultConfig } from '../config.js';

describe('platforms/registry', () => {
  it('defaultPlatformsConfig enables cursor, agents, opencode', () => {
    const cfg = defaultPlatformsConfig('/tmp/skills');
    expect(cfg.enabled).toEqual(DEFAULT_ENABLED_PLATFORMS);
    expect(cfg.enabled).toContain('cursor');
    expect(cfg.enabled).toContain('agents');
    expect(cfg.enabled).toContain('opencode');
  });

  it('migratePlatformsFromV1 disables agents when agentsRoot missing', () => {
    const migrated = migratePlatformsFromV1(
      defaultConfig({
        paths: { personalRoot: '/tmp/skills', agentsRoot: undefined },
      }),
    );
    expect(migrated.enabled).not.toContain('agents');
    expect(migrated.definitions?.agents?.enabled).toBe(false);
  });

  it('resolvePlatforms uses paths.agentsRoot override', () => {
    const cfg = defaultConfig({
      paths: {
        personalRoot: '/tmp/skills',
        agentsRoot: '/custom/agents',
      },
    });
    const agents = resolvePlatforms(cfg).find((p) => p.id === 'agents');
    expect(agents?.globalRoot).toBe('/custom/agents');
    expect(agents?.enabled).toBe(true);
  });
});
