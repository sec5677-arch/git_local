import os
import queue
import threading
import time
import traceback
from datetime import datetime


def select_region_via_mouse(parent=None):
    """
    전체 화면(반투명) 위에 마우스를 드래그해서 캡쳐 영역을 선택합니다.
    반환: (left, top, width, height) 또는 너무 작으면 None
    """
    import tkinter as tk

    bbox_result = {"bbox": None}

    # 이미 만들어진 Tk root가 있으면 그 root 위에 Toplevel을 띄웁니다.
    if parent is not None:
        root = parent
        parent_is_tk_root = True
    else:
        root = tk.Tk()
        root.withdraw()  # 선택 화면이 전체를 덮으므로 뒤는 숨깁니다.
        parent_is_tk_root = False

    overlay = tk.Toplevel(root)
    overlay.title("캡쳐 영역을 드래그하세요")
    overlay.attributes("-fullscreen", True)
    overlay.attributes("-topmost", True)
    try:
        overlay.attributes("-alpha", 0.25)
    except Exception:
        # OS/환경에 따라 alpha가 안 될 수도 있습니다.
        pass

    screen_w = overlay.winfo_screenwidth()
    screen_h = overlay.winfo_screenheight()

    canvas = tk.Canvas(overlay, width=screen_w, height=screen_h, bg="black", cursor="cross")
    canvas.pack(fill="both", expand=True)

    start_x = None
    start_y = None
    rect_id = None

    def on_press(event):
        nonlocal start_x, start_y, rect_id
        start_x, start_y = event.x, event.y
        rect_id = canvas.create_rectangle(start_x, start_y, start_x, start_y, outline="red", width=2)

    def on_drag(event):
        nonlocal rect_id, start_x, start_y
        if rect_id is None or start_x is None or start_y is None:
            return
        canvas.coords(rect_id, start_x, start_y, event.x, event.y)

    def on_release(event):
        nonlocal rect_id, start_x, start_y
        if start_x is None or start_y is None:
            return

        x1, y1 = start_x, start_y
        x2, y2 = event.x, event.y

        left = min(x1, x2)
        top = min(y1, y2)
        width = abs(x2 - x1)
        height = abs(y2 - y1)

        # 너무 작게 잡힌 경우는 다시 선택시키기 위해 None 처리합니다.
        if width < 5 or height < 5:
            bbox_result["bbox"] = None
        else:
            bbox_result["bbox"] = (left, top, width, height)

        overlay.destroy()

    def on_cancel(_event=None):
        bbox_result["bbox"] = None
        overlay.destroy()

    canvas.bind("<ButtonPress-1>", on_press)
    canvas.bind("<B1-Motion>", on_drag)
    canvas.bind("<ButtonRelease-1>", on_release)
    canvas.bind("<Escape>", on_cancel)  # 취소: ESC

    # 선택 창이 닫힐 때까지 기다립니다.
    if not parent_is_tk_root:
        root.deiconify()
    try:
        root.wait_window(overlay)
    finally:
        if not parent_is_tk_root:
            root.destroy()

    return bbox_result["bbox"]


