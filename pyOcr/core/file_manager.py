"""
파일 관리 모듈
이미지 목록 조회 및 OCR 결과 텍스트 저장을 담당합니다.
"""

from pathlib import Path

from config import config


class FileManager:
    """이미지 검색과 텍스트 저장을 담당하는 클래스"""

    def get_image_list(self, folder: Path, recursive: bool = False) -> list[Path]:
        """
        폴더에서 지원 확장자의 이미지 파일 목록을 가져옵니다.
        recursive=True 이면 하위 폴더까지 검색합니다.
        """
        if not folder.exists():
            return []

        images: list[Path] = []

        if recursive:
            # 하위 폴더 포함 재귀 검색
            for file_path in folder.rglob("*"):
                if file_path.is_file() and file_path.suffix.lower() in config.SUPPORTED_EXTENSIONS:
                    images.append(file_path)
        else:
            for file_path in folder.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in config.SUPPORTED_EXTENSIONS:
                    images.append(file_path)

        images.sort(key=lambda p: p.name.lower())
        return images

    def save_text(
        self,
        results: list[tuple[str, str]],
        output_dir: Path,
        merge: bool = True,
        output_filename: str = "result.txt",
    ) -> Path:
        """OCR 결과를 텍스트 파일로 저장합니다."""
        output_dir.mkdir(parents=True, exist_ok=True)

        if merge:
            output_path = output_dir / output_filename
            lines: list[str] = []

            for filename, text in results:
                lines.append(f"===== {filename} =====")
                lines.append("")
                lines.append(text.strip())
                lines.append("")

            output_path.write_text("\n".join(lines), encoding="utf-8")
            return output_path

        for filename, text in results:
            stem = Path(filename).stem
            (output_dir / f"{stem}.txt").write_text(text.strip(), encoding="utf-8")

        return output_dir
