# 이미지 OCR 일괄 처리 프로그램 설계서

## 1. 프로젝트 개요

### 목적

지정된 폴더 내의 이미지 파일을 순서대로 읽어 OCR(광학 문자 인식)을 수행하고, 추출된 텍스트를 하나의 텍스트 파일 또는 개별 텍스트 파일로 저장하는 프로그램을 개발한다.

### 주요 기능

* 특정 폴더 내 이미지 검색
* 파일명 기준 정렬 처리
* OCR 텍스트 추출
* 텍스트 파일 저장
* 처리 결과 로그 출력
* 오류 파일 기록

---

## 2. 개발 환경

### 언어

* Python 3.11 이상

### 라이브러리

#### OCR 엔진

* pytesseract

#### 이미지 처리

* Pillow (PIL)

#### 파일 처리

* os
* pathlib
* glob

#### 로그 관리

* logging

### 외부 프로그램

* Tesseract OCR 설치 필요

---

## 3. 디렉터리 구조

```text
project/
│
├── main.py
├── config.py
├── requirements.txt
│
├── input/
│   ├── image001.jpg
│   ├── image002.jpg
│   └── image003.jpg
│
├── output/
│   ├── result.txt
│   └── logs/
│
└── temp/
```

---

## 4. 프로그램 흐름

```text
프로그램 시작
      │
      ▼
설정 로드
      │
      ▼
입력 폴더 확인
      │
      ▼
이미지 목록 조회
      │
      ▼
파일명 기준 정렬
      │
      ▼
이미지 반복 처리
      │
      ▼
OCR 수행
      │
      ▼
텍스트 추출
      │
      ▼
결과 저장
      │
      ▼
다음 이미지
      │
      ▼
완료
```

---

## 5. 지원 이미지 형식

| 확장자  |
| ---- |
| jpg  |
| jpeg |
| png  |
| bmp  |
| tif  |
| tiff |
| webp |

---

## 6. 설정 정보

### config.py

```python
INPUT_DIR = "./input"
OUTPUT_DIR = "./output"

LANGUAGE = "kor+eng"

MERGE_TEXT = True

OUTPUT_FILE = "result.txt"

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

---

## 7. 기능 설계

### 7.1 이미지 검색

#### 입력

* 폴더 경로

#### 처리

* 지원 확장자 검색
* 목록 생성

#### 출력

```python
[
    image001.jpg,
    image002.jpg,
    image003.jpg
]
```

---

### 7.2 파일 정렬

#### 정렬 기준

* 파일명 오름차순

예시

```text
image001.jpg
image002.jpg
image003.jpg
```

---

### 7.3 OCR 처리

#### 입력

```python
PIL.Image
```

#### 처리

```python
pytesseract.image_to_string()
```

#### 출력

```python
"추출된 텍스트 내용"
```

---

### 7.4 텍스트 저장

#### 옵션 1

모든 결과를 하나의 파일에 저장

```text
===== image001.jpg =====
텍스트 내용

===== image002.jpg =====
텍스트 내용
```

#### 옵션 2

개별 저장

```text
output/
├── image001.txt
├── image002.txt
└── image003.txt
```

---

### 7.5 로그 저장

#### 로그 예시

```text
[INFO] image001.jpg OCR 완료
[INFO] image002.jpg OCR 완료
[ERROR] image003.jpg 처리 실패
```

---

## 8. 예외 처리

### 파일 없음

```text
입력 폴더에 이미지가 존재하지 않습니다.
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
출력 파일 저장 실패
```

---

## 9. 클래스 설계

### OCRProcessor

```python
class OCRProcessor:
    def load_image()
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

## 10. 성능 개선 계획

### 멀티스레드 처리

```python
concurrent.futures.ThreadPoolExecutor
```

### 멀티프로세스 처리

```python
multiprocessing
```

### 이미지 전처리

* 흑백 변환
* 노이즈 제거
* 대비 향상
* 리사이징

예시

```python
Image.convert("L")
```

---

## 11. 실행 방법

### 라이브러리 설치

```bash
pip install pillow
pip install pytesseract
```

### 프로그램 실행

```bash
python main.py
```

---

## 12. 향후 확장 기능

### GUI 지원

* Tkinter
* PyQt

### PDF 생성

* OCR 결과 PDF 저장

### Excel 저장

* xlsx 출력

### OCR 결과 검수

* 원본 이미지와 텍스트 비교

### 진행률 표시

```text
[#####-----] 50%
```

### 드래그 앤 드롭 지원

### 하위 폴더 재귀 검색

### OCR 언어 자동 감지

### 결과 CSV 저장

### OCR 결과 DB 저장

* SQLite
* MySQL
* PostgreSQL

---

## 13. 예상 결과 예시

### result.txt

```text
===== image001.jpg =====

안녕하세요.
OCR 테스트 문서입니다.

===== image002.jpg =====

두 번째 이미지 내용입니다.

===== image003.jpg =====

세 번째 이미지 내용입니다.
```

### 콘솔 출력

```text
총 이미지 수 : 3

[1/3] image001.jpg 완료
[2/3] image002.jpg 완료
[3/3] image003.jpg 완료

OCR 작업 완료
결과 저장 : output/result.txt
```
