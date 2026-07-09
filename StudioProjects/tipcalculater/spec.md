# tipcalculater — 프로젝트 명세서

## 1. 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | 팁 계산기 |
| **패키지명** | `tipcalculater` |
| **프레임워크** | Flutter (Dart SDK ^3.12.0) |
| **버전** | 1.0.0+1 |
| **지원 플랫폼** | Android (iOS / Web 미구성) |
| **외부 의존성** | `cupertino_icons` (기본 Flutter SDK 외 거의 없음) |

사용자가 **청구 금액**과 **팁 비율(%)**을 입력하면, 팁 금액과 총합을 **실시간**으로 계산·표시하는 단일 화면 모바일 앱이다.

---

## 2. 목표 및 범위

### 2.1 목표

- 식당·카페 등에서 청구 금액에 대한 팁을 빠르게 계산한다.
- 입력값 변경 시 즉시 결과를 갱신하여 별도의 "계산" 버튼 없이 사용할 수 있게 한다.
- 계산 로직과 UI를 분리하여 테스트와 유지보수가 쉬운 구조를 유지한다.

### 2.2 현재 범위 (In Scope)

- 청구 금액 입력
- 팁 비율(%) 직접 입력 및 프리셋 선택 (10%, 15%, 18%, 20%)
- 팁 금액·총합 실시간 표시
- 금액 천 단위 쉼표 포맷

### 2.3 범위 외 (Out of Scope — 미구현)

- 인원 수 나누기 (1인당 금액)
- 다국어 / 다통화 지원 (현재 한국어 UI, 원화 표기)
- 입력 오류에 대한 사용자 피드백 (음수, 비정상 값 등)
- iOS / Web 빌드 설정
- 상태 관리 라이브러리 (Provider, Riverpod 등)

---

## 3. 디렉터리 구조

```
tipcalculater/
├── lib/
│   ├── main.dart                         # 앱 진입점, 테마 설정
│   ├── screens/
│   │   └── tip_calculator_screen.dart    # 메인 UI (입력 + 결과)
│   └── utils/
│       └── tip_calculator.dart           # 계산 로직, 포맷팅
├── test/
│   ├── tip_calculator_test.dart          # 단위 테스트
│   └── widget_test.dart                  # 위젯 테스트
├── android/                              # Android 네이티브 설정
├── pubspec.yaml
└── spec.md                               # 본 명세서
```

| 레이어 | 역할 |
|--------|------|
| `main.dart` | `MaterialApp` 설정, 테마, 홈 화면 라우팅 |
| `screens/` | 사용자 입력 및 결과 표시 UI |
| `utils/` | 순수 계산·파싱·포맷 로직 (UI 비의존) |
| `test/` | 단위·위젯 테스트 |

---

## 4. 아키텍처

### 4.1 패턴

- **단일 화면 StatefulWidget** + `setState` 기반 로컬 상태 관리
- **관심사 분리**: UI(`screens/`) ↔ 비즈니스 로직(`utils/`)

### 4.2 데이터 흐름

```
사용자 입력
    ↓
TextEditingController
    ↓
listener → setState()
    ↓
_result getter
    ↓
TipCalculator.parseAmount()  →  TipCalculator.calculate()
    ↓
TipResult
    ↓
formatCurrency()
    ↓
결과 카드 UI 갱신
```

### 4.3 주요 클래스

| 클래스 / 함수 | 파일 | 설명 |
|---------------|------|------|
| `TipCalculatorApp` | `main.dart` | 앱 루트 위젯 |
| `TipCalculatorScreen` | `tip_calculator_screen.dart` | 메인 화면 (StatefulWidget) |
| `_InputSection` | `tip_calculator_screen.dart` | 숫자 입력 필드 위젯 |
| `_ResultRow` | `tip_calculator_screen.dart` | 결과 한 줄 표시 위젯 |
| `TipResult` | `tip_calculator.dart` | 계산 결과 데이터 클래스 |
| `TipCalculator` | `tip_calculator.dart` | 계산·파싱 static 메서드 |
| `formatCurrency()` | `tip_calculator.dart` | 금액 표시 포맷 함수 |

