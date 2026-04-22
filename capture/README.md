# Capture Folder Guide

`capture` 폴더는 **화면 영역 반복 캡쳐 + 반복 클릭** 기능을 제공하는 Windows용 Python GUI 도구를 포함합니다.

## 폴더 구조

```text
capture/
├─ screen_capture_interval.py
├─ requirements.txt
├─ run_capture_python.bat
├─ build_exe_windows.bat
├─ ScreenCaptureInterval.spec
├─ README_ko.md
└─ build_pyinstaller/
   └─ ScreenCaptureInterval/
      ├─ Analysis-00.toc
      ├─ EXE-00.toc
      ├─ PKG-00.toc
      ├─ PYZ-00.toc
      ├─ warn-ScreenCaptureInterval.txt
      └─ xref-ScreenCaptureInterval.html
```

## 주요 파일 설명

- `screen_capture_interval.py`
  - 메인 소스 코드입니다.
  - 주요 기능:
    - 드래그로 화면 영역 선택
    - 선택 영역을 지정한 간격으로 PNG 저장
    - 지정 좌표 자동 반복 클릭
    - GUI 로그 출력 및 스레드 기반 작업 제어
- `requirements.txt`
  - 실행에 필요한 Python 패키지 목록입니다.
  - 현재: `pyautogui`, `Pillow`
- `run_capture_python.bat`
  - Python 스크립트를 바로 실행하는 배치 파일입니다.
  - 내부에서 `pythonw`로 `screen_capture_interval.py`를 실행합니다.
- `build_exe_windows.bat`
  - PyInstaller로 단일 EXE를 빌드하는 배치 파일입니다.
  - 산출물은 `dist/ScreenCaptureInterval.exe`
- `ScreenCaptureInterval.spec`
  - PyInstaller 빌드 설정 파일입니다.
- `build_pyinstaller/`
  - PyInstaller 빌드 중 생성되는 중간 결과물 폴더입니다.
- `README_ko.md`
  - 기존 한국어 사용 설명 문서입니다.

## 실행 방법

1. 의존성 설치

```bat
python -m pip install -r requirements.txt
```

2. Python으로 실행

```bat
run_capture_python.bat
```

3. EXE 빌드(선택)

```bat
build_exe_windows.bat
```

## 동작 개요

1. GUI에서 캡쳐 영역 선택
2. 캡쳐 간격/저장 폴더/파일명 Prefix/캡쳐 횟수 설정
3. 캡쳐 시작/중지
4. 클릭 포인트 설정 후 반복 클릭 시작/중지

## 참고

- `capture` 폴더는 캡쳐 이미지 기본 저장 경로로도 사용될 수 있습니다(설정에서 변경 가능).
- 고해상도 배율 환경에서는 영역 선택과 실제 캡쳐 좌표가 약간 다를 수 있습니다.
