"""
로그 관리 모듈
파일에 처리 결과·오류를 기록합니다.
"""

import logging
from pathlib import Path


class LoggerManager:
    """로그 설정 및 관리를 담당하는 클래스"""

    def setup_logger(self, log_dir: Path) -> logging.Logger:
        """
        로거를 설정하고 반환합니다.
        log_dir: 로그 파일이 저장될 폴더 (예: output/logs)
        """
        log_dir.mkdir(parents=True, exist_ok=True)

        logger = logging.getLogger("pyOcr")
        logger.setLevel(logging.DEBUG)

        if logger.handlers:
            logger.handlers.clear()

        formatter = logging.Formatter(
            "[%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        file_handler = logging.FileHandler(
            log_dir / "ocr.log",
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        error_handler = logging.FileHandler(
            log_dir / "errors.log",
            encoding="utf-8",
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        logger.addHandler(error_handler)

        return logger
