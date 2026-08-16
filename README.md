# BreathAI

Git 협업 가이드
1. Branch 전략
메인 브랜치
브랜치	역할	규칙
main	최종 배포용. 항상 동작하는 상태를 유지합니다.	직접 push 금지. develop에서만 PR로 병합합니다.
develop	최신 개발 반영용. 기능 브랜치가 모이는 통합 브랜치입니다.	직접 push 금지. 기능 브랜치에서 PR로 병합합니다.
두 브랜치는 삭제하지 않고 계속 유지합니다.

기능 브랜치
작업 하나당 브랜치 하나를 생성하고, 병합이 끝나면 삭제합니다. 개인 이름 브랜치를 만들어 계속 사용하지 않습니다.

브랜치명 형식

타입/영역/기능/역할
타입: feat, fix, refactor, docs, style, test, chore (소문자)
영역: 화면 또는 도메인 단위 (community, home, auth 등)
기능: 구체적인 작업 대상 (review, feed 등)
역할: AI, BE, FE (대문자)
예시

feat/community/review/BE
feat/community/review/FE
feat/home/feed/FE
fix/auth/token/BE
refactor/chat/pipeline/AI
같은 기능을 여러 역할이 함께 개발하는 경우
브랜치를 공유하지 않고 역할별로 각자 생성합니다. 한쪽 작업이 끝나지 않아 다른 쪽이 병합하지 못하는 상황을 막기 위함입니다.

BE  : develop → feat/community/review/BE → PR → develop
FE  : develop → feat/community/review/FE → PR → develop
기능 단위의 묶음은 브랜치가 아니라 Issue로 관리합니다. 하나의 Issue에 역할별 PR을 함께 연결해 진행 상황을 추적합니다. API가 필요한 작업은 브랜치를 나누기 전에 요청/응답 명세를 먼저 합의합니다.

2. 작업 흐름
기능 Issue 생성 후 Issue 번호 발급
develop 브랜치를 최신 상태로 갱신
develop에서 기능 브랜치 생성
기능 개발 및 Commit
작업 완료 후 develop 브랜치로 Pull Request 생성
코드 리뷰 후 Merge, 병합된 기능 브랜치 삭제
배포 시점에 develop → main PR 생성
명령어

# 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feat/community/review/BE

# 작업 후 push
git push -u origin feat/community/review/BE

# 작업이 길어질 경우 중간에 develop 반영
git pull --rebase origin develop
3. 작업 타입
타입
설명
Feat
새로운 기능 추가
Fix
버그 수정
Refactor
동작 변화 없이 구조를 개선하는 작업
Docs
README, 주석 등 문서 작성 및 수정
Style
코드 포맷, 네이밍, 세미콜론 등 기능과 무관한 스타일 변경
Test
테스트 코드 추가 및 수정
Chore
설정, 빌드, 패키지 등 기타 변경 작업
Issue, Commit, Pull Request, 브랜치명에 동일한 타입을 통일해서 사용합니다. (브랜치명에서는 소문자로 표기합니다. 예: Feat → feat/...)

4. Commit 템플릿
타입: 간단한 설명

- 작업한 내용에 대한 구체적인 설명
- 필요한 경우 여러 줄로 상세하게 작성
예시

Feat: 커뮤니티 리뷰 작성 기능 추가

- 리뷰 작성 UI 구현
- 리뷰 등록 API 연결
- 작성 완료 후 리뷰 목록 갱신
5. Pull Request 템플릿
타입: 간단한 설명

## 작업 내용
- 무엇을 변경했는지 간단히 작성

## 참고 사항
- 리뷰 시 유의해야 할 사항

## 관련 이슈
close #이슈번호
기능 브랜치의 PR 대상은 develop입니다.
배포용 PR(develop → main)은 포함된 변경 사항을 목록으로 정리합니다.
6. Issue 템플릿
타입: 이슈 제목

## 이슈 개요
- 어떤 작업인지 간략히 설명

## 작업 항목
- [ ] 작업 1
- [ ] 작업 2
- [ ] 작업 3

## 참고 자료
- 관련 문서, 디자인, 링크 등
7. 전체 작업 순서
Issue 생성
→ develop 최신화
→ Branch 생성 (타입/영역/기능/역할)
→ 기능 개발
→ Commit
→ Pull Request (→ develop)
→ Code Review
→ develop Merge
→ Branch 삭제
→ (배포 시점) develop → main Merge
