# 스크린 캡쳐 반복 저장 (GUI)

이 프로그램은 다음을 합니다.

- GUI에서 캡쳐할 영역을 드래그로 선택합니다.
- 선택한 영역만 `몇 초 간격`으로 반복해서 PNG로 저장합니다.
- 중지는 `GUI의 중지` 버튼입니다.

## 1) 실행 준비 (처음 1회)

1. `C:\Users\신동혁\.cursor\capture` 폴더를 엽니다.
2. `run_capture_python.bat`을 실행하기 전에, 아래 준비가 필요할 수 있습니다.

필요한 라이브러리 설치:

```bat
python -m pip install -r requirements.txt
```

## 2) 파이썬으로 바로 실행

```bat
run_capture_python.bat
```

실행하면 GUI 창이 뜨고, `영역 선택(드래그)` -> `시작` -> `중지` 순서로 사용합니다.

## 3) EXE(실행파일) 만들기

```bat
build_exe_windows.bat
```

빌드가 끝나면 `dist` 폴더에 `ScreenCaptureInterval.exe` 가 생성됩니다.

## 사용 중 주의

- 화면 확대/축소(배율)가 100%가 아니면 드래그한 영역과 캡쳐 영역이 약간 어긋날 수 있습니다.
- 드래그한 영역이 너무 작으면 다시 선택하라고 안내됩니다.

