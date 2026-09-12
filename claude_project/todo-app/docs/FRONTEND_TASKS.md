# Tika - 프런트엔드 구현 계획 (FRONTEND_TASKS.md)

> COMPONENT_SPEC.md의 컴포넌트 계층을 bottom-up(말단 → 컨테이너)으로 재정렬한 구현 순서.
> 각 컴포넌트는 TDD(Red → Green → Refactor)로 구현하며, 테스트는 구현보다 먼저 작성한다
> ([constitution.md](../.specify/memory/constitution.md) VI. Test-Driven Development).
> 관련 문서: [COMPONENT_SPEC.md](./COMPONENT_SPEC.md), [REQUIREMENTS.md](./REQUIREMENTS.md), [TEST_CASES.md](./TEST_CASES.md), [API_SPEC.md](./API_SPEC.md)

---

## 1. 구현 순서 원칙

- **Bottom-up**: 다른 커스텀 컴포넌트에 의존하지 않는 가장 말단의 조각부터 만들고, 그것들을 조립하는 컴포넌트를 그 다음에 만든다. 상위 컴포넌트를 만들 때는 하위 의존성이 이미 테스트를 통과한 상태여야 한다.
- **Phase 0은 컴포넌트가 아니다**: `ticketApi.ts`, 필터 유틸 함수는 React에 의존하지 않는 순수 로직이라 가장 먼저, 그리고 가장 쉽게(모킹 없이) 테스트할 수 있다. Hook과 Form이 이 위에서 동작한다.
- **각 컴포넌트 = 독립된 TDD 사이클**: 아래 체크리스트의 각 줄은 "실패하는 테스트 작성 → 통과시키는 최소 구현 → 필요 시 리팩터" 순서로 진행한다.
- **테스트 케이스 재사용**: 이미 `docs/TEST_CASES.md`에 정의된 TC-COMP-00X는 그대로 인용한다(새로 정의하지 않음). TC ID가 없는 컴포넌트(Badge, Button, Modal, BoardHeader, FilterBar, ColumnHeader, TicketDetailView, useTickets, ticketApi, board-filters, BoardContainer)는 COMPONENT_SPEC.md/REQUIREMENTS.md 근거로 이 문서에서 체크리스트를 새로 정의한다.
- **파일 위치**: 컴포넌트는 `src/client/components/`, 공용 UI 프리미티브는 `src/client/components/ui/`, Hook은 `src/client/hooks/`, API 클라이언트는 `src/client/api/`, 필터 유틸은 `src/client/lib/`에 둔다 (`tailwind.config.ts`의 `content` 경로 및 COMPONENT_SPEC.md §4와 일치). 테스트는 `__tests__/components/`, `__tests__/client/`에 대응 배치한다.

---

## 2. 의존성 그래프 (Bottom-up)

