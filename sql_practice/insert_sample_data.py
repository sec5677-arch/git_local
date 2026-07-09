"""
매출 집계 연습용 샘플 데이터 생성 및 SQLite 등록 스크립트
- 고객·제품 각 약 100건 (한국어 이름)
- 주문 약 1000건 (2023~2024년)
- 주문 합계 5,000~100,000원 (무작위)
- 주문 명세는 주문당 1~3건
"""

import random
import sqlite3
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

random.seed(42)

DB_PATH = Path(__file__).parent / "sql_practice.sqlite"

FAMILY_NAMES = [
    "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
    "한", "오", "서", "신", "권", "황", "안", "송", "류", "홍",
]
GIVEN_NAMES = [
    "민준", "서연", "지후", "하은", "도윤", "서윤", "예준", "지우",
    "시우", "수아", "준서", "지민", "현우", "예은", "건우", "채원",
    "우진", "다은", "선우", "유진", "태양", "소율", "민재", "나연",
    "승현", "가은", "재윤", "혜진", "동현", "아린",
]

CATEGORIES = ["전자제품", "의류", "식품", "생활용품", "도서", "스포츠", "뷰티", "가구"]

PRODUCT_PREFIX = [
    "프리미엄", "데일리", "오가닉", "클래식", "라이트", "슬림", "컴팩트",
    "스마트", "내추럴", "에코", "하이브리드", "울트라", "소프트", "굿모닝",
]
PRODUCT_CORE = [
    "무선 이어폰", "블루투스 스피커", "보조배터리", "USB 허브", "키보드",
    "기모 맨투맨", "린넨 셔츠", "운동화", "백팩", "양말 세트",
    "견과류 믹스", "그래놀라", "냉동 만두", "올리브오일", "인스턴트 커피",
    "수납 바구니", "디퓨저", "주방 세제", "멀티탭", "LED 스탠드",
    "경제학 입문", "파이썬 실습", "요가 매트", "덤벨 세트", "런닝화",
    "수분 크림", "선크림", "립밤", "책상", "의자", "선반",
]

CITIES = [
    "서울특별시 강남구", "서울특별시 마포구", "서울특별시 송파구",
    "부산광역시 해운대구", "대구광역시 수성구", "인천광역시 연수구",
    "광주광역시 북구", "대전광역시 유성구", "경기도 성남시", "경기도 수원시",
]

ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"]

# 명세 금액 = 수량 × 단가가 정확히 맞도록 원 단위 정수 단가 사용
PRODUCT_UNIT_PRICES = [
    1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
    6000, 7000, 8000, 9000, 10000, 12000, 15000, 18000, 20000, 25000,
]

def random_datetime(start: datetime, end: datetime) -> str:
    delta_sec = int((end - start).total_seconds())
    when = start + timedelta(seconds=random.randint(0, delta_sec))
    return when.strftime("%Y-%m-%d %H:%M:%S")


def make_unique_korean_names(count: int) -> list[str]:
    pool = [f"{f}{g}" for f in FAMILY_NAMES for g in GIVEN_NAMES]
    random.shuffle(pool)
    if count > len(pool):
        names = pool[:]
        for i in range(count - len(pool)):
            names.append(f"{random.choice(FAMILY_NAMES)}{random.choice(GIVEN_NAMES)}{i + 1}")
        return names[:count]
    return pool[:count]


def make_unique_product_names(count: int) -> list[str]:
    names: set[str] = set()
    while len(names) < count:
        names.add(f"{random.choice(PRODUCT_PREFIX)} {random.choice(PRODUCT_CORE)}")
    return list(names)


def build_order_lines_random(
    num_lines: int,
    products: list[tuple[int, Decimal]],
) -> list[tuple[int, int, Decimal, Decimal]]:
    """
    서로 다른 제품 1~3개를 골라 수량·단가로 명세 생성.
    line_amount = quantity × unit_price
    """
    chosen = random.sample(products, num_lines)
    lines: list[tuple[int, int, Decimal, Decimal]] = []
    for pid, price in chosen:
        qty = random.randint(1, 10)
        line_amt = Decimal(qty) * price
        lines.append((pid, qty, price, line_amt))
    return lines


def generate_customers(count: int) -> list[dict]:
    names = make_unique_korean_names(count)
    rows = []
    for i, name in enumerate(names, start=1):
        rows.append(
            {
                "customer_name": name,
                "email": f"customer{i:03d}@sample.kr",
                "phone": f"010-{random.randint(1000, 9999):04d}-{random.randint(1000, 9999):04d}",
                "address": f"{random.choice(CITIES)} {random.randint(1, 120)}로 {random.randint(1, 50)}",
                "created_at": random_datetime(datetime(2022, 1, 1), datetime(2024, 6, 30)),
            }
        )
    return rows


