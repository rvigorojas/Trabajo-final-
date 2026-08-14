/*
 * Wrapper mínimo de IndexedDB en promesas — un único object store `cola` (keyPath `id`) para las
 * 4 escrituras offline-capaces (ítem #10, ADR-6). Sin librería: son 3 operaciones (get-all, put,
 * delete) que no justifican una dependencia nueva.
 */

const DB_NAME = "pce-pmm-offline"
const DB_VERSION = 1
export const STORE_COLA = "cola"

export interface EntradaCola {
  id: string
  path: string
  body: unknown
  encoladoEn: number
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_COLA)) {
        db.createObjectStore(STORE_COLA, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function conStore<T>(
  modo: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrirDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_COLA, modo)
    const store = tx.objectStore(STORE_COLA)
    const request = fn(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function agregarACola(entrada: EntradaCola): Promise<void> {
  await conStore("readwrite", (store) => store.put(entrada))
}

export async function listarCola(): Promise<EntradaCola[]> {
  const entradas = await conStore<EntradaCola[]>("readonly", (store) => store.getAll())
  return entradas.sort((a, b) => a.encoladoEn - b.encoladoEn)
}

export async function quitarDeCola(id: string): Promise<void> {
  await conStore("readwrite", (store) => store.delete(id))
}