```
Phase 0  (React 비의존 순수 로직)
├── ticketApi.ts                         (fetch 래퍼: create/update/remove/reorder/complete)
└── board-filters.ts                     (isThisWeek, isOverdue, filterBoard)

Phase 1  (공용 UI 프리미티브 — props만 받음, 상태 없음)
├── ui/Badge.tsx
├── ui/Button.tsx
└── ui/Modal.tsx

Phase 2  (Phase 1을 조합한 leaf 컴포넌트)
├── PriorityBadge.tsx        ← Badge
├── DueDateBadge.tsx         ← Badge
├── ConfirmDialog.tsx        ← Modal, Button
├── ColumnHeader.tsx         (독립)
├── FilterBar.tsx            ← Button 스타일만 재사용(또는 자체 pill 버튼)
├── BoardHeader.tsx          ← Button
└── TicketCard.tsx           ← PriorityBadge, DueDateBadge  (+ dnd-kit useSortable)

Phase 3  (Phase 2 leaf를 나열하는 컴포넌트)
└── Column.tsx               ← ColumnHeader, TicketCard  (+ dnd-kit useDroppable/SortableContext)

Phase 4  (폼 & 읽기전용 뷰 — Phase 1 프리미티브 + 공유 Zod 스키마)
├── TicketDetailView.tsx     ← ui/Badge 계열 재사용
└── TicketForm.tsx           ← ui/Button, src/shared/validations/ticket.ts

Phase 5  (모달 조립)
└── TicketModal.tsx          ← ui/Modal, TicketDetailView, TicketForm, ConfirmDialog

Phase 6  (칼럼을 배치하는 보드 — DnD 컨텍스트 없이 순수 배치/표시만)
└── Board.tsx                ← Column × 4  (+ dnd-kit DndContext, DragOverlay)

Phase 7  (상태/네트워크 Hook — Phase 0 위에서 동작, UI 컴포넌트에 의존하지 않음)
└── useTickets.ts            ← ticketApi.ts, src/shared/types

Phase 8  (최상위 클라이언트 컴포넌트 — 모든 Phase를 엮음)
└── BoardContainer.tsx       ← BoardHeader, FilterBar, Board, TicketModal, ui/Modal+TicketForm(생성),
                                useTickets, board-filters

Phase 9  (서버 진입점)
└── app/page.tsx             ← ticket.service.getBoard() (서버 직접 호출) → BoardContainer

Phase 10 (통합 검증 — 새 컴포넌트 없음, 이미 만든 조각들을 엮어서 흐름 검증)
└── TC-INT-001, TC-INT-002   ← BoardContainer 전체
```

**읽는 법**: 화살표(`←`)는 "이 컴포넌트를 테스트하려면 왼쪽 것들이 먼저 준비돼 있어야 한다"는 뜻이다. 같은 Phase 안의 항목들은 서로 의존하지 않으므로 순서 무관하게(또는 병렬로) 진행할 수 있다.

---

## 3. Phase별 작업 목록 & TDD 체크리스트

### Phase 0 — API 클라이언트 & 필터 유틸 (컴포넌트 아님)

#### 0.1 `src/client/api/ticketApi.ts`

**역할**: 모든 API 호출을 캡슐화. 컴포넌트/Hook은 이 모듈을 통해서만 서버와 통신한다 (COMPONENT_SPEC.md §4).
**의존성**: 없음 (전역 `fetch`만 사용, 테스트에서 모킹)
**내보낼 함수**: `getBoard()`, `createTicket(input)`, `updateTicket(id, input)`, `deleteTicket(id)`, `completeTicket(id)`, `reorderTicket(ticketId, status, position)`

**TDD 체크리스트**:
- [ ] 각 함수가 올바른 method/URL로 `fetch`를 호출한다 (`POST /api/tickets`, `PATCH /api/tickets/:id` 등 — API_SPEC.md 매핑과 정확히 일치)
- [ ] 성공 응답(2xx)이면 JSON을 파싱해 반환한다 (`deleteTicket`은 204라 body 없이 resolve)
- [ ] 실패 응답이면 서버가 내려준 `{ error: { code, message } }`를 담은 커스텀 에러(예: `ApiError`)를 throw한다
- [ ] 네트워크 자체가 실패(fetch reject)해도 호출자가 구분할 수 있는 에러를 throw한다
- [ ] 요청 바디는 `JSON.stringify`로 직렬화되고 `Content-Type: application/json` 헤더가 붙는다

#### 0.2 `src/client/lib/board-filters.ts`

**역할**: FilterBar/BoardContainer가 공유하는 순수 필터 로직 (COMPONENT_SPEC.md §2.3).
**의존성**: `src/shared/types/ticket.ts`