---

## 5. 기능 명세

### 5.1 청구 금액 입력

- **라벨**: 청구 금액
- **힌트**: `예: 50000`
- **단위**: 원
- **키보드**: 숫자 + 소수점
- **입력 제한**: 숫자, 소수점(`.`), 쉼표(`,`)만 허용 (`FilteringTextInputFormatter`)
- **파싱**: 쉼표 제거 후 `double` 변환, 빈 값·잘못된 값 → `0`

### 5.2 팁 비율 입력

- **라벨**: 팁 비율
- **기본값**: `15` (%)
- **힌트**: `예: 15`
- **단위**: %
- **프리셋**: 10%, 15%, 18%, 20% (`ChoiceChip`)
- **선택 상태**: 현재 입력값과 프리셋 값이 일치하면 chip이 selected

### 5.3 계산 로직

```
팁 금액   = 청구 금액 × (팁 비율 ÷ 100)
총합     = 청구 금액 + 팁 금액
```

| 입력 | 출력 필드 |
|------|-----------|
| `billAmount` | `TipResult.billAmount` |
| `tipRate` | `TipResult.tipRate` |
| (계산) | `TipResult.tipAmount` |
| (계산) | `TipResult.totalAmount` |

### 5.4 결과 표시

결과는 `Card` 위젯 안에 다음 항목을 표시한다.

| 항목 | 예시 |
|------|------|
| 청구 금액 | `50,000원` |
| 팁 (비율%) | `7,500원` (15% 기준) |
| 총합 | `57,500원` (강조 스타일) |

### 5.5 금액 포맷 (`formatCurrency`)

- 정수: 천 단위 쉼표 (`50,000`)
- 소수: 둘째 자리까지 + 쉼표 (`12,345.67`)
- 소수점이 없으면 정수 형태로 표시


# 5.6 팁 계산 (다중 통화 지원)

## 통화 선택

### DropdownButton 위젯

사용자는 팁 계산 시 사용할 통화를 선택할 수 있다.

| 항목    | 내용                      |
| ----- | ----------------------- |
| 위젯    | DropdownButton          |
| 기본값   | USD                     |
| 선택지   | USD, EUR, JPY, AUD, CAD |
| 표시 방식 | 통화 코드 또는 통화 기호          |

---

## 청구 금액 입력

| 항목     | 내용             |
| ------ | -------------- |
| 라벨     | 청구 금액          |
| 위젯     | TextField      |
| 플레이스홀더 | 청구 금액을 입력      |
| 키보드 타입 | 소수점 입력 허용      |
| 입력 형식  | 숫자 및 소수점 입력 가능 |

---

## 팁 비율 설정

### 슬라이더

사용자는 슬라이더를 이용하여 팁 비율을 선택할 수 있다.

| 항목    | 내용     |
| ----- | ------ |
| 위젯    | Slider |
| 최소값   | 10%    |
| 최대값   | 30%    |
| 표시 단위 | %      |

---

## 팁 비율 표시

| 항목    | 내용        |
| ----- | --------- |
| 라벨    | 팁 비율      |
| 값     | 슬라이더 선택 값 |
| 표시 형식 | 정수(%)     |

---

## 설정된 팁 비율 표시

| 항목    | 내용          |
| ----- | ----------- |
| 라벨    | 설정된 팁 비율    |
| 값     | 현재 적용된 팁 비율 |
| 표시 형식 | 소수 둘째 자리까지  |

---

## 팁 금액 표시

| 항목    | 내용           |
| ----- | ------------ |
| 라벨    | 팁 금액         |
| 값     | 계산된 팁 금액     |
| 표시 형식 | 소수 둘째 자리까지   |
| 통화 표시 | 선택된 통화 단위 적용 |

계산식:

```text
팁 금액 = 청구 금액 × (팁 비율 ÷ 100)
```

---

## 총 금액 표시

