Kanban Board UI Design System & Specification

본 문서 및 디자인 시스템 명세서는 Linear의 정교하고 현대적인 테크니컬 UI 감성과 Trello의 직관적이고 친근한 칸반 보드 UX를 결합하여 작성되었습니다. 제시된 와이어프레임의 구조(사이드바 백로그 영역 + 필터Bar + 메인 보드)를 완벽하게 지원합니다.

1. Design Overview & Principles

Information Hierarchy (정보 위계):

왼쪽 백로그/Inbox 레이아웃과 오른쪽 메인 보드(TODO, In Progress, Done) 간의 시각적 분리를 명확히 하여 작업의 '수집'과 '진행' 단계를 구분합니다.

High-Density & Clean Optics (Linear 스타일):

얇은 1px Border, 정교한 드롭 다운 섀도우, 명확한 타이포그래피 계층을 사용하여 밀도 높고 깔끔한 인터페이스를 유지합니다.

Fluidity & Color Accent (Trello 스타일):

보드 컬럼 및 카드태그, 중요도/만료일 컴포넌트에는 직관적이고 다채로운 세맨틱 컬러 시스템을 적용합니다.

2. Updated Color System (JSON)

제시된 컬러값을 보완하여 다크/라이트 모드 지원, 텍스트 대비비(WCAG AA 준수), 보드 및 카드 상태별 색상을 확장한 표준 JSON 명세입니다.

{
  "colorSystem": {
    "version": "1.0.0",
    "mode": "light",
    "semantic": {
      "primary": {
        "value": "#2563EB",
        "tailwind": "blue-600",
        "hover": "#1D4ED8",
        "light": "#EFF6FF"
      },
      "danger": {
        "value": "#DC2626",
        "tailwind": "red-600",
        "hover": "#B91C1C",
        "light": "#FEF2F2"
      },
      "success": {
        "value": "#16A34A",
        "tailwind": "green-600",
        "hover": "#15803D",
        "light": "#F0FDF4"
      },
      "warning": {
        "value": "#D97706",
        "tailwind": "amber-600",
        "hover": "#B45309",
        "light": "#FFFBEB"
      },
      "info": {
        "value": "#0284C7",
        "tailwind": "sky-600",
        "hover": "#0369A1",
        "light": "#F0F9FF"
      }
    },
    "background": {
      "app": "#F8FAFC",
      "sidebar": "#FFFFFF",
      "board": "#F1F5F9",
      "column": "rgba(241, 245, 249, 0.7)",
      "card": "#FFFFFF",
      "cardHover": "#F8FAFC",
      "overlay": "rgba(15, 23, 42, 0.5)"
    },
    "text": {
      "primary": "#0F172A",
      "secondary": "#475569",
      "tertiary": "#94A3B8",
      "disabled": "#CBD5E1",
      "inverse": "#FFFFFF"
    },
    "border": {
      "subtle": "#E2E8F0",
      "default": "#CBD5E1",
      "focused": "#2563EB",
      "danger": "#FCA5A5"
    },
    "boardStatus": {
      "todo": {
        "badgeBg": "#E0F2FE",
        "badgeText": "#0369A1"
      },
      "inProgress": {
        "badgeBg": "#FEF3C7",
        "badgeText": "#B45309"
      },
      "done": {
        "badgeBg": "#DCFCE7",
        "badgeText": "#15803D"
      }
    }
  }
}


3. Typography & Spacing System

3.1 Typography

Font Family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

Scale:

Display / Board Title: 20px / Line-height: 28px / Weight: 700 (Bold)

Section / Column Title: 14px / Line-height: 20px / Weight: 600 (Semi-bold) / Uppercase

Card Title: 14px / Line-height: 20px / Weight: 600 (Semi-bold)

Body / Description: 13px / Line-height: 18px / Weight: 400 (Regular)

Badge / Metadata: 11px / Line-height: 14px / Weight: 500 (Medium)

3.2 Spacing & Radius

Border Radius:

Small (Badges, Buttons): 4px (rounded)

Medium (Cards, Inputs): 8px (rounded-lg)

Large (Columns, Containers): 12px (rounded-xl)

Shadows:

Card: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)

Card Dragging: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)

4. UI Architecture & Components (Based on Wireframe)

+------------------------------------------------------------------------------------+
| Header: Logo / Title         | Search Bar                       [+ 새 업무] Button |
+------------------------------+-----------------------------------------------------+
| Left Sidebar (Backlog/Inbox) | Top Filter Bar: [이번주 업무] [일정이 초과된 업무]  |
| - Card 1 (Title/Desc/Badges) |-----------------------------------------------------|
| - Card 2 (Title/Desc/Badges) | TODO          | In Progress       | Done            |
|                              | - Card A      | - Card B          | - Card C        |
+------------------------------+---------------+-------------------+-----------------+


4.1 Global Header

Search Bar: 돋보기 아이콘(Search)과 함께 입력창 구성. Placeholders: "Search tasks..."

Primary CTA (+ 새 업무): Primary Color (#2563EB) 버튼. 클릭 시 새 Task 생성 모달 호출.

4.2 Left Sidebar (Backlog / Inbox)

너비: 280px ~ 320px 고정.

역할: 보드에 배치되지 않은 미할당/대기 업무 목록 표시.

구성 요소: 백로그 헤더, 작업 카드 리스트. 보드 카드로 Drag & Drop 가능.

4.3 Filter Bar (상단 필터)

Quick Filter 칩 버튼 제공:

이번주 업무: 기본 아웃라인 칩 (클릭 시 활성화 상태 표시).

일정이 초과된 업무: Warning/Danger 상태의 필터 칩 (경고 태그 시각화).

4.4 Kanban Columns & Cards

Columns (TODO / In Progress / Done):

헤더 영역: 컬럼명 + 아이템 개수 뱃지 + 추가 옵션 버튼(...).

Dropzone: 드래그 앤 드롭 지원 영역.

Task Card Component:

Title: 최대 2줄 제한 (line-clamp-2).

Description: 가벼운 세컨더리 컬러 서체 사용.

Footer Badges:

중요도 (Priority): High(Danger), Medium(Warning), Low(Info) 색상 코드 뱃지.

완료표기일 (Due Date): 초과 시 Danger 색상, 정상 시 Secondary/Success 색상 표출.

5. Interaction & Motion Guidelines

Hover State:

카드는 hover:border-slate-300 및 hover:shadow-md 반응을 주어 클릭/드래그 가능함을 암시합니다.

Drag & Drop:

드래그 중인 카드는 opacity: 0.8, scale: 1.02, shadow-xl 스타일을 적용합니다.

Target Column Hover 시 background color가 subtle하게 변화합니다 (bg-blue-50/50).

Accessibility:

모든 텍스트 및 배지의 색상 대비는 minimum 4.5:1 이상을 유지합니다.

키보드 탐색(Tab Index)을 지원하여 접근성을 보장합니다.