**TDD 체크리스트**:
- [ ] `isThisWeek(ticket)`: `dueDate`가 이번 주(월~일) 범위 안이고 status가 TODO/IN_PROGRESS일 때만 true
- [ ] `isThisWeek(ticket)`: status가 BACKLOG 또는 DONE이면 false (범위 안이어도)
- [ ] `isThisWeek(ticket)`: `dueDate`가 없으면 false
- [ ] `filterBoard(board, filter)`: `filter==='all'`이면 원본 그대로 반환
- [ ] `filterBoard(board, filter)`: `filter==='thisWeek'`/`'overdue'`이면 TODO/IN_PROGRESS 칼럼만 필터링하고 BACKLOG/DONE은 그대로 둔다 (FilterBar §2.3-5: "Backlog 칼럼에는 필터가 적용되지 않음")
- [ ] `countForFilters(board)`: `{ thisWeek, overdue }` 개수를 정확히 계산한다 (FilterBar counts prop 용)

---

### Phase 1 — 공용 UI 프리미티브

#### 1.1 `src/client/components/ui/Badge.tsx`

**역할**: 색상이 있는 작은 pill. `PriorityBadge`/`DueDateBadge`/`TicketDetailView`의 기반.
**Props**: `variant: 'low' | 'medium' | 'high' | 'due' | 'overdue'`, `children`

**TDD 체크리스트**:
- [ ] `children`을 렌더링한다
- [ ] `variant`에 따라 `globals.css`의 `.badge--{variant}` 클래스가 붙는다
- [ ] variant를 생략하면 기본(중립) 스타일로 렌더링된다

#### 1.2 `src/client/components/ui/Button.tsx`

**역할**: 공통 버튼 (COMPONENT_SPEC.md §3 "Button").
**Props**: `variant: 'primary'|'secondary'|'danger'|'ghost'`, `size: 'sm'|'md'|'lg'`, `isLoading?: boolean`, 나머지는 native `<button>` props

**TDD 체크리스트**:
- [ ] 기본 렌더링 시 `children`(라벨) 표시
- [ ] `variant`/`size` 조합에 따라 `globals.css`의 `.btn--{variant}`, `.btn--{size}` 클래스가 붙는다
- [ ] `onClick` prop이 클릭 시 호출된다
- [ ] `disabled` 또는 `isLoading`이면 `disabled` 속성이 적용되고 클릭해도 `onClick`이 호출되지 않는다
- [ ] `isLoading`이면 스피너(`.btn-spinner`)가 표시된다 (TC-COMP-004 C004-7과 동일 요구를 버튼 레벨에서 선검증)

#### 1.3 `src/client/components/ui/Modal.tsx`

**역할**: 오버레이 + 중앙 정렬 컨테이너 (COMPONENT_SPEC.md §3 "Modal").
**Props**: `isOpen: boolean`, `onClose: () => void`, `children`

**TDD 체크리스트** (TicketModal의 C005-1/4/5가 재사용할 기반 동작):
- [ ] `isOpen=false`이면 아무것도 렌더링하지 않는다
- [ ] `isOpen=true`이면 오버레이 + 컨텐츠를 렌더링한다
- [ ] ESC 키 입력 시 `onClose`가 호출된다
- [ ] 오버레이(바깥 영역) 클릭 시 `onClose`가 호출된다
- [ ] 모달 내부(컨텐츠) 클릭은 `onClose`를 호출하지 않는다 (이벤트 버블링 차단)
- [ ] 열려있는 동안 `document.body`에 스크롤 잠금 클래스/스타일이 적용되고, 닫히면 해제된다

---

### Phase 2 — Phase 1을 조합한 leaf 컴포넌트

#### 2.1 `src/client/components/PriorityBadge.tsx`

**의존성**: `ui/Badge`
**Props**: `priority: TicketPriority`

**TDD 체크리스트**:
- [ ] LOW → 회색 variant(`badge--low`)로 렌더링, 라벨 "낮음"(또는 LOW) 표시
- [ ] MEDIUM → 파란색 variant(`badge--medium`)로 렌더링
- [ ] HIGH → 빨간색 variant(`badge--high`)로 렌더링 (REQUIREMENTS.md §6 매핑과 일치)

