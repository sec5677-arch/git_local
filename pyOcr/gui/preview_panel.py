"""
미리보기 패널
현재 처리 중인 이미지와 OCR 결과를 화면에 표시합니다.
"""

import tkinter as tk
from tkinter import ttk
from pathlib import Path

from PIL import Image, ImageTk


class PreviewPanel(ttk.LabelFrame):
    """이미지 미리보기 + OCR 결과 미리보기 패널"""

    # 미리보기 영역 최대 크기
    PREVIEW_MAX_SIZE = (280, 200)

    def __init__(self, parent: tk.Misc) -> None:
        super().__init__(parent, text="미리보기", padding=8)
        self._photo: ImageTk.PhotoImage | None = None
        self._current_image_path: str | None = None
        self._create_ui()

    def _create_ui(self) -> None:
        """UI 구성 요소를 생성합니다."""
        # 이미지 미리보기 영역
        image_frame = ttk.LabelFrame(self, text="이미지", padding=4)
        image_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 6))

        self.image_label = ttk.Label(image_frame, text="처리 대기 중", anchor=tk.CENTER)
        self.image_label.pack(fill=tk.BOTH, expand=True, ipady=40)
        self.image_label.bind("<Double-Button-1>", self._on_image_double_click)

        self.filename_label = ttk.Label(image_frame, text="", anchor=tk.CENTER)
        self.filename_label.pack(fill=tk.X, pady=(4, 0))

        # OCR 결과 미리보기 영역
        result_frame = ttk.LabelFrame(self, text="OCR 결과", padding=4)
        result_frame.pack(fill=tk.BOTH, expand=True)

        self.result_text = tk.Text(result_frame, height=8, wrap=tk.WORD, state=tk.DISABLED)
        scrollbar = ttk.Scrollbar(result_frame, command=self.result_text.yview)
        self.result_text.configure(yscrollcommand=scrollbar.set)

        self.result_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def show_image(self, image_path: str) -> None:
        """현재 처리 중인 이미지를 미리보기에 표시합니다."""
        self._current_image_path = image_path
        path = Path(image_path)

        try:
            img = Image.open(path)
            img.thumbnail(self.PREVIEW_MAX_SIZE, Image.Resampling.LANCZOS)
            self._photo = ImageTk.PhotoImage(img)
            self.image_label.configure(image=self._photo, text="")
            self.filename_label.configure(text=path.name)
        except OSError:
            self.image_label.configure(image="", text="이미지를 표시할 수 없습니다.")
            self.filename_label.configure(text=path.name)

    def show_text(self, text: str) -> None:
        """OCR 추출 결과를 텍스트 영역에 표시합니다."""
        self.result_text.configure(state=tk.NORMAL)
        self.result_text.delete("1.0", tk.END)
        self.result_text.insert(tk.END, text.strip())
        self.result_text.configure(state=tk.DISABLED)

    def clear(self) -> None:
        """미리보기 내용을 초기화합니다."""
        self._photo = None
        self._current_image_path = None
        self.image_label.configure(image="", text="처리 대기 중")
        self.filename_label.configure(text="")
        self.result_text.configure(state=tk.NORMAL)
        self.result_text.delete("1.0", tk.END)
        self.result_text.configure(state=tk.DISABLED)

    def _on_image_double_click(self, _event) -> None:
        """이미지 더블 클릭 시 확대 보기 창을 엽니다."""
        if not self._current_image_path:
            return

        zoom = tk.Toplevel(self)
        zoom.title(Path(self._current_image_path).name)
        zoom.geometry("800x600")

        try:
            img = Image.open(self._current_image_path)
            # 창 크기에 맞게 축소
            img.thumbnail((780, 560), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(img)

            label = ttk.Label(zoom, image=photo)
            label.image = photo  # 가비지 컬렉션 방지
            label.pack(expand=True, fill=tk.BOTH, padx=8, pady=8)
        except OSError:
            ttk.Label(zoom, text="이미지를 열 수 없습니다.").pack(padx=20, pady=20)
