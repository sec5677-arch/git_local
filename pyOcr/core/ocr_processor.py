"""
OCR 처리 모듈
이미지를 불러와 Tesseract로 텍스트를 추출합니다.
"""

from pathlib import Path

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

from config import config


class OCRProcessor:
    """이미지 로드 및 OCR 텍스트 추출을 담당하는 클래스"""

    def __init__(self, language: str = "kor+eng", preprocess: bool = True) -> None:
        pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_PATH
        self.language = language
        self.preprocess_enabled = preprocess

    def load_image(self, image_path: Path) -> Image.Image:
        """이미지 파일을 PIL Image 객체로 열어 반환합니다."""
        return Image.open(image_path)

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        OCR 정확도 향상을 위한 이미지 전처리
        - 흑백 변환, 대비 향상, 노이즈 제거, 필요 시 리사이징
        """
        if not self.preprocess_enabled:
            return image

        # 1) 흑백 변환
        img = image.convert("L")

        # 2) 대비 향상
        img = ImageEnhance.Contrast(img).enhance(1.5)

        # 3) 노이즈 제거 (미디언 필터)
        img = img.filter(ImageFilter.MedianFilter(size=3))

        # 4) 너무 작은 이미지는 확대
        width, height = img.size
        if max(width, height) < 1000:
            scale = 1000 / max(width, height)
            new_size = (int(width * scale), int(height * scale))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        return img

    def extract_text(self, image: Image.Image) -> str:
        """PIL Image에서 OCR로 텍스트를 추출합니다."""
        processed = self.preprocess_image(image)
        return pytesseract.image_to_string(processed, lang=self.language)