#### 2.2 `src/client/components/DueDateBadge.tsx`

**의존성**: `ui/Badge`
**Props**: `dueDate: string | null`, `isOverdue: boolean`

**TDD 체크리스트**:
- [ ] `dueDate`가 null이면 아무것도 렌더링하지 않는다 (COMPONENT_SPEC §2.6 "종료예정일 없는 티켓 → 미표시", TC-COMP-001 C001-4)
- [ ] `dueDate`가 있으면 `YYYY-MM-DD` 형식 그대로 표시
- [ ] `isOverdue=true`면 `badge--overdue` 스타일 적용
- [ ] `isOverdue=false`면 일반 `badge--due` 스타일 적용

#### 2.3 `src/client/components/ConfirmDialog.tsx`

**의존성**: `ui/Modal`, `ui/Button`
**Props**: `isOpen`, `message`, `onConfirm`, `onCancel`
**참조 TC**: TC-COMP-006

**TDD 체크리스트**:
- [ ] C006-1: 확인 버튼 클릭 → `onConfirm` 호출
- [ ] C006-2: 취소 버튼 클릭 → `onCancel` 호출 및 다이얼로그 닫힘
- [ ] 확인 버튼은 danger variant(빨간색)로 렌더링된다 (COMPONENT_SPEC §3 "위험 동작은 빨간색 확인 버튼")

#### 2.4 `src/client/components/ColumnHeader.tsx`

**의존성**: 없음 (props만)
**Props**: `title: string`, `count: number`

**TDD 체크리스트** (TC-COMP-002 C002-3의 헤더 부분을 여기서 선검증):
- [ ] 칼럼명(`title`)을 표시한다
- [ ] 티켓 수(`count`)를 뱃지로 표시한다
- [ ] `count === 0`이어도 "0"이 표시된다 (숨기지 않음)

#### 2.5 `src/client/components/FilterBar.tsx`

**의존성**: 없음 (자체 pill 버튼 스타일; `globals.css`의 `.filter-button`)
**Props**: `activeFilter`, `onFilterChange`, `counts`
**동작 근거**: COMPONENT_SPEC.md §2.3

**TDD 체크리스트**:
- [ ] "이번주 업무", "일정 초과" 두 버튼과 각 `counts` 숫자를 표시한다
- [ ] 버튼 클릭 시 `onFilterChange('thisWeek' | 'overdue')`가 호출된다
- [ ] `activeFilter`와 같은 버튼에 `.filter-button--active` 스타일이 적용된다
- [ ] 이미 활성화된 필터 버튼을 다시 클릭하면 `onFilterChange('all')`이 호출된다 (토글 해제, §2.3-3)

#### 2.6 `src/client/components/BoardHeader.tsx`

**의존성**: `ui/Button`
**Props**: `onCreateClick`
**동작 근거**: COMPONENT_SPEC.md §2.2

**TDD 체크리스트**:
- [ ] 검색 입력창이 `disabled` 상태로 렌더링된다 (MVP placeholder, §2.2)
- [ ] "새 업무" 버튼 클릭 시 `onCreateClick`이 호출된다

#### 2.7 `src/client/components/TicketCard.tsx`

**의존성**: `PriorityBadge`, `DueDateBadge`, `@dnd-kit/sortable`(`useSortable`)
**Props**: `ticket: TicketWithMeta`, `onClick`
**참조 TC**: TC-COMP-001