def generate_products(count: int) -> list[dict]:
    names = make_unique_product_names(count)
    rows = []
    for name in names:
        rows.append(
            {
                "product_name": name,
                "category": random.choice(CATEGORIES),
                "unit_price": float(random.choice(PRODUCT_UNIT_PRICES)),
                "stock_qty": random.randint(10, 500),
                "created_at": random_datetime(datetime(2022, 1, 1), datetime(2024, 1, 1)),
            }
        )
    return rows


def generate_orders(
    order_count: int,
    customer_ids: list[int],
    products: list[tuple[int, Decimal]],
) -> list[dict]:
    """주문 + 명세를 한 번에 생성 (orders 항목에 'lines' 포함)"""
    order_start = datetime(2023, 1, 1)
    order_end = datetime(2024, 12, 31, 23, 59, 59)
    orders: list[dict] = []
    attempts = 0
    max_attempts = order_count * 50

    while len(orders) < order_count and attempts < max_attempts:
        attempts += 1
        num_lines = random.randint(1, 3)
        lines = build_order_lines_random(num_lines, products)
        total_amount = sum(line[3] for line in lines)
        total_int = int(total_amount)

        # 요구 범위: 5,000 ~ 100,000원 (명세 합계 = 주문 합계)
        if total_int < 5000 or total_int > 100000:
            continue

        orders.append(
            {
                "customer_id": random.choice(customer_ids),
                "order_date": random_datetime(order_start, order_end),
                "order_status": random.choice(ORDER_STATUSES),
                "total_amount": float(total_int),
                "lines": lines,
            }
        )

    if len(orders) < order_count:
        raise RuntimeError(
            f"주문 생성 실패: 목표 {order_count}건 중 {len(orders)}건만 생성됨"
        )
    return orders


def insert_data(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    cur.executescript(
        """
        DELETE FROM order_details;
        DELETE FROM orders;
        DELETE FROM products;
        DELETE FROM customers;
        """
    )

    cur.executemany(
        """
        INSERT INTO customers (customer_name, email, phone, address, created_at)
        VALUES (:customer_name, :email, :phone, :address, :created_at)
        """,
        generate_customers(100),
    )

    cur.executemany(
        """
        INSERT INTO products (product_name, category, unit_price, stock_qty, created_at)
        VALUES (:product_name, :category, :unit_price, :stock_qty, :created_at)
        """,
        generate_products(100),
    )

    customer_ids = [r[0] for r in cur.execute("SELECT customer_id FROM customers")]
    product_rows = [
        (r[0], Decimal(str(r[1])))
        for r in cur.execute("SELECT product_id, unit_price FROM products")
    ]

    orders = generate_orders(1000, customer_ids, product_rows)
    detail_rows: list[dict] = []

    for order in orders:
        lines = order.pop("lines")
        cur.execute(
            """
            INSERT INTO orders (customer_id, order_date, order_status, total_amount)
            VALUES (:customer_id, :order_date, :order_status, :total_amount)
            """,
            order,
        )
        order_id = cur.lastrowid
        for product_id, quantity, unit_price, line_amount in lines:
            detail_rows.append(
                {
                    "order_id": order_id,
                    "product_id": product_id,
                    "quantity": quantity,
                    "unit_price": float(unit_price),
                    "line_amount": float(line_amount),
                }
            )

    cur.executemany(
        """
        INSERT INTO order_details (order_id, product_id, quantity, unit_price, line_amount)
        VALUES (:order_id, :product_id, :quantity, :unit_price, :line_amount)
        """,
        detail_rows,
    )
    conn.commit()


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        insert_data(conn)
        cur = conn.cursor()
        for table in ("customers", "products", "orders", "order_details"):
            print(f"{table}: {cur.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]}건")

        mismatch = cur.execute(
            """
            SELECT COUNT(*)
            FROM orders o
            WHERE o.total_amount != (
                SELECT COALESCE(SUM(line_amount), 0)
                FROM order_details od WHERE od.order_id = o.order_id
            )
            """
        ).fetchone()[0]
        print(f"합계 불일치 주문: {mismatch}건")

        lo, hi = cur.execute(
            "SELECT MIN(total_amount), MAX(total_amount) FROM orders"
        ).fetchone()
        print(f"주문 합계 범위: {lo} ~ {hi}원")

        dmin, dmax = cur.execute(
            "SELECT MIN(order_date), MAX(order_date) FROM orders"
        ).fetchone()
        print(f"주문 일자 범위: {dmin} ~ {dmax}")

        avg_lines = cur.execute(
            """
            SELECT AVG(cnt) FROM (
                SELECT COUNT(*) AS cnt FROM order_details GROUP BY order_id
            )
            """
        ).fetchone()[0]
        print(f"주문당 평균 명세 건수: {avg_lines:.2f}건")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
