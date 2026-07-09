-- ============================================================
-- SQL 연습용 테이블 생성 스크립트
-- 관계: 고객(1) ──< 주문(N) ──< 주문상세(N) >── 제품(1)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 고객 테이블 (customers)
--    주문을 하는 사람의 기본 정보를 저장합니다.
-- ------------------------------------------------------------
CREATE TABLE customers (
    customer_id   INTEGER      PRIMARY KEY AUTOINCREMENT,  -- 고객 고유 번호
    customer_name VARCHAR(100) NOT NULL,                   -- 고객 이름
    email         VARCHAR(255) UNIQUE,                     -- 이메일 (중복 불가)
    phone         VARCHAR(20),                             -- 연락처
    address       VARCHAR(500),                            -- 배송/청구 주소
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP   -- 가입(등록) 일시
);

-- ------------------------------------------------------------
-- 2. 제품 테이블 (products)
--    판매하는 상품 정보를 저장합니다.
-- ------------------------------------------------------------
CREATE TABLE products (
    product_id    INTEGER        PRIMARY KEY AUTOINCREMENT,  -- 제품 고유 번호
    product_name  VARCHAR(200)   NOT NULL,                   -- 제품명
    category      VARCHAR(50),                                 -- 카테고리 (예: 전자제품, 의류)
    unit_price    DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),  -- 단가
    stock_qty     INTEGER        NOT NULL DEFAULT 0
        CHECK (stock_qty >= 0),                                -- 재고 수량
    created_at    DATETIME       DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. 주문 테이블 (orders)
--    고객이 한 번에 결제한 주문 단위를 저장합니다.
--    (한 주문에 여러 제품이 들어갈 수 있음 → 주문 상세 테이블로 분리)
-- ------------------------------------------------------------
CREATE TABLE orders (
    order_id      INTEGER        PRIMARY KEY AUTOINCREMENT,  -- 주문 고유 번호
    customer_id   INTEGER        NOT NULL,                   -- 주문한 고객
    order_date    DATETIME       DEFAULT CURRENT_TIMESTAMP,  -- 주문 일시
    order_status  VARCHAR(20)    NOT NULL DEFAULT 'pending'
        CHECK (order_status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    total_amount  DECIMAL(12, 2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),                             -- 주문 총액
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- ------------------------------------------------------------
-- 4. 주문 상세 테이블 (order_details)
--    하나의 주문에 포함된 각 제품(품목)별 수량·가격을 저장합니다.
--    주문 시점의 단가(unit_price)를 저장해, 이후 제품 가격이 바뀌어도
--    과거 주문 금액을 그대로 추적할 수 있습니다.
-- ------------------------------------------------------------
CREATE TABLE order_details (
    order_detail_id INTEGER        PRIMARY KEY AUTOINCREMENT,  -- 주문 상세 고유 번호
    order_id        INTEGER        NOT NULL,                   -- 어떤 주문에 속하는지
    product_id      INTEGER        NOT NULL,                   -- 어떤 제품인지
    quantity        INTEGER        NOT NULL CHECK (quantity > 0),  -- 주문 수량
    unit_price      DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),  -- 주문 당시 단가
    line_amount     DECIMAL(12, 2) NOT NULL CHECK (line_amount >= 0),   -- 행 금액 (수량 × 단가)
    FOREIGN KEY (order_id)   REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    -- 같은 주문에 동일 제품이 두 번 들어가지 않도록 제한 (선택)
    UNIQUE (order_id, product_id)
);

-- 조회 성능을 위한 인덱스 (선택 사항)
CREATE INDEX idx_orders_customer_id      ON orders(customer_id);
CREATE INDEX idx_orders_order_date         ON orders(order_date);
CREATE INDEX idx_order_details_order_id    ON order_details(order_id);
CREATE INDEX idx_order_details_product_id  ON order_details(product_id);
