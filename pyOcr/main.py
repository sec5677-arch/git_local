"""
GUI 기반 이미지 OCR 일괄 처리 프로그램
"""

import sys
import tkinter as tk
from pathlib import Path

from config import config
from gui.main_window import OCRApp


def ensure_directories() -> None:
    """프로그램 실행에 필요한 폴더를 생성합니다."""
    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (config.OUTPUT_DIR / "logs").mkdir(parents=True, exist_ok=True)
    config.RESOURCES_DIR.mkdir(parents=True, exist_ok=True)
    config.CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def main() -> int:
    """프로그램 진입점"""
    ensure_directories()

    # settings.json에 output_dir이 비어 있으면 기본값 저장
    settings = config.load_settings()
    if not settings.get("output_dir"):
        settings["output_dir"] = str(config.OUTPUT_DIR)
        config.save_settings(settings)

    root = tk.Tk()
    OCRApp(root)
    root.mainloop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
