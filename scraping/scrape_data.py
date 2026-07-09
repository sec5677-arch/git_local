"""
공공데이터포털 데이터목록 페이지 스크래퍼

필요 패키지 설치:
    pip install requests beautifulsoup4

대상 URL:
    https://www.data.go.kr/tcs/dss/selectDataSetList.do
"""

import csv
import re
import sys
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

# 공공데이터포털 데이터목록 URL
URL = "https://www.data.go.kr/tcs/dss/selectDataSetList.do"

# 브라우저처럼 보이도록 User-Agent 설정 (차단 방지)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# 수집할 섹션: (HTML id, 화면에 표시할 이름)
SECTIONS = [
    ("fileDataList", "파일데이터"),
    ("apiDataList", "오픈 API"),
    ("stdDataList", "표준데이터셋"),
    ("linkedDataList", "연계데이터"),
]

# 콘솔 출력 시 내용 미리보기 최대 길이
CONTENT_PREVIEW_LEN = 200

# CSV 저장 경로 (스크립트와 같은 폴더)
CSV_OUTPUT = Path(__file__).resolve().parent / "datasets.csv"


def fetch_page() -> str:
    """데이터목록 첫 페이지 HTML을 가져옵니다."""
    params = {
        "dType": "TOTAL",
        "currentPage": "1",
        "perPage": "5",
        "sort": "updtDt",
    }
    response = requests.get(URL, params=params, headers=HEADERS, timeout=30)
    response.raise_for_status()
    response.encoding = "utf-8"
    return response.text


def _normalize_text(text: str) -> str:
    """여러 줄·공백을 하나로 정리합니다."""
    return re.sub(r"\s+", " ", text).strip()


def extract_title(li: Tag) -> str:
    """li 요소에서 데이터셋 제목을 추출합니다."""
    title_span = li.select_one("span.recent-title, span.std-title, span.linked-title")
    if not title_span:
        return ""

    # New / Update 뱃지(span.recent-ty)는 제목이 아니므로 제거
    for badge in title_span.select("span.recent-ty"):
        badge.decompose()

    return _normalize_text(title_span.get_text())


def extract_content(li: Tag) -> str:
    """li 요소에서 데이터 설명(내용)을 추출합니다."""
    desc = li.select_one("dd.publicDataDesc")
    if not desc:
        return ""

    # <br> 태그를 줄바꿈으로 바꾼 뒤 순수 텍스트만 추출
    for br in desc.find_all("br"):
        br.replace_with(NavigableString("\n"))

    lines = [line.strip() for line in desc.get_text().splitlines()]
    # 빈 줄 제거 후 한 줄로 합침
    return _normalize_text(" ".join(line for line in lines if line))


def extract_modified_date(li: Tag) -> str:
    """
    li 요소에서 수정일을 추출합니다.
    파일/API/표준은 span.recent-update-dt, 연계는 span.data 를 사용합니다.
    """
    info_data = li.select_one("div.info-data")
    if not info_data:
        return ""

    for row in info_data.select("p"):
        label = row.select_one("span.tit")
        if not label:
            continue
        if "수정일" not in label.get_text():
            continue
        # 라벨 다음 span이 수정일 값
        value_span = label.find_next_sibling("span")
        if value_span:
            return _normalize_text(value_span.get_text())

    return ""


def parse_item(li: Tag, category: str) -> dict:
    """li 한 개를 딕셔너리로 변환합니다."""
    return {
        "category": category,
        "title": extract_title(li),
        "content": extract_content(li),
        "modified_date": extract_modified_date(li),
    }


def scrape_all(html: str) -> list[dict]:
    """HTML에서 4개 섹션의 모든 항목을 수집합니다."""
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict] = []

    for section_id, category_name in SECTIONS:
        section = soup.find(id=section_id)
        if not section:
            continue

        result_list = section.select_one("div.result-list")
        if not result_list:
            continue

        for li in result_list.select("ul > li"):
            item = parse_item(li, category_name)
            if item["title"]:
                items.append(item)

    return items


def print_items(items: list[dict]) -> None:
    """수집 결과를 콘솔에 보기 좋게 출력합니다."""
    current_category: Optional[str] = None
    index_in_section = 0

    print("=" * 60)
    print(f"공공데이터포털 데이터목록 (총 {len(items)}건)")
    print("=" * 60)

    for item in items:
        if item["category"] != current_category:
            current_category = item["category"]
            index_in_section = 0
            print()
            print(f"--- {current_category} ---")

        index_in_section += 1
        print(f"\n[{current_category}] {index_in_section}. {item['title']}")
        print(f"  수정일: {item['modified_date'] or '(없음)'}")

        content = item["content"]
        if len(content) > CONTENT_PREVIEW_LEN:
            preview = content[:CONTENT_PREVIEW_LEN] + "..."
        else:
            preview = content or "(없음)"
        print(f"  내용: {preview}")

    print()
    print("=" * 60)


def save_to_csv(items: list[dict], filepath: Path = CSV_OUTPUT) -> None:
    """수집 결과를 CSV 파일로 저장합니다. (수정일, 제목, 내용 순)"""
    with filepath.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["수정일", "제목", "내용"])
        for item in items:
            writer.writerow([
                item["modified_date"],
                item["title"],
                item["content"],
            ])


def main() -> int:
    """메인 실행 함수"""
    # Windows 콘솔에서 한글이 깨지지 않도록 UTF-8 출력 설정
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    try:
        html = fetch_page()
        items = scrape_all(html)
    except requests.RequestException as exc:
        print(f"페이지 요청 실패: {exc}", file=sys.stderr)
        return 1

    if not items:
        print("수집된 항목이 없습니다.", file=sys.stderr)
        return 1

    print_items(items)
    save_to_csv(items)
    print(f"CSV 저장 완료: {CSV_OUTPUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
