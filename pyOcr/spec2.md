# GUI 기반 이미지 OCR 일괄 처리 프로그램 설계서

## 1. 프로젝트 개요

### 목적

사용자가 GUI 화면에서 이미지 폴더를 선택하면 프로그램이 이미지들을 순서대로 OCR 처리하여 텍스트를 추출하고, 결과를 TXT 파일로 저장하는 데스크톱 애플리케이션을 개발한다.

### 주요 기능

* GUI 기반 사용자 인터페이스
* 이미지 폴더 선택
* OCR 언어 선택
* 진행률 표시
* 실시간 로그 출력
* OCR 결과 미리보기
* TXT 파일 저장
* 개별 저장 / 통합 저장 선택
* 작업 중지 기능
* 설정 저장 기능

---

## 2. 개발 환경

### 언어

* Python 3.11 이상

### GUI

* Tkinter
* ttk

### OCR

* pytesseract

### 이미지 처리

* Pillow (PIL)

### 파일 처리

* os
* pathlib
* glob

### 멀티스레드

* threading
* queue

### 로그

* logging

### 외부 프로그램

* Tesseract OCR 설치 필요

---

## 3. 디렉터리 구조

```text
project/
│
├── main.py
├── gui/
│   ├── main_window.py
│   ├── settings_dialog.py
│   └── preview_panel.py
│
├── core/
│   ├── ocr_processor.py
│   ├── file_manager.py
│   ├── worker.py
│   └── logger_manager.py
│
├── config/
│   ├── config.py
│   └── settings.json
│
├── output/
│   ├── result.txt
│   └── logs/
│
└── resources/
```

---

## 4. 화면 설계

### 메인 화면

```text
┌─────────────────────────────────────┐
│ 이미지 OCR 일괄 처리 프로그램        │
├─────────────────────────────────────┤
│ 입력 폴더                           │
│ [경로 표시] [찾아보기]              │
├─────────────────────────────────────┤
│ 출력 폴더                           │
│ [경로 표시] [찾아보기]              │
├─────────────────────────────────────┤
│ OCR 언어                            │
│ [한국어+영어 ▼]                     │
├─────────────────────────────────────┤
│ 저장 방식                           │
│ ○ 통합 저장                         │
│ ○ 개별 저장                         │
├─────────────────────────────────────┤
│ 옵션                                │
│ □ 하위 폴더 포함                    │
│ □ 이미지 전처리 적용                │
├─────────────────────────────────────┤
│ 진행 상태                           │
│ [███████------] 65%                 │
├─────────────────────────────────────┤
│ 현재 처리 파일                      │
│ image025.jpg                        │
├─────────────────────────────────────┤
│ [시작] [중지] [결과 열기]           │
├─────────────────────────────────────┤
│ 로그 창                             │
└─────────────────────────────────────┘
```

---

## 5. 프로그램 흐름

```text
프로그램 시작
      │
      ▼
GUI 생성
      │
      ▼
입력 폴더 선택
      │
      ▼
출력 폴더 선택
      │
      ▼
OCR 시작
      │
      ▼
Worker Thread 생성
      │
      ▼
이미지 목록 조회
      │
      ▼
OCR 처리
      │
      ▼
진행률 업데이트
      │
      ▼
결과 저장
      │
      ▼
완료
```

---

## 6. 주요 기능

### 6.1 입력 폴더 선택

```python
from tkinter import filedialog

folder = filedialog.askdirectory()
```

### 6.2 출력 폴더 선택

```python
output_dir = filedialog.askdirectory()
```

### 6.3 OCR 언어 선택

지원 언어

| 표시명    | 값       |
| ------ | ------- |
| 한국어    | kor     |
| 영어     | eng     |
| 한국어+영어 | kor+eng |
| 일본어    | jpn     |
| 중국어    | chi_sim |

---

### 6.4 저장 방식

#### 통합 저장

```text
result.txt
```

```text
===== image001.jpg =====
텍스트 내용

===== image002.jpg =====
텍스트 내용
```

