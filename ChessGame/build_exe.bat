@echo off
REM Python Chess exe 빌드 스크립트
cd /d "%~dp0"

echo [1/3] 의존성 설치...
pip install -r requirements.txt

echo [2/3] PyInstaller로 exe 빌드...
pyinstaller --noconfirm --onefile --windowed ^
  --name ChessGame ^
  --paths . ^
  --hidden-import=pygame ^
  main.py

echo [3/3] 완료!
echo 실행 파일: dist\ChessGame.exe
pause
