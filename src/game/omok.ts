// 오목 규칙 (쉬운 규칙): 가로·세로·대각선으로 같은 색 돌 5개 이상이 이어지면 이긴다. 금지수 없음.
// 판은 15×15. 칸 번호 = y * 15 + x. 수(moves)는 칸 번호를 둔 순서대로 담은 배열이고, 짝수 번째(0,2,4…)가 흑(선)이다.

export const N = 15
export const MIN_MOVES_FOR_REWARD = 10 // 이보다 일찍 끝난 판은 보상·승점이 없다 (바로 기권해서 보상 받는 것 방지)

export type Cell = 0 | 1 | 2 // 0 = 빈 칸, 1 = 흑, 2 = 백

export function boardOf(moves: number[]): Cell[] {
  const b: Cell[] = new Array(N * N).fill(0)
  moves.forEach((c, i) => {
    b[c] = i % 2 === 0 ? 1 : 2
  })
  return b
}

const DIRS: [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]

// 마지막으로 둔 수가 5개 이상을 만들었는지. 만들었으면 그 줄의 칸 번호들.
export function winLine(board: Cell[], last: number): number[] | null {
  const color = board[last]
  if (!color) return null
  const lx = last % N
  const ly = Math.floor(last / N)
  for (const [dx, dy] of DIRS) {
    const line = [last]
    for (const s of [1, -1]) {
      let x = lx + dx * s
      let y = ly + dy * s
      while (x >= 0 && x < N && y >= 0 && y < N && board[y * N + x] === color) {
        line.push(y * N + x)
        x += dx * s
        y += dy * s
      }
    }
    if (line.length >= 5) return line
  }
  return null
}

export type Outcome = { over: false } | { over: true; winner: 'black' | 'white' | null; line: number[] }

// 수 목록만 보고 판의 결과를 계산한다. 같은 수 목록이면 누가 계산해도 결과가 같다.
export function evaluate(moves: number[]): Outcome {
  if (moves.length === 0) return { over: false }
  const board = boardOf(moves)
  const last = moves[moves.length - 1]
  const line = winLine(board, last)
  if (line) return { over: true, winner: moves.length % 2 === 1 ? 'black' : 'white', line }
  if (moves.length >= N * N) return { over: true, winner: null, line: [] }
  return { over: false }
}

// 둘 수 있는 수인지 (판 안, 빈 칸)
export function canPlay(moves: number[], cell: number): boolean {
  return Number.isInteger(cell) && cell >= 0 && cell < N * N && !moves.includes(cell)
}

export const cellName = (c: number) => `${String.fromCharCode(65 + (c % N))}${Math.floor(c / N) + 1}`