#### 개별 저장

```text
image001.txt
image002.txt
image003.txt
```

---

### 6.5 진행률 표시

```python
ttk.Progressbar
```

예시

```text
0%
25%
50%
75%
100%
```

---

### 6.6 실시간 로그 출력

예시

```text
[17:10:01] OCR 시작
[17:10:03] image001.jpg 완료
[17:10:05] image002.jpg 완료
```

---

### 6.7 작업 중지

사용자가 중지 버튼 클릭 시

```python
self.stop_requested = True
```

현재 작업 완료 후 종료

---

### 6.8 결과 열기

```python
os.startfile(output_path)
```

---

## 7. 이미지 미리보기

### 기능

* 현재 처리 이미지 표시
* 선택 이미지 확대 보기

### 라이브러리

```python
from PIL import ImageTk
```

### UI

```text
┌──────────────┐
│ image001.jpg │
│              │
│   Preview    │
│              │
└──────────────┘
```

---

## 8. OCR 결과 미리보기

### 기능

OCR 완료 후 결과 표시

```text
안녕하세요.
OCR 테스트 문서입니다.
```

### UI

```text
┌────────────────────────┐
│ OCR 결과                │
├────────────────────────┤
│ 안녕하세요.             │
│ OCR 테스트입니다.       │
└────────────────────────┘
```

---

## 9. 클래스 설계

### OCRApp

```python
class OCRApp:
    def create_ui()
    def start_ocr()
    def stop_ocr()
    def update_progress()
    def update_log()
```

### OCRWorker

```python
class OCRWorker(Thread):
    def run()
```

### OCRProcessor

```python
class OCRProcessor:
    def preprocess_image()
    def extract_text()
```

### FileManager

```python
class FileManager:
    def get_image_list()
    def save_text()
```

### LoggerManager

```python
class LoggerManager:
    def setup_logger()
```

---

## 10. 멀티스레드 구조

```text
GUI Thread
    │
    ├─ 화면 업데이트
    ├─ 버튼 이벤트
    └─ 진행률 표시

Worker Thread
    │
    ├─ 이미지 읽기
    ├─ OCR 수행
    ├─ 결과 저장
    └─ 로그 전송
```

---

## 11. 설정 저장

### settings.json

```json
{
  "input_dir": "",
  "output_dir": "",
  "language": "kor+eng",
  "merge_text": true,
  "recursive": false,
  "preprocess": true
}
```

---

## 12. 이미지 전처리

### 기능

* 흑백 변환
* 노이즈 제거
* 대비 향상
* 리사이징

### 예시

```python
image = image.convert("L")
```

---

## 13. 예외 처리

### 이미지 없음

```text
선택한 폴더에 이미지가 없습니다.
```

### OCR 실패

```text
OCR 처리 중 오류 발생
```

### 이미지 손상

```text
이미지를 열 수 없습니다.
```

### 저장 실패

```text
파일 저장 실패
```

---

## 14. 향후 확장 기능

### 드래그 앤 드롭

```text
이미지 폴더를 여기에 드롭하세요
```

### PDF 저장

OCR 결과 PDF 생성

### Excel 저장

xlsx 출력

### SQLite 저장

```sql
CREATE TABLE ocr_result (
    id INTEGER PRIMARY KEY,
    file_name TEXT,
    extracted_text TEXT,
    created_at DATETIME
);
```

### OCR 엔진 선택

* Tesseract
* EasyOCR
* PaddleOCR

### OCR 결과 검색

### OCR 결과 수정 후 저장

### 다크 모드 지원

### 다국어 UI 지원

---

## 15. 예상 실행 결과

```text
총 이미지 수 : 100

[1/100] image001.jpg 완료
[2/100] image002.jpg 완료
...
[100/100] image100.jpg 완료

OCR 작업 완료
결과 저장 : output/result.txt
```

### 완료 메시지

```text
OCR 처리가 완료되었습니다.
결과 파일을 열겠습니까?
```