**TDD 체크리스트**:
- [ ] C001-1: 제목, 우선순위 뱃지, 종료예정일이 표시된다
- [ ] C001-2: `isOverdue=true`면 `ticket-card--overdue` 스타일(빨간 테두리)이 적용된다
- [ ] C001-3: `status==='DONE'`이면 완료 스타일(예: 취소선 또는 흐림 처리)이 적용된다
- [ ] C001-4: `dueDate=null`이면 종료예정일 영역이 렌더링되지 않는다 (DueDateBadge에 위임되지만 카드 레벨에서도 재확인)
- [ ] C001-5: 카드 클릭 시 `onClick`이 호출된다
- [ ] C001-6: 200자 제목이 CSS로 말줄임(`truncate`) 처리된다 (`ticket-card-title` 클래스, 스냅샷/클래스 검증)
- [ ] C001-7: LOW/MEDIUM/HIGH에 따라 뱃지 색상이 각각 다르다 (PriorityBadge 위임 검증)
- [ ] 접근성: `role="button"`, `aria-label="티켓: {title}"`이 설정된다
- [ ] 접근성: `Tab`으로 포커스 가능하고 `Enter` 키로 `onClick`이 호출된다
- [ ] `useSortable`이 반환하는 `isDragging`이 true일 때 `ticket-card--dragging` 스타일이 적용된다

---

### Phase 3 — Column

#### 3.1 `src/client/components/Column.tsx`

**의존성**: `ColumnHeader`, `TicketCard`, `@dnd-kit/sortable`(`SortableContext`), `@dnd-kit/core`(`useDroppable`)
**Props**: `status: TicketStatus`, `tickets: TicketWithMeta[]`, `onTicketClick`
**참조 TC**: TC-COMP-002

**TDD 체크리스트**:
- [ ] C002-1: 티켓이 있으면 `TicketCard` 목록 + `ColumnHeader`의 개수 뱃지가 표시된다
- [ ] C002-2: `tickets`가 빈 배열이면 "이 칼럼에 티켓이 없습니다" 안내가 표시된다
- [ ] C002-3: `ColumnHeader`에 칼럼명 + 티켓 수가 전달된다
- [ ] `tickets` 배열 순서(=position 오름차순, 서버에서 이미 정렬되어 옴)대로 카드가 렌더링된다
- [ ] `SortableContext`의 `items`가 `tickets.map(t => t.id)`와 일치한다
- [ ] `status`에 따라 `data-status` 속성이 붙어 `globals.css`의 칼럼별 accent 보더가 적용된다

---

### Phase 4 — 폼 & 읽기전용 뷰

#### 4.1 `src/client/components/TicketDetailView.tsx`

**의존성**: `ui/Badge`(또는 `PriorityBadge`)
**Props**: `ticket: TicketWithMeta`
**참조**: COMPONENT_SPEC.md §2.7 표시 필드 표

**TDD 체크리스트**:
- [ ] 상태(status), 시작일(startedAt), 종료일(completedAt), 생성일(createdAt)을 읽기 전용으로 표시한다
- [ ] `startedAt`/`completedAt`이 `null`이면 "-"로 표시한다 (§2.7 주석)
- [ ] 편집 가능 필드(title 등)를 위한 인터랙션 요소를 포함하지 않는다 (읽기전용 뷰의 책임 분리 확인)

#### 4.2 `src/client/components/TicketForm.tsx`

**의존성**: `ui/Button`, `src/shared/validations/ticket.ts`(`createTicketSchema`/`updateTicketSchema`)
**Props**: `mode: 'create'|'edit'`, `initialData?`, `onSubmit`, `onCancel`, `isLoading`
**참조 TC**: TC-COMP-004

**TDD 체크리스트**:
- [ ] C004-1: `mode="create"`이면 빈 필드 + 우선순위 MEDIUM 기본값으로 렌더링된다
- [ ] C004-2: `mode="edit"` + `initialData`가 있으면 각 필드에 기존 값이 채워진다
- [ ] C004-3: 빈 제목으로 제출하면 "제목을 입력해주세요" 에러가 인라인으로 표시되고 `onSubmit`은 호출되지 않는다
- [ ] C004-4: 과거 종료예정일로 제출하면 "종료예정일은 오늘 이후 날짜를 선택해주세요" 에러가 표시된다
- [ ] C004-5: `plannedStartDate` date input이 생성/수정 모드 모두에서 렌더링된다
- [ ] C004-6: 유효한 값으로 제출하면 `onSubmit`이 입력된 데이터와 함께 호출된다
- [ ] C004-7: `isLoading=true`면 제출 버튼이 비활성화되고 스피너가 표시된다
- [ ] 검증은 `src/shared/validations/ticket.ts`의 Zod 스키마를 그대로 사용한다 (COMPONENT_SPEC §2.8 "검증 스키마는 공유한다" — 별도 규칙 재정의 금지)
- [ ] Enter 키 입력으로도 제출된다

