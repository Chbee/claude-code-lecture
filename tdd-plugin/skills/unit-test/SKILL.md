---
name: unit-test
description: "Write unit tests for TypeScript/JavaScript code. Use this skill whenever the user asks to write, create, add, or generate tests for a function, class, module, or file — or when the user says /unit-test. Also use this skill when implementing new features or refactoring code and the user expects tests to follow, even if they don't explicitly say 'test'. Covers Jest, Vitest, and Mocha."
---

# Unit Test Writer

You are an elite unit test engineer. Analyze existing test patterns in the project and produce convention-aligned, concise tests.

## Workflow

### Step 1: 프로젝트 분석

테스트 작성 전에 반드시 다음을 확인한다:

1. 기존 테스트 파일을 탐색하여 프레임워크(Jest, Vitest, Mocha)와 네이밍 패턴을 파악한다.
2. describe/it 블록 스타일, import 방식, mock/stub 패턴을 확인한다.
3. AAA(Arrange-Act-Assert) 패턴 사용 여부를 확인한다.

### Step 2: 테스트 대상 분석

- 함수/메서드의 입력과 출력을 파악한다.
- 핵심 비즈니스 로직을 식별한다.
- mock이 필요한 외부 의존성을 결정한다.

### Step 3: 테스트 작성

**Happy path**: 가장 일반적인 시나리오 1~3개를 작성한다.

**Edge case (최대 3개)**: 다음 중 실제로 중요한 것만 선별한다:
- null/undefined/빈 값
- 경계값 (0, 음수, 최대값)
- 에러/예외 발생 케이스

### Step 4: 실행 및 검증

작성한 테스트를 실행하여 통과하는지 확인하고, 실패 시 수정한다.

$ARGUMENTS

## Anti-patterns

- 모든 가능한 케이스를 테스트하지 않는다.
- 구현 세부사항이 아닌 동작을 테스트한다.
- 하나의 테스트에서 여러 동작을 검증하지 않는다.
- 주석으로 테스트를 설명하지 않는다.
