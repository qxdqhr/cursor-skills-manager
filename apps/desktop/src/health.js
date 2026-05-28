async function waitForHealth(url, timeoutMs = 60_000, intervalMs = 300) {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (res.ok) {
        return true;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`等待服务就绪超时: ${url}${lastError ? ` (${lastError.message})` : ''}`);
}

module.exports = { waitForHealth };