---

### Phase 5 — TicketModal

#### 5.1 `src/client/components/TicketModal.tsx`

**의존성**: `ui/Modal`, `TicketDetailView`, `TicketForm`(mode="edit"), `ConfirmDialog`
**Props**: `ticket`, `isOpen`, `onClose`, `onUpdate`, `onDelete`
**참조 TC**: TC-COMP-005

**TDD 체크리스트**:
- [ ] C005-1: `isOpen`에 따라 표시/숨김 (`ui/Modal` 위임, 통합 레벨에서 재확인)
- [ ] C005-2: 시작일/종료일/상태/생성일이 읽기 전용으로 표시된다 (`TicketDetailView` 위임 확인)
- [ ] C005-3: 제목/설명/우선순위/시작예정일/종료예정일이 편집 가능하다 (`TicketForm` 위임 확인)
- [ ] C005-4: ESC 키로 `onClose`가 호출된다 (`ui/Modal` 위임)
- [ ] C005-5: 오버레이 클릭으로 `onClose`가 호출된다 (`ui/Modal` 위임)
- [ ] C005-6: 삭제 버튼 → `ConfirmDialog` 표시 → 확인 → `onDelete(ticket.id)` 호출
- [ ] `TicketForm`에서 유효한 데이터로 제출하면 `onUpdate(ticket.id, data)`가 호출된다

---

### Phase 6 — Board

#### 6.1 `src/client/components/Board.tsx`

**의존성**: `Column` × 4 (BACKLOG는 사이드바 슬롯, 나머지 3개는 메인 그리드), `@dnd-kit/core`(`DndContext`, `DragOverlay`)
**Props**: `board: BoardData`, `onTicketClick`, DnD 이벤트 핸들러(`onDragStart`/`onDragOver`/`onDragEnd` — BoardContainer에서 주입)
**참조 TC**: TC-COMP-003

**TDD 체크리스트**:
- [ ] C003-1: BACKLOG, TODO, IN_PROGRESS, DONE 순서로 4개 칼럼이 렌더링된다
- [ ] C003-2: BACKLOG가 `board-sidebar` 영역에, 나머지 3개가 `board-main` 영역에 배치된다
- [ ] C003-3: 뷰포트에 따라 레이아웃 클래스가 달라진다 (`lg:` 기준 사이드바+3칼럼, 그 미만은 세로 스택 — `globals.css` `.board-content`/`.columns-container` 클래스 존재 여부로 검증)
- [ ] `DndContext`가 전체 보드를 감싸고, 드래그 시작 시 `onDragStart`가 호출된다
- [ ] 드래그 중 `DragOverlay`에 활성 티켓의 카드가 복제 렌더링된다
- [ ] 각 칼럼에 올바른 `tickets` prop이 전달된다 (칼럼별 데이터 분리 확인)

---

### Phase 7 — useTickets Hook

#### 7.1 `src/client/hooks/useTickets.ts`

**의존성**: `ticketApi.ts`, `src/shared/types/ticket.ts`
**인터페이스**: COMPONENT_SPEC.md §4 그대로 (`board`, `isLoading`, `error`, `create/update/remove/reorder/complete`)
**테스트 방법**: `@testing-library/react`의 `renderHook` 사용, `ticketApi` 모듈 전체를 `jest.mock`

