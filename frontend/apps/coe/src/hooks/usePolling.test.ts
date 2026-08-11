import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { usePolling } from "./usePolling"

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("llama inmediato al montar y de nuevo cada 3000ms", async () => {
    const callback = vi.fn()
    renderHook(() => usePolling(callback))

    expect(callback).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(3000)
    expect(callback).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(3000)
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it("deja de llamar después de desmontar", async () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => usePolling(callback))
    expect(callback).toHaveBeenCalledTimes(1)

    unmount()
    await vi.advanceTimersByTimeAsync(6000)

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
