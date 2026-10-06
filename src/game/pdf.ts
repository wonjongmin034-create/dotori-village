import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

// pdf.js는 무거워서(수백 KB) 학습지를 처음 열 때만 불러온다.
// 학교 크롬북이 오래됐을 수 있어 legacy 빌드를 쓴다.
let lib: Promise<typeof import('pdfjs-dist')> | null = null
function loadPdfjs() {
  lib ??= import('pdfjs-dist/legacy/build/pdf.mjs').then((m) => {
    m.GlobalWorkerOptions.workerSrc = workerUrl
    return m
  })
  return lib
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
    p = Promise.all([
      loadPdfjs(),
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.arrayBuffer()
      }),
    ]).then(([m, buf]) => m.getDocument({ data: new Uint8Array(buf), ...assets() }).promise)
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
