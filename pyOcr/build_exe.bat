@echo off
REM GUI 이미지 OCR 프로그램 exe 빌드 스크립트
cd /d "%~dp0"

echo [1/3] 의존성 설치...
pip install -r requirements.txt

echo [2/3] PyInstaller로 exe 빌드...
pyinstaller --noconfirm --onefile --windowed ^
  --name pyOcr ^
  --paths . ^
  --hidden-import=PIL ^
  --hidden-import=PIL.Image ^
  --hidden-import=PIL.ImageTk ^
  --hidden-import=pytesseract ^
  --add-data "config\settings.json;config" ^
  main.py

echo [3/3] 완료!
echo.
echo 실행 파일: dist\pyOcr.exe
echo.
echo 사용 방법:
echo   1. dist\pyOcr.exe 실행
echo   2. GUI에서 입력/출력 폴더 선택 후 [시작] 클릭
echo   3. Tesseract OCR이 설치되어 있어야 합니다
echo.
pause
