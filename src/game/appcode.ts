import { supabase } from './supabase'

// 앱 입장 코드. 코드 자체는 Supabase DB(app_config)에만 있고, 여기서는 "맞는지"만 서버에 물어본다.
const KEY = 'dotori.code.v1'

type Check = 'yes' | 'no' | 'missing' | 'network'

async function ask(code: string): Promise<Check> {
  try {
    const { data, error } = await supabase.rpc('check_app_code', { input: code })
    if (error) {
      // 함수가 아직 없으면(schema-6 미실행) 잠그지 않는다
      const e = error as { code?: string; message?: string }
      if (e.code === 'PGRST202' || /could not find the function/i.test(e.message ?? '')) return 'missing'
      return 'network'
    }
    return data === true ? 'yes' : 'no'
  } catch {
    return 'network'
  }
}

const stored = () => {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

// 앱을 열 때: 이 기기에 저장된 코드가 아직 맞는지 확인. 'need' = 코드 입력 화면을 보여야 함.
export async function checkStoredCode(): Promise<'ok' | 'need'> {
  const saved = stored()
  const r = await ask(saved)
  if (r === 'yes' || r === 'missing') return 'ok'
  if (r === 'network') return saved ? 'ok' : 'need' // 인터넷이 끊겨도 한 번 열어 둔 기기는 그대로 사용
  return 'need'
}

export async function submitCode(code: string): Promise<'ok' | 'wrong' | 'network'> {
  const r = await ask(code.trim())
  if (r === 'yes' || r === 'missing') {
    try {
      localStorage.setItem(KEY, code.trim())
    } catch {
      /* noop */
    }
    return 'ok'
  }
  return r === 'no' ? 'wrong' : 'network'
}

export function forgetCode() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}