| 항목    | 내용           |
| ----- | ------------ |
| 라벨    | 총 금액         |
| 값     | 계산된 총 금액     |
| 표시 형식 | 소수 둘째 자리까지   |
| 통화 표시 | 선택된 통화 단위 적용 |

계산식:

```text
총 금액 = 청구 금액 + 팁 금액
```

---

## 6. UI / UX 명세

### 6.1 테마

- **Material 3** (`useMaterial3: true`)
- **시드 색상**: `Colors.teal`
- **디버그 배너**: 비표시

### 6.2 레이아웃

- `Scaffold` → `AppBar` (제목: 팁 계산기, 가운데 정렬)
- `SafeArea` + `SingleChildScrollView` (작은 화면 대응)
- 패딩: 20px
- 입력 섹션 → 프리셋 → 결과 카드 순서

### 6.3 상호작용

- 입력 필드 변경 시 **즉시** 결과 갱신 (별도 계산 버튼 없음)
- 프리셋 chip 탭 시 팁 비율 필드 값 변경


---

# 6.4 UI 레이아웃 변경

기존 입력 영역은 아래 순서로 구성한다.

1. 통화 선택 (DropdownButton)
2. 청구 금액 입력 (TextField)
3. 팁 비율 슬라이더 (10% ~ 30%)
4. 팁 비율 표시
5. 설정된 팁 비율 표시
6. 팁 금액 표시
7. 총 금액 표시

모든 계산 결과는 입력값 변경 시 실시간으로 갱신된다.

---

## 7. 테스트 명세

### 7.1 단위 테스트 (`test/tip_calculator_test.dart`)

| 테스트 | 기대 결과 |
|--------|-----------|
| 10,000원 × 15% | 팁 1,500 / 총합 11,500 |
| 청구 0원 | 팁 0 / 총합 0 |
| `parseAmount('50000')` | 50000 |
| `parseAmount('12,345.67')` | 12345.67 |
| `parseAmount('')`, `parseAmount('abc')` | 0 |
| `formatCurrency(50000)` | `50,000` |
| `formatCurrency(12345.67)` | `12,345.67` |

### 7.2 위젯 테스트 (`test/widget_test.dart`)

| 시나리오 | 기대 결과 |
|----------|-----------|
| 10,000원 입력 (기본 팁 15%) | `1,500원`, `11,500원` 텍스트 표시 |

### 7.3 테스트 실행

```bash
cd StudioProjects/tipcalculater
flutter test
```

---

## 8. 빌드 및 실행

```bash
cd StudioProjects/tipcalculater
flutter pub get
flutter run
```

- Android 에뮬레이터 또는 실기기 필요
- `flutter build apk` 로 Android APK 빌드 가능

---

## 9. 코드 품질 및 설계 원칙

### 9.1 적용된 원칙

- UI와 계산 로직 분리
- 한국어 주석으로 초보자도 이해 가능하도록 작성
- `TextEditingController` `dispose()` 처리
- 테스트 가능한 static API (`TipCalculator`, `formatCurrency`)
- Material 3 컴포넌트 활용

### 9.2 알려진 제한사항

| 항목 | 설명 |
|------|------|
| README | Flutter 기본 템플릿 상태 (앱 전용 설명 미작성) |
| 패키지명 | `tipcalculater` — `calculator` 철자와 불일치 가능 |
| 입력 검증 UX | 잘못된 입력 시 0으로 처리만 하고 안내 메시지 없음 |
| 플랫폼 | Android만 구성 |

---

## 10. 향후 확장 제안

우선순위는 참고용이며, 현재 명세 범위에는 포함되지 않는다.

1. **인원 나누기** — 총합을 인원 수로 나눈 1인당 금액 표시
2. **입력 유효성 피드백** — 음수·과도한 값에 대한 에러/경고 UI
3. **로케일 지원** — 통화 기호·언어 분리 (`intl` 패키지)
4. **iOS 지원** — `flutter create` 로 iOS 타겟 추가
5. **README 정리** — 실행 방법, 스크린샷, 기능 설명

---

## 11. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-05-24 | 1.0 | 초기 명세서 작성 (코드베이스 분석 기반) |
