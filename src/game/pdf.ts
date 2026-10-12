import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

// pdf.js는 무거워서(수백 KB) 학습지를 처음 열 때만 불러온다.
// 학교 크롬북이 오래됐을 수 있어 legacy 빌드를 쓴다.
// 실패 단계: lib = 프로그램 조각을 못 받음(앱이 새로 배포된 직후 등), net = PDF 파일을 못 받음, parse = PDF를 해석 못 함
export type PdfStage = 'lib' | 'net' | 'parse'
export class PdfError extends Error {
  stage: PdfStage
  constructor(stage: PdfStage, cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause))
    this.stage = stage
  }
}

let lib: Promise<typeof import('pdfjs-dist')> | null = null
function loadPdfjs() {
  lib ??= import('pdfjs-dist/legacy/build/pdf.mjs')
    .then((m) => {
      m.GlobalWorkerOptions.workerSrc = workerUrl
      return m
    })
    .catch((e) => {
      lib = null // 한 번 실패해도 다음에 다시 시도할 수 있게
      throw new PdfError('lib', e)
    })
  return lib
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchBytes(url: string): Promise<Uint8Array> {
  try {
    const r = await fetch(url)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return new Uint8Array(await r.arrayBuffer())
  } catch (e) {
    throw new PdfError('net', e)
  }
}

async function openOnce(url: string): Promise<PDFDocumentProxy> {
  const [m, data] = await Promise.all([loadPdfjs(), fetchBytes(url)])
  try {
    return await m.getDocument({ data, ...assets() }).promise
  } catch (e) {
    throw new PdfError('parse', e)
  }
}

// 인터넷이 잠깐 끊기거나 느릴 때를 위해 두 번까지 다시 시도한다.
async function openWithRetry(url: string): Promise<PDFDocumentProxy> {
  let last: unknown
  for (let i = 0; i < 3; i++) {
    try {
      return await openOnce(url)
    } catch (e) {
      last = e
      if (e instanceof PdfError && e.stage === 'parse') break // 파일 자체가 문제면 다시 해도 소용없다
      await sleep(900 * (i + 1))
    }
  }
  throw last
}

// 글꼴이 PDF 안에 없을 때(한글 문서 등)를 위한 글꼴 정보. public/pdfjs 에 들어 있다.
const assets = () => ({
  cMapUrl: `${import.meta.env.BASE_URL}pdfjs/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
})

const cache = new Map<string, Promise<PDFDocumentProxy>>()

// 같은 학습지를 다시 열 때 다시 내려받지 않도록 문서를 기억해 둔다.
export function openPdf(url: string): Promise<PDFDocumentProxy> {
  let p = cache.get(url)
  if (!p) {
    p = openWithRetry(url)
    p.catch(() => cache.delete(url))
    cache.set(url, p)
  }
  return p
}

// 업로드 전에 PDF가 맞는지 확인하고 쪽수를 센다. 실패하면 null.
export async function readPdfPages(file: File): Promise<number | null> {
  try {
    const m = await loadPdfjs()
    const data = new Uint8Array(await file.arrayBuffer())
    const task = m.getDocument({ data, ...assets() })
    const n = (await task.promise).numPages
    void task.destroy()
    return n
  } catch {
    return null
  }
}
