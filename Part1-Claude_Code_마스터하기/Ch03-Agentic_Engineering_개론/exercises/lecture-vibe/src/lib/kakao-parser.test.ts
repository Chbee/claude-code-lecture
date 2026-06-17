import { describe, it, expect } from 'vitest'
import { parseKakaoCSV, prepareForAnalysis } from './kakao-parser'

const MAX_CHARS = 80000

function makeMsg(date = '2024-01-01', user = 'A', message = 'hello') {
  return { date, user, message }
}

// "[date] user: message" 형식의 한 줄 길이 계산
function lineLen(date: string, user: string, message: string) {
  return `[${date}] ${user}: ${message}`.length
}

// ---- parseKakaoCSV ----

describe('parseKakaoCSV', () => {
  it('정상 CSV를 파싱한다', () => {
    const csv = [
      'Date,User,Message',
      '2024-01-01 09:00:00,Alice,안녕하세요',
      '2024-01-01 09:01:00,Bob,반갑습니다',
      '2024-01-02 10:00:00,Alice,잘 부탁드려요',
    ].join('\n')

    const result = parseKakaoCSV(csv)

    expect(result.totalCount).toBe(3)
    expect(result.filteredCount).toBe(3)
    expect(result.uniqueUsers).toBe(2)
    expect(result.dateRange?.start).toBe('2024-01-01 09:00:00')
    expect(result.dateRange?.end).toBe('2024-01-02 10:00:00')
    expect(result.messages[0]).toEqual({
      date: '2024-01-01 09:00:00',
      user: 'Alice',
      message: '안녕하세요',
    })
  })

  it('시스템 메시지를 필터링한다', () => {
    const csv = [
      'Date,User,Message',
      '2024-01-01,Alice,안녕하세요',
      '2024-01-01,system,Alice님이 들어왔습니다',
      '2024-01-01,system,Bob님이 나갔습니다',
      '2024-01-01,system,Charlie님을 초대했습니다',
    ].join('\n')

    const result = parseKakaoCSV(csv)

    expect(result.totalCount).toBe(4)
    expect(result.filteredCount).toBe(1)
    expect(result.messages[0].message).toBe('안녕하세요')
  })

  it('스킵 메시지(이모티콘/사진 등)를 필터링한다', () => {
    const csv = [
      'Date,User,Message',
      '2024-01-01,Alice,이모티콘',
      '2024-01-01,Alice,사진',
      '2024-01-01,Alice,동영상',
      '2024-01-01,Alice,파일',
      '2024-01-01,Alice,이모티콘 보냈어요', // 전체 문자열이 아니므로 유지
    ].join('\n')

    const result = parseKakaoCSV(csv)

    expect(result.filteredCount).toBe(1)
    expect(result.messages[0].message).toBe('이모티콘 보냈어요')
  })

  it('헤더만 있는 빈 CSV는 빈 결과를 반환한다', () => {
    const result = parseKakaoCSV('Date,User,Message')

    expect(result.messages).toEqual([])
    expect(result.totalCount).toBe(0)
    expect(result.filteredCount).toBe(0)
    expect(result.dateRange).toBeNull()
    expect(result.uniqueUsers).toBe(0)
  })

  it('필드가 누락된 행을 제외한다', () => {
    const csv = [
      'Date,User,Message',
      '2024-01-01,Alice,정상 메시지',
      '2024-01-01,,메시지만 있음',
      ',Alice,날짜 없음',
      '2024-01-01,Alice,',
    ].join('\n')

    const result = parseKakaoCSV(csv)

    expect(result.filteredCount).toBe(1)
    expect(result.messages[0].message).toBe('정상 메시지')
  })
})

// ---- prepareForAnalysis ----

describe('prepareForAnalysis', () => {
  it('빈 배열은 빈 문자열을 반환한다', () => {
    expect(prepareForAnalysis([])).toBe('')
  })

  it('80,000자 미만이면 모든 메시지를 순서대로 반환한다', () => {
    const messages = [
      makeMsg('2024-01-01', 'A', 'first'),
      makeMsg('2024-01-01', 'A', 'second'),
      makeMsg('2024-01-01', 'A', 'third'),
    ]
    const result = prepareForAnalysis(messages)

    expect(result).toContain('first')
    expect(result).toContain('second')
    expect(result).toContain('third')
    expect(result.indexOf('first')).toBeLessThan(result.indexOf('second'))
    expect(result.length).toBeLessThan(MAX_CHARS)
  })

  it('정확히 80,000자이면 트런케이션 없이 전체를 반환한다', () => {
    // 라인 1개: "[D] U: " (7) + message
    // n개 라인을 join("\n")하면 총 길이 = sum(line) + (n-1)
    // 라인 1개로 딱 80000자 만들기: "[D] U: " + "x".repeat(80000 - 7) = 80000
    const prefix = '[D] U: '
    const msgLen = MAX_CHARS - prefix.length
    const messages = [makeMsg('D', 'U', 'x'.repeat(msgLen))]
    const result = prepareForAnalysis(messages)

    expect(result.length).toBe(MAX_CHARS)
  })

  it('80,001자이면 트런케이션이 발생하고 결과는 80,000자 이하다', () => {
    // line 길이 40000짜리 2개 → join("\n") 시 40000+1+40000 = 80001 > MAX_CHARS
    const prefix = '[D] U: '
    const msgLen = 40000 - prefix.length // 각 라인이 정확히 40000자
    const messages = [
      makeMsg('D', 'U', 'a'.repeat(msgLen)),
      makeMsg('D', 'U', 'b'.repeat(msgLen)),
    ]

    const result = prepareForAnalysis(messages)
    expect(result.length).toBeLessThanOrEqual(MAX_CHARS)
  })

  it('단일 메시지가 80,000자를 초과하면 빈 문자열을 반환한다', () => {
    const prefix = '[D] U: '
    const msgLen = MAX_CHARS - prefix.length + 1 // 80001자 라인
    const messages = [makeMsg('D', 'U', 'x'.repeat(msgLen))]

    expect(prepareForAnalysis(messages)).toBe('')
  })

  it('트런케이션 시 최신 메시지(배열 끝)를 보존한다', () => {
    // 3개 메시지, 3번째가 탈락해야 할 만큼 크게 구성
    const prefix = '[D] U: '
    const bigMsgLen = MAX_CHARS - prefix.length - 10 // 거의 MAX_CHARS
    const messages = [
      makeMsg('D', 'U', 'oldest'),        // 첫 번째 (오래된)
      makeMsg('D', 'U', 'x'.repeat(bigMsgLen)), // 두 번째 (크기 차지)
      makeMsg('D', 'U', 'newest'),        // 세 번째 (최신)
    ]

    const result = prepareForAnalysis(messages)

    expect(result).toContain('newest')
    expect(result).not.toContain('oldest')
  })

  it('트런케이션 시 오래된 메시지(배열 앞)를 제외한다', () => {
    const prefix = '[2024-01-01] Alice: '
    const lineLen40k = 40000 - prefix.length
    const messages = [
      makeMsg('2024-01-01', 'Alice', 'a'.repeat(lineLen40k)), // 오래된
      makeMsg('2024-01-01', 'Alice', 'b'.repeat(lineLen40k)), // 최신
    ]
    // 두 줄 합치면 80001자 → 트런케이션 발생

    const result = prepareForAnalysis(messages)

    expect(result).not.toContain('a'.repeat(10)) // 오래된 메시지 제외
    expect(result).toContain('b'.repeat(10))     // 최신 메시지 포함
  })
})
