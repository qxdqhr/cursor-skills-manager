import { execFile, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const GUI_ENV_KEYS = [
  'DISPLAY',
  'WAYLAND_DISPLAY',
  'XAUTHORITY',
  'DBUS_SESSION_BUS_ADDRESS',
  'XDG_RUNTIME_DIR',
  'XDG_CURRENT_DESKTOP',
  'KDE_SESSION_VERSION',
  'DESKTOP_SESSION',
] as const;

const OPEN_TIMEOUT_MS = 15_000;

export function parseProcEnviron(raw: Buffer): Record<string, string> {
  const env: Record<string, string> = {};
  for (const part of raw.toString('latin1').split('\0')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    env[part.slice(0, eq)] = part.slice(eq + 1);
  }
  return env;
}

function readDesktopProcessEnv(uid: number): Record<string, string> | null {
  if (process.platform !== 'linux') return null;
  const processes = ['plasmashell', 'kwin_x11', 'kwin_wayland', 'gnome-shell', 'sway', 'xfce4-session'];
  for (const name of processes) {
    try {
      const pid = execFileSync('pgrep', ['-u', String(uid), '-n', name], { encoding: 'utf8' }).trim();
      if (!pid || !/^\d+$/.test(pid)) continue;
      if (!existsSync(`/proc/${pid}/environ`)) continue;
      const parsed = parseProcEnviron(readFileSync(`/proc/${pid}/environ`));
      if (parsed.DISPLAY || parsed.WAYLAND_DISPLAY) {
        return parsed;
      }
    } catch {
      /* try next process */
    }
  }
  return null;
}

function readLoginctlDisplayEnv(uid: number): Record<string, string> | null {
  if (process.platform !== 'linux') return null;
  try {
    const sessions = execFileSync('loginctl', ['list-sessions', '--no-legend'], { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
    for (const line of sessions) {
      const sessionId = line.trim().split(/\s+/)[0];
      if (!sessionId) continue;
      const info = execFileSync(
        'loginctl',
        ['show-session', sessionId, '-p', 'Display', '-p', 'Type', '-p', 'Active', '-p', 'State', '-p', 'User'],
        { encoding: 'utf8' },
      );
      const fields = Object.fromEntries(
        info
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((row) => {
            const idx = row.indexOf('=');
            return idx > 0 ? [row.slice(0, idx), row.slice(idx + 1)] : [row, ''];
          }),
      );
      if (fields.User !== String(uid)) continue;
      if (fields.Active !== 'yes' || fields.State !== 'active') continue;
      if (fields.Type !== 'x11' && fields.Type !== 'wayland') continue;
      if (!fields.Display) continue;
      return { DISPLAY: fields.Display };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Resolve DBus / X11 / Wayland env when API runs without a full desktop session. */
export function resolveGuiEnv(base: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const env = { ...base };
  const uid = typeof process.getuid === 'function' ? process.getuid() : undefined;

  const desktop = uid !== undefined ? readDesktopProcessEnv(uid) : null;
  if (desktop) {
    for (const key of GUI_ENV_KEYS) {
      const value = desktop[key];
      if (value && base[key] === undefined) env[key] = value;
    }
  } else if (uid !== undefined) {
    const sessionDisplay = readLoginctlDisplayEnv(uid);
    if (sessionDisplay?.DISPLAY && base.DISPLAY === undefined) {
      env.DISPLAY = sessionDisplay.DISPLAY;
    }
  }

  const runtime = env.XDG_RUNTIME_DIR ?? (uid !== undefined ? `/run/user/${uid}` : undefined);
  if (runtime) {
    env.XDG_RUNTIME_DIR ??= runtime;
    env.DBUS_SESSION_BUS_ADDRESS ??= `unix:path=${join(runtime, 'bus')}`;
  }

  if (!env.DISPLAY && !env.WAYLAND_DISPLAY) {
    env.DISPLAY = ':0';
  }

  return env;
}

async function commandExists(cmd: string, env: NodeJS.ProcessEnv): Promise<boolean> {
  try {
    await execFileAsync('sh', ['-c', `command -v ${JSON.stringify(cmd)}`], { env });
    return true;
  } catch {
    return false;
  }
}

function formatExecError(cmd: string, args: string[], err: unknown): string {
  const e = err as { message?: string; stderr?: string; stdout?: string };
  const detail = [e.stderr, e.stdout, e.message].filter(Boolean).join('\n').trim();
  return detail ? `${cmd} ${args.join(' ')}\n${detail}` : `${cmd} ${args.join(' ')}`;
}

async function runGuiCommand(cmd: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  await execFileAsync(cmd, args, {
    env,
    timeout: OPEN_TIMEOUT_MS,
    maxBuffer: 512 * 1024,
  });
}


function isKdeSession(env: NodeJS.ProcessEnv): boolean {
  const desktop = (env.XDG_CURRENT_DESKTOP ?? env.DESKTOP_SESSION ?? '').toLowerCase();
  return desktop.includes('kde') || Boolean(env.KDE_SESSION_VERSION);
}

function buildFolderOpenAttempts(folderPath: string, env: NodeJS.ProcessEnv): [string, string[]][] {
  const attempts: [string, string[]][] = [];
  if (isKdeSession(env)) {
    attempts.push(['dolphin', ['--select', folderPath]], ['dolphin', [folderPath]]);
  }
  attempts.push(['gio', ['open', folderPath]]);
  if (process.platform !== 'linux') {
    attempts.push(['xdg-open', [folderPath]]);
  }
  attempts.push(
    ['nautilus', [folderPath]],
    ['thunar', [folderPath]],
    ['pcmanfm', [folderPath]],
  );
  return attempts;
}

/**
 * Open a directory in the user's file manager.
 * Uses the active desktop session env (incl. XAUTHORITY from plasmashell/kwin).
 */
export async function openFolderInFileManager(
  folderPath: string,
  options?: { fileManager?: string },
): Promise<void> {
  const env = resolveGuiEnv();
  const override = options?.fileManager?.trim() || process.env.CSM_FILE_MANAGER?.trim();

  if (override) {
    const parts = override.split(/\s+/).filter(Boolean);
    const cmd = parts[0]!;
    const extra = parts.slice(1);
    if (!(await commandExists(cmd, env))) {
      throw new Error(`Configured file manager not found: ${cmd}`);
    }
    try {
      await runGuiCommand(cmd, [...extra, folderPath], env);
      return;
    } catch (err) {
      throw new Error(formatExecError(cmd, [...extra, folderPath], err));
    }
  }

  const attempts = buildFolderOpenAttempts(folderPath, env);
  const errors: string[] = [];

  for (const [cmd, args] of attempts) {
    if (!(await commandExists(cmd, env))) continue;
    try {
      await runGuiCommand(cmd, args, env);
      return;
    } catch (err) {
      errors.push(formatExecError(cmd, args, err));
    }
  }

  throw new Error(
    `Cannot open folder: ${folderPath}\n` +
      (errors.length ? errors.join('\n\n') : 'No file manager CLI found.') +
      '\n\nSet paths.fileManager to "dolphin" in .csm/config.json or CSM_FILE_MANAGER=dolphin.',
  );
}

export type EditorLaunch = {
  cmd: string;
  args: string[];
};

/** Resolve editor CLI: config → CSM_EDITOR → code → cursor → codium */
export async function resolveEditorLaunch(
  folderPath: string,
  configured?: string,
): Promise<EditorLaunch> {
  const env = resolveGuiEnv();
  const candidates = [
    configured?.trim(),
    process.env.CSM_EDITOR?.trim(),
    'code',
    'cursor',
    'codium',
  ].filter((v): v is string => Boolean(v));

  for (const candidate of candidates) {
    const parts = candidate.split(/\s+/).filter(Boolean);
    const cmd = parts[0]!;
    const prefix = parts.slice(1);
    if (!(await commandExists(cmd, env))) continue;
    return { cmd, args: [...prefix, folderPath] };
  }

  throw new Error(
    'No editor CLI found (tried code, cursor, codium). ' +
      'Install VS Code or set paths.editor in ~/.cursor/skills/.csm/config.json, e.g. "code".',
  );
}

export async function openFolderInEditor(folderPath: string, configured?: string): Promise<EditorLaunch> {
  const env = resolveGuiEnv();
  const launch = await resolveEditorLaunch(folderPath, configured);
  try {
    await runGuiCommand(launch.cmd, launch.args, env);
  } catch (err) {
    throw new Error(formatExecError(launch.cmd, launch.args, err));
  }
  return launch;
}
