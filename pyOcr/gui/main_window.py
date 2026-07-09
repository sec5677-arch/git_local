"""
메인 GUI 창
OCRApp 클래스가 전체 화면과 이벤트를 관리합니다.
"""

import os
import queue
import tkinter as tk
from datetime import datetime
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from config import config
from core.worker import OCRWorker
from gui.preview_panel import PreviewPanel
from gui.settings_dialog import SettingsDialog


class OCRApp:
    """GUI 기반 OCR 일괄 처리 애플리케이션"""

    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("이미지 OCR 일괄 처리 프로그램")
        self.root.minsize(720, 680)

        self.settings = config.load_settings()
        self.message_queue: queue.Queue = queue.Queue()
        self.worker: OCRWorker | None = None
        self.last_output_path: str | None = None
        self.is_running = False

        self._init_variables()
        self.create_ui()
        self._apply_settings_to_ui()
        self._poll_queue()

    def _init_variables(self) -> None:
        """Tkinter 변수 초기화"""
        self.input_dir_var = tk.StringVar(value=self.settings.get("input_dir", ""))
        self.output_dir_var = tk.StringVar(
            value=self.settings.get("output_dir", str(config.OUTPUT_DIR))
        )
        self.language_var = tk.StringVar(value=self._lang_label_from_code(
            self.settings.get("language", "kor+eng")
        ))
        self.merge_var = tk.BooleanVar(value=self.settings.get("merge_text", True))
        self.recursive_var = tk.BooleanVar(value=self.settings.get("recursive", False))
        self.preprocess_var = tk.BooleanVar(value=self.settings.get("preprocess", True))
        self.current_file_var = tk.StringVar(value="-")
        self.progress_var = tk.DoubleVar(value=0)

    def _lang_label_from_code(self, code: str) -> str:
        """언어 코드를 콤보박스 표시명으로 변환합니다."""
        for label, lang_code in config.LANGUAGE_OPTIONS.items():
            if lang_code == code:
                return label
        return "한국어+영어"

    def _lang_code_from_label(self, label: str) -> str:
        """콤보박스 표시명을 언어 코드로 변환합니다."""
        return config.LANGUAGE_OPTIONS.get(label, "kor+eng")

    def create_ui(self) -> None:
        """메인 화면 UI를 생성합니다."""
        main = ttk.Frame(self.root, padding=12)
        main.pack(fill=tk.BOTH, expand=True)

        # 제목
        ttk.Label(main, text="이미지 OCR 일괄 처리 프로그램", font=("", 14, "bold")).pack(
            anchor=tk.W, pady=(0, 10)
        )

        body = ttk.Frame(main)
        body.pack(fill=tk.BOTH, expand=True)

        left = ttk.Frame(body)
        left.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))

        right = ttk.Frame(body)
        right.pack(side=tk.RIGHT, fill=tk.BOTH)

        self._create_folder_section(left)
        self._create_options_section(left)
        self._create_progress_section(left)
        self._create_button_section(left)
        self._create_log_section(left)

        self.preview_panel = PreviewPanel(right)
        self.preview_panel.pack(fill=tk.BOTH, expand=True)

        # 메뉴
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        settings_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="설정", menu=settings_menu)
        settings_menu.add_command(label="고급 설정", command=self._open_settings_dialog)
        settings_menu.add_separator()
        settings_menu.add_command(label="종료", command=self.root.quit)

    def _create_folder_section(self, parent: ttk.Frame) -> None:
        """입력/출력 폴더 선택 영역"""
        # 입력 폴더
        ttk.Label(parent, text="입력 폴더").pack(anchor=tk.W)
        input_row = ttk.Frame(parent)
        input_row.pack(fill=tk.X, pady=(2, 8))
        ttk.Entry(input_row, textvariable=self.input_dir_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4)
        )
        ttk.Button(input_row, text="찾아보기", command=self._browse_input).pack(side=tk.RIGHT)

        # 출력 폴더
        ttk.Label(parent, text="출력 폴더").pack(anchor=tk.W)
        output_row = ttk.Frame(parent)
        output_row.pack(fill=tk.X, pady=(2, 8))
        ttk.Entry(output_row, textvariable=self.output_dir_var).pack(
            side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 4)
        )
        ttk.Button(output_row, text="찾아보기", command=self._browse_output).pack(side=tk.RIGHT)

    def _create_options_section(self, parent: ttk.Frame) -> None:
        """OCR 언어, 저장 방식, 옵션 영역"""
        ttk.Label(parent, text="OCR 언어").pack(anchor=tk.W)
        ttk.Combobox(
            parent,
            textvariable=self.language_var,
            values=list(config.LANGUAGE_OPTIONS.keys()),
            state="readonly",
        ).pack(fill=tk.X, pady=(2, 8))

        ttk.Label(parent, text="저장 방식").pack(anchor=tk.W)
        save_frame = ttk.Frame(parent)
        save_frame.pack(anchor=tk.W, pady=(2, 8))
        ttk.Radiobutton(
            save_frame, text="통합 저장", variable=self.merge_var, value=True
        ).pack(side=tk.LEFT, padx=(0, 12))
        ttk.Radiobutton(
            save_frame, text="개별 저장", variable=self.merge_var, value=False
        ).pack(side=tk.LEFT)

        ttk.Label(parent, text="옵션").pack(anchor=tk.W)
        opt_frame = ttk.Frame(parent)
        opt_frame.pack(anchor=tk.W, pady=(2, 8))
        ttk.Checkbutton(
            opt_frame, text="하위 폴더 포함", variable=self.recursive_var
        ).pack(anchor=tk.W)
        ttk.Checkbutton(
            opt_frame, text="이미지 전처리 적용", variable=self.preprocess_var
        ).pack(anchor=tk.W)

    def _create_progress_section(self, parent: ttk.Frame) -> None:
        """진행률 및 현재 파일 표시 영역"""
        ttk.Label(parent, text="진행 상태").pack(anchor=tk.W)
        self.progress_bar = ttk.Progressbar(
            parent, variable=self.progress_var, maximum=100
        )
        self.progress_bar.pack(fill=tk.X, pady=(2, 4))

        self.progress_label = ttk.Label(parent, text="0%")
        self.progress_label.pack(anchor=tk.W)

        ttk.Label(parent, text="현재 처리 파일").pack(anchor=tk.W, pady=(6, 0))
        ttk.Label(parent, textvariable=self.current_file_var).pack(anchor=tk.W, pady=(2, 8))

    def _create_button_section(self, parent: ttk.Frame) -> None:
        """시작/중지/결과 열기 버튼"""
        btn_frame = ttk.Frame(parent)
        btn_frame.pack(fill=tk.X, pady=(0, 8))

        self.start_btn = ttk.Button(btn_frame, text="시작", command=self.start_ocr)
        self.start_btn.pack(side=tk.LEFT, padx=(0, 6))

        self.stop_btn = ttk.Button(btn_frame, text="중지", command=self.stop_ocr, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=(0, 6))

        self.open_btn = ttk.Button(
            btn_frame, text="결과 열기", command=self._open_result, state=tk.DISABLED
        )
        self.open_btn.pack(side=tk.LEFT)

    def _create_log_section(self, parent: ttk.Frame) -> None:
        """실시간 로그 출력 영역"""
        ttk.Label(parent, text="로그").pack(anchor=tk.W)
        log_frame = ttk.Frame(parent)
        log_frame.pack(fill=tk.BOTH, expand=True, pady=(2, 0))

        self.log_text = tk.Text(log_frame, height=10, wrap=tk.WORD, state=tk.DISABLED)
        log_scroll = ttk.Scrollbar(log_frame, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scroll.set)

        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_scroll.pack(side=tk.RIGHT, fill=tk.Y)

    def _apply_settings_to_ui(self) -> None:
        """저장된 설정을 UI에 반영합니다."""
        if not self.output_dir_var.get():
            self.output_dir_var.set(str(config.OUTPUT_DIR))

    def _browse_input(self) -> None:
        """입력 폴더 선택 대화상자"""
        folder = filedialog.askdirectory(title="입력 폴더 선택")
        if folder:
            self.input_dir_var.set(folder)

    def _browse_output(self) -> None:
        """출력 폴더 선택 대화상자"""
        folder = filedialog.askdirectory(title="출력 폴더 선택")
        if folder:
            self.output_dir_var.set(folder)

    def _open_settings_dialog(self) -> None:
        """고급 설정 대화상자를 엽니다."""
        SettingsDialog(self.root)

    def _collect_settings(self) -> dict:
        """현재 UI 값을 설정 딕셔너리로 수집합니다."""
        return {
            "input_dir": self.input_dir_var.get(),
            "output_dir": self.output_dir_var.get(),
            "language": self._lang_code_from_label(self.language_var.get()),
            "merge_text": self.merge_var.get(),
            "recursive": self.recursive_var.get(),
            "preprocess": self.preprocess_var.get(),
        }

    def start_ocr(self) -> None:
        """OCR 작업을 시작합니다."""
        if self.is_running:
            return

        if not Path(config.TESSERACT_PATH).exists():
            messagebox.showerror(
                "Tesseract 없음",
                f"Tesseract OCR이 설치되어 있지 않습니다.\n\n경로: {config.TESSERACT_PATH}\n\n"
                "https://github.com/UB-Mannheim/tesseract/wiki 에서 설치하세요.",
            )
            return

        input_dir = self.input_dir_var.get().strip()
        output_dir = self.output_dir_var.get().strip()

        if not input_dir:
            messagebox.showwarning("입력 폴더", "입력 폴더를 선택해 주세요.")
            return

        if not output_dir:
            messagebox.showwarning("출력 폴더", "출력 폴더를 선택해 주세요.")
            return

        if not Path(input_dir).exists():
            messagebox.showerror("입력 폴더", "선택한 입력 폴더가 존재하지 않습니다.")
            return

        self.settings = self._collect_settings()
        config.save_settings(self.settings)

        Path(output_dir).mkdir(parents=True, exist_ok=True)
        (Path(output_dir) / "logs").mkdir(parents=True, exist_ok=True)

        self.is_running = True
        self.last_output_path = None
        self.progress_var.set(0)
        self.progress_label.configure(text="0%")
        self.current_file_var.set("-")
        self.preview_panel.clear()
        self.open_btn.configure(state=tk.DISABLED)

        self.start_btn.configure(state=tk.DISABLED)
        self.stop_btn.configure(state=tk.NORMAL)

        self.worker = OCRWorker(self.settings, self.message_queue)
        self.worker.start()

    def stop_ocr(self) -> None:
        """OCR 작업 중지를 요청합니다."""
        if self.worker and self.is_running:
            self.worker.stop_requested = True
            self.update_log("중지 요청됨 - 현재 파일 처리 후 종료합니다.")

    def update_progress(self, current: int, total: int, filename: str) -> None:
        """진행률과 현재 파일명을 업데이트합니다."""
        percent = (current / total) * 100 if total > 0 else 0
        self.progress_var.set(percent)
        self.progress_label.configure(text=f"{int(percent)}%")
        self.current_file_var.set(filename)

    def update_log(self, message: str) -> None:
        """로그 창에 메시지를 추가합니다."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        line = f"[{timestamp}] {message}\n"

        self.log_text.configure(state=tk.NORMAL)
        self.log_text.insert(tk.END, line)
        self.log_text.see(tk.END)
        self.log_text.configure(state=tk.DISABLED)

    def _open_result(self) -> None:
        """저장된 결과 파일 또는 폴더를 엽니다."""
        if not self.last_output_path:
            return

        path = Path(self.last_output_path)
        try:
            if path.is_file():
                os.startfile(path)
            elif path.is_dir():
                os.startfile(path)
        except OSError as exc:
            messagebox.showerror("열기 실패", f"결과를 열 수 없습니다.\n{exc}")

    def _on_ocr_done(self, output_path: str, merge: bool) -> None:
        """OCR 완료 후 UI 상태를 복원하고 완료 메시지를 표시합니다."""
        self.is_running = False
        self.start_btn.configure(state=tk.NORMAL)
        self.stop_btn.configure(state=tk.DISABLED)
        self.last_output_path = output_path
        self.open_btn.configure(state=tk.NORMAL)
        self.progress_var.set(100)
        self.progress_label.configure(text="100%")

        self.update_log("OCR 작업 완료")
        if merge:
            self.update_log(f"결과 저장 : {output_path}")
        else:
            self.update_log(f"결과 저장 : {output_path}")

        if messagebox.askyesno("완료", "OCR 처리가 완료되었습니다.\n결과 파일을 열겠습니까?"):
            self._open_result()

    def _on_ocr_stopped(self, output_path: str, merge: bool) -> None:
        """중지 후 부분 결과 저장 완료 처리"""
        self.is_running = False
        self.start_btn.configure(state=tk.NORMAL)
        self.stop_btn.configure(state=tk.DISABLED)
        self.last_output_path = output_path
        self.open_btn.configure(state=tk.NORMAL)
        self.update_log(f"부분 결과 저장 : {output_path}")

    def _on_ocr_error(self, message: str) -> None:
        """오류 발생 시 처리"""
        self.is_running = False
        self.start_btn.configure(state=tk.NORMAL)
        self.stop_btn.configure(state=tk.DISABLED)
        self.update_log(message)
        messagebox.showerror("오류", message)

    def _poll_queue(self) -> None:
        """Worker 스레드에서 보낸 메시지를 주기적으로 처리합니다."""
        try:
            while True:
                msg = self.message_queue.get_nowait()
                msg_type = msg[0]

                if msg_type == "log":
                    self.update_log(msg[1])
                elif msg_type == "progress":
                    self.update_progress(msg[1], msg[2], msg[3])
                elif msg_type == "preview_image":
                    self.preview_panel.show_image(msg[1])
                elif msg_type == "preview_text":
                    self.preview_panel.show_text(msg[1])
                elif msg_type == "done":
                    self._on_ocr_done(msg[1], msg[2])
                elif msg_type == "stopped":
                    self._on_ocr_stopped(msg[1], msg[2])
                elif msg_type == "error":
                    self._on_ocr_error(msg[1])
        except queue.Empty:
            pass

        self.root.after(100, self._poll_queue)