class CaptureApp:
    def __init__(self, root):
        import tkinter as tk
        from tkinter import ttk

        self.root = root
        self.root.title("스크린 캡쳐 반복 저장")
        # 입력칸(캡쳐 횟수 등)이 늘어나서 창 밖으로 밀리지 않게 높이를 늘립니다.
        self.root.geometry("650x520")
        self.root.minsize(650, 520)

        self.bbox = None
        self.capture_thread = None
        self.capture_stop_event = None
        self.click_thread = None
        self.click_stop_event = None
        # 반복 클릭에 사용할 좌표(사용자 설정)
        self.click_point = None  # (x, y) 튜플
        self.click_point_thread = None
        self.click_point_stop_event = None
        self.msg_queue = queue.Queue()

        default_out_dir = os.path.join(os.path.dirname(__file__))

        # UI 구성
        main = ttk.Frame(root, padding=12)
        main.pack(fill="both", expand=True)

        row = 0
        ttk.Label(main, text="1) 캡쳐할 영역 선택").grid(row=row, column=0, sticky="w")
        row += 1

        self.btn_select = ttk.Button(main, text="영역 선택(드래그)", command=self.on_select_region)
        self.btn_select.grid(row=row, column=0, sticky="w")
        self.lbl_region = ttk.Label(main, text="선택 전")
        self.lbl_region.grid(row=row, column=1, sticky="w", padx=(10, 0))
        row += 1

        row_space = 8
        ttk.Separator(main).grid(row=row, column=0, columnspan=2, sticky="ew", pady=row_space)
        row += 1

        ttk.Label(main, text="2) 캡쳐 간격 설정(초)").grid(row=row, column=0, sticky="w")
        row += 1
        self.ent_interval = ttk.Entry(main, width=10)
        self.ent_interval.insert(0, "3")
        self.ent_interval.grid(row=row, column=0, sticky="w")

        ttk.Label(main, text="(예: 3 = 3초마다)").grid(row=row, column=1, sticky="w", padx=(10, 0))
        row += 1

        ttk.Label(main, text="3) 저장 폴더").grid(row=row, column=0, sticky="w")
        row += 1
        self.ent_out_dir = ttk.Entry(main)
        self.ent_out_dir.insert(0, default_out_dir)
        self.ent_out_dir.grid(row=row, column=0, sticky="ew")

        btn_browse = ttk.Button(main, text="폴더 선택", command=self.on_choose_out_dir)
        btn_browse.grid(row=row, column=1, sticky="w", padx=(10, 0))
        row += 1

        row_space = 8
        ttk.Separator(main).grid(row=row, column=0, columnspan=2, sticky="ew", pady=row_space)
        row += 1

        ttk.Label(main, text="4) 파일 이름 앞부분").grid(row=row, column=0, sticky="w")
        row += 1
        self.ent_prefix = ttk.Entry(main, width=22)
        self.ent_prefix.insert(0, "capture_")
        self.ent_prefix.grid(row=row, column=0, sticky="w")
        row += 1

        ttk.Label(main, text="5) 캡쳐 횟수").grid(row=row, column=0, sticky="w")
        row += 1
        # 0 또는 빈 값이면 무한 반복으로 동작합니다.
        self.ent_count = ttk.Entry(main, width=10)
        self.ent_count.insert(0, "0")
        self.ent_count.grid(row=row, column=0, sticky="w")

        ttk.Label(main, text="(0=무한)").grid(row=row, column=1, sticky="w", padx=(10, 0))
        row += 1

        ttk.Separator(main).grid(row=row, column=0, columnspan=2, sticky="ew", pady=row_space)
        row += 1

        ttk.Label(main, text="6) 왼쪽 마우스 반복 클릭").grid(row=row, column=0, sticky="w")
        row += 1

        ttk.Label(main, text="클릭 간격(초)").grid(row=row, column=0, sticky="w")
        row += 1
        self.ent_click_interval = ttk.Entry(main, width=10)
        self.ent_click_interval.insert(0, "0.2")
        self.ent_click_interval.grid(row=row, column=0, sticky="w")
        ttk.Label(main, text="(예: 0.2)").grid(row=row, column=1, sticky="w", padx=(10, 0))
        row += 1

        ttk.Label(main, text="클릭 횟수").grid(row=row, column=0, sticky="w")
        row += 1
        # 0 또는 빈 값이면 무한 반복으로 동작합니다.
        self.ent_click_count = ttk.Entry(main, width=10)
        self.ent_click_count.insert(0, "0")
        self.ent_click_count.grid(row=row, column=0, sticky="w")
        ttk.Label(main, text="(0=무한)").grid(row=row, column=1, sticky="w", padx=(10, 0))
        row += 1

        # 버튼들
        btn_frame = ttk.Frame(main)
        btn_frame.grid(row=row, column=0, columnspan=2, sticky="w", pady=(14, 6))
        row += 1

        self.btn_start = ttk.Button(btn_frame, text="캡쳐 시작", command=self.on_start)
        self.btn_start.grid(row=0, column=0, padx=(0, 8))

        self.btn_stop = ttk.Button(btn_frame, text="캡쳐 중지", command=self.on_stop, state="disabled")
        self.btn_stop.grid(row=0, column=1)

        self.btn_click_start = ttk.Button(btn_frame, text="클릭 시작", command=self.on_start_click)
        self.btn_click_start.grid(row=1, column=0, padx=(0, 8), pady=(6, 0))

        self.btn_click_stop = ttk.Button(btn_frame, text="클릭 중지", command=self.on_stop_click, state="disabled")
        self.btn_click_stop.grid(row=1, column=1, pady=(6, 0))

        # 좌표 설정(버튼 누른 뒤, 화면에서 좌측 클릭 1번)
        self.btn_set_click_point = ttk.Button(
            btn_frame,
            text="클릭 포인트 설정(1번 클릭)",
            command=self.on_set_click_point,
        )
        self.btn_set_click_point.grid(row=2, column=0, columnspan=2, sticky="w", pady=(6, 0))

        self.lbl_click_point = ttk.Label(btn_frame, text="포인트: 설정 전")
        self.lbl_click_point.grid(row=3, column=0, columnspan=2, sticky="w", pady=(2, 0))

        # 로그 표시(높이를 조금 줄여서 아래 입력이 안 잘리게 합니다.)
        self.txt_log = tk.Text(main, height=10, wrap="word")
        self.txt_log.grid(row=row, column=0, columnspan=2, sticky="nsew", pady=(6, 0))
        row += 1

        main.grid_rowconfigure(row, weight=1)
        main.grid_columnconfigure(0, weight=1)

        self.poll_messages()

        # 창 닫기 처리
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

        self._log("프로그램 준비 완료. '영역 선택(드래그)'부터 해주세요.")

    def _log(self, text):
        # Tk 위젯 업데이트는 메인 스레드에서만 실행되도록, 호출은 주로 GUI 이벤트에서 합니다.
        self.txt_log.insert("end", text + "\n")
        self.txt_log.see("end")

    def on_choose_out_dir(self):
        from tkinter import filedialog

        directory = filedialog.askdirectory()
        if directory:
            self.ent_out_dir.delete(0, "end")
            self.ent_out_dir.insert(0, directory)

    def on_select_region(self):
        self._log("영역 선택 창을 띄웁니다... (드래그로 영역 지정, ESC로 취소)")
        bbox = select_region_via_mouse(self.root)
        if bbox is None:
            self.bbox = None
            self.lbl_region.config(text="선택 전")
            self._log("선택이 취소되었거나 너무 작아서 저장하지 않습니다.")
            return
        self.bbox = bbox
        left, top, width, height = bbox
        self.lbl_region.config(text=f"left={left}, top={top}, w={width}, h={height}")
        self._log("영역 선택 완료. '시작'을 눌러 캡쳐를 시작하세요.")

    def on_start(self):
        # 중복 실행 방지
        if self.capture_thread and self.capture_thread.is_alive():
            return

        # 입력값 읽기/검증
        try:
            interval = float(self.ent_interval.get())
        except ValueError:
            self._log("간격 값이 숫자가 아닙니다. 예: 3")
            return
        if interval <= 0:
            self._log("간격 값은 0보다 커야 합니다.")
            return

        out_dir = self.ent_out_dir.get().strip()
        if not out_dir:
            self._log("저장 폴더가 비어있습니다.")
            return
        os.makedirs(out_dir, exist_ok=True)

        prefix = self.ent_prefix.get().strip() or "capture_"

        # 캡쳐 횟수 읽기
        raw_count = self.ent_count.get().strip()
        if raw_count == "":
            capture_count = 0
        else:
            try:
                capture_count = int(raw_count)
            except ValueError:
                self._log("캡쳐 횟수 값이 숫자가 아닙니다. 예: 10 (0=무한)")
                return
        if capture_count < 0:
            self._log("캡쳐 횟수는 0 이상이어야 합니다.")
            return

        # 영역이 아직 없으면 자동으로 선택부터 진행
        if self.bbox is None:
            self._log("아직 영역이 선택되지 않았습니다. 먼저 영역을 선택합니다.")
            bbox = select_region_via_mouse(self.root)
            if bbox is None:
                self._log("영역 선택이 취소되어 시작하지 않습니다.")
                return
            self.bbox = bbox
            left, top, width, height = bbox
            self.lbl_region.config(text=f"left={left}, top={top}, w={width}, h={height}")

        left, top, width, height = self.bbox
        self._log(f"시작합니다. 간격={interval}초, 폴더={out_dir}")

        # 캡쳐 스레드 실행
        self.capture_stop_event = threading.Event()
        self.btn_start.config(state="disabled")
        self.btn_stop.config(state="normal")
        self.btn_select.config(state="disabled")
        self.capture_thread = threading.Thread(
            target=self.capture_loop,
            args=(
                interval,
                out_dir,
                prefix,
                (left, top, width, height),
                capture_count,
                self.capture_stop_event,
                self.msg_queue,
            ),
            daemon=True,
        )
        self.capture_thread.start()

    def on_stop(self):
        if self.capture_stop_event:
            self._log("중지 요청 중...")
            self.capture_stop_event.set()
            self.btn_stop.config(state="disabled")

    def on_start_click(self):
        # 중복 실행 방지
        if self.click_thread and self.click_thread.is_alive():
            return

        # 입력값 읽기/검증
        try:
            click_interval = float(self.ent_click_interval.get())
        except ValueError:
            self._log("클릭 간격 값이 숫자가 아닙니다. 예: 0.2")
            return
        if click_interval <= 0:
            self._log("클릭 간격은 0보다 커야 합니다. 예: 0.2")
            return

        # 클릭 횟수 읽기/검증(0=무한)
        raw_count = self.ent_click_count.get().strip()
        if raw_count == "":
            click_count = 0
        else:
            try:
                click_count = int(raw_count)
            except ValueError:
                self._log("클릭 횟수 값이 숫자가 아닙니다. 예: 100 (0=무한)")
                return
        if click_count < 0:
            self._log("클릭 횟수는 0 이상이어야 합니다.")
            return

        if self.click_point is None:
            self._log("먼저 '클릭 포인트 설정(1번 클릭)' 버튼으로 좌표를 저장하세요.")
            return

        click_x, click_y = self.click_point

        self._log(
            f"왼쪽 클릭 반복 시작: 간격={click_interval}초, 횟수={click_count}번"
        )

        self.click_stop_event = threading.Event()
        self.btn_click_start.config(state="disabled")
        self.btn_click_stop.config(state="normal")
        self.btn_set_click_point.config(state="disabled")
        self.click_thread = threading.Thread(
            target=self.click_loop,
            args=(
                click_interval,
                click_count,
                click_x,
                click_y,
                self.click_stop_event,
                self.msg_queue,
            ),
            daemon=True,
        )
        self.click_thread.start()

    def on_stop_click(self):
        if self.click_stop_event:
            self._log("클릭 중지 요청 중...")
            self.click_stop_event.set()
            self.btn_click_stop.config(state="disabled")

    def on_set_click_point(self):
        # 캡쳐/클릭이 실행 중이면 좌표 설정을 막습니다.
        if (self.click_thread and self.click_thread.is_alive()) or (
            self.click_point_thread and self.click_point_thread.is_alive()
        ):
            return

        self._log("클릭 포인트 설정: 화면에서 왼쪽 버튼을 1번 클릭해주세요.")
        self.btn_set_click_point.config(state="disabled")
        self.btn_click_start.config(state="disabled")
        self.btn_click_stop.config(state="disabled")

        self.click_point_stop_event = threading.Event()
        self.click_point_thread = threading.Thread(
            target=self.set_click_point_loop,
            args=(self.click_point_stop_event, self.msg_queue),
            daemon=True,
        )
        self.click_point_thread.start()

    @staticmethod
    def set_click_point_loop(stop_event, msg_queue):
        """
        사용자가 화면에서 좌측 버튼을 1번 클릭했을 때의 좌표를 저장합니다.
        """
        import pyautogui
        import ctypes

        pyautogui.FAILSAFE = True

        def is_left_down() -> bool:
            # VK_LBUTTON = 0x01
            return (ctypes.windll.user32.GetAsyncKeyState(0x01) & 0x8000) != 0

        # (중복 트리거 방지) 버튼을 누르지 않은 상태가 될 때까지 기다립니다.
        while not stop_event.is_set() and is_left_down():
            time.sleep(0.01)

        # "처음 1번" 클릭 대기(눌림)
        while not stop_event.is_set() and (not is_left_down()):
            time.sleep(0.01)

        if stop_event.is_set():
            return

        # 클릭된 순간 좌표 저장
        click_x, click_y = pyautogui.position()
        click_x = int(click_x)
        click_y = int(click_y)

        # 클릭(누름) 해제 대기(다음 입력 방지)
        while not stop_event.is_set() and is_left_down():
            time.sleep(0.01)

        msg_queue.put(("click_point", click_x, click_y))

    def on_close(self):
        # 창 닫기 = 중지 요청(캡쳐 + 클릭)
        if self.capture_stop_event:
            self.capture_stop_event.set()
        if self.click_stop_event:
            self.click_stop_event.set()
        if self.click_point_stop_event:
            self.click_point_stop_event.set()
        self.root.destroy()

    @staticmethod
    def capture_loop(interval, out_dir, prefix, region, capture_count, stop_event, msg_queue):
        """
        백그라운드에서 반복 캡쳐를 수행합니다.
        UI 업데이트는 msg_queue를 통해 메인 스레드에서 처리합니다.
        """
        import pyautogui

        pyautogui.FAILSAFE = True

        left, top, width, height = region
        index = 0

        # capture_count가 0이면 무한 반복, 그 외에는 index가 capture_count에 도달하면 종료합니다.
        while (not stop_event.is_set()) and (capture_count <= 0 or index < capture_count):
            index += 1
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{prefix}{ts}_{index:05d}.png"
            filepath = os.path.join(out_dir, filename)

            try:
                img = pyautogui.screenshot(region=(left, top, width, height))
                img.save(filepath)
                msg_queue.put(("saved", index, filepath))
            except Exception as e:
                msg_queue.put(("error", str(e)))

            # 간격만큼 대기(중지 요청을 빨리 반영하기 위해 작은 단위로 체크)
            waited = 0.0
            while waited < interval and not stop_event.is_set():
                step = min(0.1, interval - waited)
                time.sleep(step)
                waited += step

        if stop_event.is_set():
            msg_queue.put(("stopped", index, "user_stopped"))
        else:
            msg_queue.put(("stopped", index, "count_reached"))

    @staticmethod
    def click_loop(click_interval, click_count, click_x, click_y, stop_event, msg_queue):
        """
        고정된 좌표(click_x, click_y)에서 왼쪽 버튼을 반복 클릭합니다.
        - click_count가 0이면 무한 반복
        - stop_event가 set되면 즉시 종료
        """
        import pyautogui

        pyautogui.FAILSAFE = True

        clicks = 0
        reason = "unknown"

        while not stop_event.is_set():
            # 횟수 조건(딱 click_count번까지만 클릭)
            if click_count > 0 and clicks >= click_count:
                reason = "count_reached"
                break

            # 고정된 좌표에서 왼쪽 클릭
            pyautogui.click(x=click_x, y=click_y, button="left")
            clicks += 1

            # 너무 작은 간격은 CPU를 과하게 쓰지 않도록 하한을 둡니다.
            sleep_sec = max(0.01, float(click_interval))
            time.sleep(sleep_sec)

        if stop_event.is_set():
            reason = "user_stopped"
        msg_queue.put(("click_stopped", clicks, reason))

    def poll_messages(self):
        try:
            while True:
                msg = self.msg_queue.get_nowait()
                kind = msg[0]
                if kind == "saved":
                    _kind, index, filepath = msg
                    self._log(f"[{index}] 저장 완료: {filepath}")
                elif kind == "error":
                    _kind, err = msg
                    self._log(f"오류 발생: {err}")
                elif kind == "stopped":
                    # msg: ("stopped", index, reason)
                    _kind = msg[0]
                    index = msg[1]
                    reason = msg[2] if len(msg) >= 3 else "unknown"
                    if reason == "count_reached":
                        self._log(f"캡쳐 횟수 완료! 마지막 캡쳐: {index}장")
                    else:
                        self._log(f"중지 완료. 마지막 캡쳐: {index}장")
                    self.btn_start.config(state="normal")
                    self.btn_stop.config(state="disabled")
                    self.btn_select.config(state="normal")
                elif kind == "click_stopped":
                    _kind = msg[0]
                    clicks = msg[1] if len(msg) >= 2 else 0
                    reason = msg[2] if len(msg) >= 3 else "unknown"
                    if reason == "count_reached":
                        self._log(f"클릭 횟수 완료! 총 {clicks}번 클릭")
                    else:
                        self._log(f"클릭 중지 완료. 총 {clicks}번 클릭")
                    self.btn_click_start.config(state="normal")
                    self.btn_click_stop.config(state="disabled")
                    self.btn_set_click_point.config(state="normal")
                elif kind == "click_point":
                    _kind = msg[0]
                    click_x = msg[1]
                    click_y = msg[2]
                    self.click_point = (click_x, click_y)
                    self.lbl_click_point.config(text=f"포인트: x={click_x}, y={click_y}")
                    self._log(f"클릭 포인트 설정 완료: x={click_x}, y={click_y}")
                    self.btn_set_click_point.config(state="normal")
                    # 좌표가 있으니 클릭 시작 버튼도 활성화합니다.
                    self.btn_click_start.config(state="normal")
        except queue.Empty:
            pass

        self.root.after(200, self.poll_messages)


def main():
    import tkinter as tk

    root = tk.Tk()
    # 혹시 모를 상태에서 창을 다시 보이게 만듭니다.
    try:
        root.deiconify()
    except Exception:
        pass

    # Windows 고해상도 스케일링에서 레이아웃이 흔들릴 수 있어 최소한 고정 폭을 사용합니다.
    try:
        root.tk.call("tk", "scaling", 1.0)
    except Exception:
        pass

    app = CaptureApp(root)
    root.mainloop()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # pythonw로 실행하면 콘솔이 안 떠서 원인 확인이 어려울 수 있습니다.
        # 그래서 오류를 파일로 저장하고, 가능하면 메시지 박스로도 보여줍니다.
        log_path = os.path.join(os.path.dirname(__file__), "error_log.txt")
        try:
            with open(log_path, "w", encoding="utf-8") as f:
                f.write(traceback.format_exc())
        except Exception:
            pass

        try:
            import tkinter as tk
            from tkinter import messagebox

            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("오류", f"{e}\n\n자세한 내용: {log_path}")
            root.destroy()
        except Exception:
            pass

