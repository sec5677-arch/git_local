"""
OCR 작업 스레드
GUI를 멈추지 않도록 백그라운드에서 이미지 OCR을 수행합니다.
"""

import queue
import threading
from pathlib import Path

import pytesseract
from PIL import UnidentifiedImageError

from config import config
from core.file_manager import FileManager
from core.logger_manager import LoggerManager
from core.ocr_processor import OCRProcessor


class OCRWorker(threading.Thread):
    """백그라운드에서 OCR 작업을 수행하는 Worker 스레드"""

    def __init__(self, task: dict, message_queue: queue.Queue) -> None:
        super().__init__(daemon=True)
        self.task = task
        self.message_queue = message_queue
        self.stop_requested = False

    def _send(self, msg_type: str, *args) -> None:
        """GUI 스레드로 메시지를 전달합니다."""
        self.message_queue.put((msg_type, *args))

    def run(self) -> None:
        """OCR 작업을 순서대로 실행합니다."""
        input_dir = Path(self.task["input_dir"])
        output_dir = Path(self.task["output_dir"])
        merge = self.task["merge_text"]
        recursive = self.task["recursive"]
        preprocess = self.task["preprocess"]
        language = self.task["language"]

        log_dir = output_dir / "logs"
        logger = LoggerManager().setup_logger(log_dir)
        file_manager = FileManager()
        ocr = OCRProcessor(language=language, preprocess=preprocess)

        self._send("log", "OCR 시작")

        image_list = file_manager.get_image_list(input_dir, recursive=recursive)
        total = len(image_list)

        if total == 0:
            self._send("error", "선택한 폴더에 이미지가 없습니다.")
            return

        self._send("log", f"총 이미지 수 : {total}")
        results: list[tuple[str, str]] = []

        for index, image_path in enumerate(image_list, start=1):
            if self.stop_requested:
                self._send("log", "사용자에 의해 작업이 중지되었습니다.")
                break

            filename = image_path.name
            self._send("progress", index, total, filename)
            self._send("preview_image", str(image_path))

            try:
                image = ocr.load_image(image_path)
                text = ocr.extract_text(image)
                results.append((filename, text))

                self._send("preview_text", text)
                self._send("log", f"{filename} 완료")
                logger.info(f"{filename} OCR 완료")

            except UnidentifiedImageError:
                msg = f"{filename}: 이미지를 열 수 없습니다."
                self._send("log", msg)
                logger.error(msg)

            except OSError:
                msg = f"{filename}: 이미지를 열 수 없습니다."
                self._send("log", msg)
                logger.error(msg)

            except pytesseract.TesseractError:
                msg = f"{filename}: OCR 처리 중 오류 발생"
                self._send("log", msg)
                logger.error(msg)

            except Exception as exc:
                msg = f"{filename}: OCR 처리 중 오류 발생 ({exc})"
                self._send("log", msg)
                logger.error(msg)

        if not results:
            self._send("error", "처리에 성공한 이미지가 없습니다.")
            return

        try:
            output_path = file_manager.save_text(
                results=results,
                output_dir=output_dir,
                merge=merge,
                output_filename=config.OUTPUT_FILE,
            )
        except OSError as exc:
            self._send("error", f"파일 저장 실패: {exc}")
            logger.error(f"파일 저장 실패: {exc}")
            return

        if self.stop_requested:
            self._send("stopped", str(output_path), merge)
        else:
            self._send("done", str(output_path), merge)