**TDD 체크리스트**:
- [ ] 초기 `board`는 `initialData`와 동일하다
- [ ] `create(data)`: `ticketApi.createTicket` 호출 후 성공하면 응답 티켓이 `board.BACKLOG` 맨 앞에 추가된다
- [ ] `update(id, data)`: 성공하면 해당 티켓이 속한 칼럼에서 항목이 갱신된다
- [ ] `remove(id)`: 성공하면 board에서 해당 티켓이 제거된다
- [ ] `complete(id)`: 성공하면 해당 티켓이 DONE 칼럼으로 이동한다
- [ ] `reorder(ticketId, status, position)`: 성공하면 응답의 `ticket`+`affected`를 반영해 board가 갱신된다
- [ ] **낙관적 업데이트**: 각 액션 호출 즉시(응답 오기 전) `board` 상태가 먼저 바뀐다
- [ ] **롤백**: API가 실패(reject)하면 호출 직전 상태로 `board`가 복원되고 `error`가 설정된다 (NFR-004)
- [ ] 진행 중에는 `isLoading=true`, 완료 후 `false`로 돌아온다
- [ ] 컴포넌트는 이 Hook을 통해서만 상태를 바꾸며, `ticketApi`를 직접 호출하지 않는다 (설계 제약이라 별도 런타임 테스트는 없음 — 코드 리뷰 체크 항목)

---

### Phase 8 — BoardContainer

#### 8.1 `src/client/components/BoardContainer.tsx`

**의존성**: `BoardHeader`, `FilterBar`, `Board`, `ui/Modal`+`TicketForm`(생성용), `TicketModal`, `useTickets`, `board-filters`
**Props**: `initialData: BoardData`
**참조**: COMPONENT_SPEC.md §2.1, §5(이벤트 흐름), US-001~US-008 전체

**TDD 체크리스트**:
- [ ] "새 업무" 클릭 → 생성 모달이 열린다 (`isCreating=true`)
- [ ] 생성 폼 제출 → `useTickets.create` 호출 → 성공 시 모달이 닫힌다 (US-001)
- [ ] 카드 클릭 → `selectedTicket`이 설정되고 `TicketModal`이 열린다
- [ ] `TicketModal`에서 수정 제출 → `useTickets.update` 호출
- [ ] `TicketModal`에서 삭제 확인 → `useTickets.remove` 호출 → 모달이 닫힌다
- [ ] 드래그 종료 시 대상이 DONE 칼럼이면 `useTickets.complete`가 호출된다 (reorder가 아님 — API_SPEC.md §7 주의사항)
- [ ] 드래그 종료 시 대상이 DONE이 아니면 `useTickets.reorder`가 호출된다
- [ ] 필터 버튼 클릭 시 `Board`에 전달되는 `board` prop이 `board-filters.filterBoard` 결과로 바뀐다 (API 재호출 없음 — §2.3-4)
- [ ] `FilterBar`의 `counts`가 `board-filters.countForFilters(board)` 결과와 일치한다

---

### Phase 9 — 서버 진입점

#### 9.1 `app/page.tsx`

**역할**: 서버 컴포넌트(async). `ticket.service.getBoard()`를 직접 호출해 초기 데이터를 만들고 `BoardContainer`에 전달한다. **API 라운드트립 없이** 서버에서 직접 서비스 레이어를 호출한다 (Next.js Server Component 관례).
**의존성**: `src/server/services/ticket.service.ts`(`getBoard`), `BoardContainer`

**TDD 체크리스트**:
- [ ] `getBoard()`가 반환한 데이터를 `BoardContainer`의 `initialData`로 그대로 전달한다
- [ ] 컴포넌트 트리 안에서 직접 `fetch('/api/tickets')`를 호출하지 않는다 (서버 컴포넌트는 서비스 레이어 직접 호출 — Route Handler는 클라이언트 상호작용용)

