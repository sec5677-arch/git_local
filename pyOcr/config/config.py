"""
OCR 프로그램 기본 설정
경로, Tesseract, 지원 확장자 등 고정 값을 정의합니다.
"""

import json
import shutil
import sys
from pathlib import Path

# OCR 언어 선택 목록 (표시명 → Tesseract 언어 코드)
LANGUAGE_OPTIONS: dict[str, str] = {
    "한국어": "kor",
    "영어": "eng",
    "한국어+영어": "kor+eng",
    "일본어": "jpn",
    "중국어": "chi_sim",
}

# 지원하는 이미지 확장자
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}

# 통합 저장 시 기본 파일명
OUTPUT_FILE = "result.txt"

# Tesseract 기본 설치 경로
_DEFAULT_TESSERACT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def get_base_dir() -> Path:
    """
    프로그램 기준 폴더를 반환합니다.
    exe 실행 시 exe 위치, Python 실행 시 프로젝트 루트를 사용합니다.
    """
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent


def find_tesseract() -> str:
    """기본 경로 또는 PATH에서 Tesseract 실행 파일을 찾습니다."""
    default = Path(_DEFAULT_TESSERACT)
    if default.exists():
        return str(default)

    found = shutil.which("tesseract")
    if found:
        return found

    return str(default)


BASE_DIR = get_base_dir()
CONFIG_DIR = BASE_DIR / "config"
SETTINGS_PATH = CONFIG_DIR / "settings.json"
OUTPUT_DIR = BASE_DIR / "output"
RESOURCES_DIR = BASE_DIR / "resources"
TESSERACT_PATH = find_tesseract()


def default_settings() -> dict:
    """settings.json 기본값"""
    return {
        "input_dir": "",
        "output_dir": str(OUTPUT_DIR),
        "language": "kor+eng",
        "merge_text": True,
        "recursive": False,
        "preprocess": True,
    }


def load_settings() -> dict:
    """settings.json 파일을 읽어 설정을 반환합니다."""
    settings = default_settings()

    if SETTINGS_PATH.exists():
        try:
            with SETTINGS_PATH.open(encoding="utf-8") as f:
                loaded = json.load(f)
            settings.update(loaded)
        except (json.JSONDecodeError, OSError):
            pass

    return settings


def save_settings(settings: dict) -> None:
    """현재 설정을 settings.json에 저장합니다."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with SETTINGS_PATH.open("w", encoding="utf-8") as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)
