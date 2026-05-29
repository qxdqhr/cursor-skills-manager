import { describe, expect, it } from 'vitest';
import { parseProcEnviron, resolveGuiEnv } from './openDesktop.js';

describe('parseProcEnviron', () => {
  it('parses null-separated proc environ buffer', () => {
    const raw = Buffer.from('DISPLAY=:0\0XAUTHORITY=/tmp/xauth_test\0HOME=/home/u\0', 'latin1');
    expect(parseProcEnviron(raw)).toEqual({
      DISPLAY: ':0',
      XAUTHORITY: '/tmp/xauth_test',
      HOME: '/home/u',
    });
  });
});

describe('resolveGuiEnv', () => {
  it('fills dbus and runtime dir from uid when missing', () => {
    const uid = typeof process.getuid === 'function' ? process.getuid()! : 1000;
    const env = resolveGuiEnv({});
    expect(env.XDG_RUNTIME_DIR).toBe(`/run/user/${uid}`);
    expect(env.DBUS_SESSION_BUS_ADDRESS).toBe(`unix:path=/run/user/${uid}/bus`);
  });

  it('defaults DISPLAY when neither display protocol is set', () => {
    const env = resolveGuiEnv({});
    expect(env.DISPLAY).toBe(':0');
  });

  it('preserves existing session variables', () => {
    const env = resolveGuiEnv({
      DISPLAY: ':1',
      WAYLAND_DISPLAY: 'wayland-0',
      DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/1000/bus',
    });
    expect(env.DISPLAY).toBe(':1');
    expect(env.WAYLAND_DISPLAY).toBe('wayland-0');
    expect(env.DBUS_SESSION_BUS_ADDRESS).toBe('unix:path=/run/user/1000/bus');
  });

  it('uses desktop session XAUTHORITY when plasma is running', () => {
    if (process.platform !== 'linux') return;
    const env = resolveGuiEnv({});
    if (!env.XAUTHORITY) return;
    expect(env.XAUTHORITY).not.toBe(`${process.env.HOME}/.Xauthority`);
  });
});
