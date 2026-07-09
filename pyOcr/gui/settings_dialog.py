"""
설정 대화상자
Tesseract 경로 등 고급 설정을 확인·수정합니다.
"""

import tkinter as tk
from tkinter import messagebox, ttk

from config import config


class SettingsDialog(tk.Toplevel):
    """고급 설정을 보여주는 대화상자"""

    def __init__(self, parent: tk.Misc) -> None:
        super().__init__(parent)
        self.title("고급 설정")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        self._create_ui()
        self._center_on_parent(parent)

    def _create_ui(self) -> None:
        """UI 구성"""
        frame = ttk.Frame(self, padding=16)
        frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(frame, text="Tesseract 경로").grid(row=0, column=0, sticky=tk.W)
        self.tesseract_var = tk.StringVar(value=config.TESSERACT_PATH)
        ttk.Entry(frame, textvariable=self.tesseract_var, width=50).grid(
            row=1, column=0, columnspan=2, sticky=tk.EW, pady=(4, 12)
        )

        ttk.Label(frame, text="설정 파일").grid(row=2, column=0, sticky=tk.W)
        ttk.Label(frame, text=str(config.SETTINGS_PATH), foreground="gray").grid(
            row=3, column=0, columnspan=2, sticky=tk.W, pady=(4, 12)
        )

        btn_frame = ttk.Frame(frame)
        btn_frame.grid(row=4, column=0, columnspan=2, sticky=tk.E)

        ttk.Button(btn_frame, text="닫기", command=self.destroy).pack(side=tk.RIGHT)

        frame.columnconfigure(0, weight=1)

    def _center_on_parent(self, parent: tk.Misc) -> None:
        """부모 창 중앙에 대화상자를 배치합니다."""
        self.update_idletasks()
        px = parent.winfo_rootx() + (parent.winfo_width() // 2) - (self.winfo_width() // 2)
        py = parent.winfo_rooty() + (parent.winfo_height() // 2) - (self.winfo_height() // 2)
        self.geometry(f"+{px}+{py}")