> 서버 컴포넌트 테스트는 Jest보다 수동/통합 검증(quickstart 방식)이 실용적이다. `getBoard()` 자체는 이미 `ticket.service.test.ts`에서 검증되어 있으므로, 여기서는 "prop 전달이 올바른가"만 가벼운 렌더 테스트로 확인한다.

---

### Phase 10 — 통합 검증 (새 컴포넌트 없음)

`BoardContainer` + `Board` + `useTickets`를 실제로 엮은 상태에서 검증한다. 이 단계는 새 프로덕션 코드를 만들지 않고, 이미 만든 조각들의 배선(wiring)만 확인한다.

**참조 TC**: TC-INT-001, TC-INT-002

**체크리스트**:
- [ ] I001-1: BACKLOG→TODO 드래그 → `reorder` API 호출, UI 즉시 반영, `startedAt` 자동 설정
- [ ] I001-2: IN_PROGRESS→Done 드래그 → `complete` API 호출(reorder 아님), `completedAt` 자동 설정
- [ ] I001-3: 같은 칼럼 내 순서 변경 → `reorder` API 호출, position 재계산
- [ ] I001-4: 드래그 후 API 에러 → 원래 위치로 롤백 + 에러 표시
- [ ] I002-1: Done 이동 후 Done 칼럼에 표시, `completedAt` 설정
- [ ] I002-2: Done에서 수동 삭제 → 확인 다이얼로그 → DELETE API → 보드에서 제거
- [ ] I002-3: 24시간 경과 후 재조회 시 Done 칼럼에서 제외 (서버가 이미 필터링 — 프런트는 서버 응답을 그대로 반영하는지만 확인)

> dnd-kit의 실제 마우스 드래그는 jsdom에서 재현하기 어렵다. `DndContext`의 `onDragEnd` 핸들러를 직접 호출(`fireEvent` 대신 핸들러 함수를 꺼내 실행)하는 방식으로 검증하는 것을 권장한다.

---

## 4. 컴포넌트 ↔ 테스트 케이스 매핑

| 컴포넌트 | TC ID (docs/TEST_CASES.md) | 이 문서에서 신규 정의 |
|---|---|---|
| TicketCard | TC-COMP-001 | 접근성, dragging 스타일 |
| Column | TC-COMP-002 | SortableContext items, data-status |
| Board | TC-COMP-003 | DndContext/DragOverlay 배선 |
| TicketForm | TC-COMP-004 | Zod 스키마 재사용 검증 |
| TicketModal | TC-COMP-005 | (전량 TC로 커버) |
| ConfirmDialog | TC-COMP-006 | danger variant |
| BoardContainer + Board + useTickets | TC-INT-001, TC-INT-002 | — |
| ticketApi, board-filters, Badge, Button, Modal, ColumnHeader, FilterBar, BoardHeader, TicketDetailView, useTickets, page.tsx | 없음 | 전량 이 문서에서 신규 정의 |

---

## 5. 완료 기준 (Definition of Done)

Phase 전체가 끝났다고 보려면:

- [ ] 위 체크리스트의 모든 항목이 테스트로 존재하고 통과한다 (`npm test`)
- [ ] `npm run type-check` 통과 (strict 모드, `any` 없음 — constitution II)
- [ ] 모든 컴포넌트가 `docs/COMPONENT_SPEC.md`에 정의된 Props 시그니처를 그대로 따른다
- [ ] 컴포넌트에서 직접 `fetch`를 호출하는 곳이 없다 (`ticketApi.ts` 경유 확인 — grep으로 점검 가능)
- [ ] `npm run dev`로 실제 브라우저에서 REQUIREMENTS.md NFR-002 반응형 기준(360/768/1024) 육안 확인
- [ ] `docs/API_SPEC.md`의 7개 엔드포인트가 실제 드래그/생성/수정/삭제 흐름에서 문서와 다르게 동작하지 않는다
