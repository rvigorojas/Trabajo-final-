import { useEffect, useRef } from "react"

/*
 * Polling a intervalo fijo (ADR-5: 3s para el COE). Llama a `callback` inmediatamente al montar
 * (no espera el primer tick) y limpia el interval al desmontar.
 */
export function usePolling(callback: () => void, intervalMs = 3000): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    callbackRef.current()
    const id = setInterval(() => callbackRef.current(), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
