import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrFetch, invalidateSldsCache } from "../src/slds/cache";

describe("slds getOrFetch", () => {
  beforeEach(() => {
    invalidateSldsCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T12:00:00Z"));
  });

  it("fetches once then serves from cache within the TTL", async () => {
    const fetcher = vi.fn(async () => ({ ok: true }));

    await expect(getOrFetch("probe", fetcher)).resolves.toEqual({ ok: true });
    await expect(getOrFetch("probe", fetcher)).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date("2026-08-22T12:00:00Z"));
    await expect(getOrFetch("probe", fetcher)).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("force bypasses a fresh cache entry", async () => {
    const fetcher = vi.fn(async () => "v1");
    await getOrFetch("forced", fetcher);
    fetcher.mockResolvedValueOnce("v2");
    await expect(getOrFetch("forced", fetcher, { force: true })).resolves.toBe("v2");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
