@echo off
setlocal

REM 이 배치는 파이썬으로 스크립트를 실행합니다.
REM (사전에 requirements.txt 설치가 필요합니다.)

set SCRIPT=screen_capture_interval.py

REM 파이썬이 PATH에 있어야 합니다.
pythonw "%~dp0%SCRIPT%"

endlocal

