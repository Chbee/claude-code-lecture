from flask import Flask, render_template, request, jsonify
import pandas as pd
import io
import re
import pdfplumber

app = Flask(__name__)

COLUMN_ALIASES = {
    "date":     ["이용일자", "거래일자", "날짜", "transaction_date", "date", "이용일", "거래일", "승인일자"],
    "merchant": ["이용가맹점", "가맹점명", "가맹점", "상호명", "merchant", "상점명", "이용처", "거래처"],
    "amount":   ["이용금액", "거래금액", "금액", "amount", "결제금액", "승인금액", "이용대금"],
    "category": ["업종", "카테고리", "category", "분류", "업종명", "이용구분"],
}

SKIP_KEYWORDS = {"소계", "합계", "전체합계", "이용기간", "이용가맹점", "이용금액", "결제하실",
                 "COPYRIGHT", "file://", "고객센터", "하나카드(주)", "사업자번호", "광고성",
                 "본 이용대금", "이용 금액", "이용 혜택", "PM ", "AM "}
# 단어 경계로 매칭 (e.g. SUBSCRIPTION 안의 AUD 오탐 방지)
_CURRENCY_RE = re.compile(
    r"\b(USD|TWD|EUR|JPY|GBP|CNY|HKD|SGD|AUD|CAD|THB|VND)\b"
)


def detect_column(columns, aliases):
    for col in columns:
        if col.strip() in aliases:
            return col.strip()
    return None


def parse_amount(val):
    if pd.isna(val):
        return 0
    cleaned = re.sub(r"[^\d]", "", str(val))
    return int(cleaned) if cleaned else 0


def analyze(df):
    df.columns = [c.strip() for c in df.columns]
    col_map = {key: detect_column(df.columns, aliases) for key, aliases in COLUMN_ALIASES.items()}

    if not col_map["date"] or not col_map["amount"]:
        return {"error": f"날짜 또는 금액 컬럼을 찾을 수 없습니다. 감지된 컬럼: {list(df.columns)}"}

    df["_amount"] = df[col_map["amount"]].apply(parse_amount)
    df = df[df["_amount"] > 0]
    df["_date"] = pd.to_datetime(df[col_map["date"]], errors="coerce")
    df = df.dropna(subset=["_date"])
    df["_month"] = df["_date"].dt.strftime("%Y-%m")

    total = int(df["_amount"].sum())
    count = len(df)
    monthly = df.groupby("_month")["_amount"].sum().sort_index()
    monthly_data = {"labels": list(monthly.index), "values": [int(v) for v in monthly.values]}

    category_data = None
    if col_map["category"]:
        cat = df.groupby(col_map["category"])["_amount"].sum().sort_values(ascending=False)
        category_data = {"labels": list(cat.index), "values": [int(v) for v in cat.values]}

    top_merchants = []
    if col_map["merchant"]:
        merch = df.groupby(col_map["merchant"])["_amount"].sum().sort_values(ascending=False).head(10)
        top_merchants = [{"name": k, "amount": int(v)} for k, v in merch.items()]

    recent_cols = [c for c in [col_map["date"], col_map["merchant"], col_map["amount"], col_map["category"]] if c]
    transactions = df.sort_values("_date", ascending=False).head(20)[recent_cols].to_dict(orient="records")

    return {
        "total": total, "count": count,
        "monthly": monthly_data, "category": category_data,
        "top_merchants": top_merchants, "transactions": transactions,
        "columns": col_map,
    }


# ── PDF 파싱 ─────────────────────────────────────────────────────────────────

def _extract_year(text):
    """PDF 텍스트에서 이용연도 추출."""
    m = re.search(r"(\d{4})\.\s*\d{2}\.\s*\d{2}\s*~", text)
    if m:
        return m.group(1)
    m = re.search(r"(\d{4})[.\-/]\d{2}[.\-/]\d{2}", text)
    if m:
        return m.group(1)
    from datetime import datetime
    return str(datetime.now().year)


def _is_skip_line(line):
    return any(kw in line for kw in SKIP_KEYWORDS) or bool(_CURRENCY_RE.search(line))


def parse_pdf_text(file_bytes):
    """
    하나카드처럼 거래 내역이 텍스트 줄로 구성된 PDF 파싱.
    패턴: MM/DD  가맹점명  금액
    가맹점명이 길면 앞/뒤 줄에 넘침.
    """
    # date + optional_merchant + amount (amount = 마지막 숫자 그룹)
    tx_re = re.compile(r"^(\d{2}/\d{2})\s*(.*?)\s*([-]?\d[\d,]*)$")

    all_lines = []
    full_text = ""

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            full_text += text + "\n"
            all_lines.extend(text.splitlines())

    year = _extract_year(full_text)
    lines = [l.strip() for l in all_lines if l.strip()]

    used = set()
    rows = []

    for i, line in enumerate(lines):
        if i in used or _is_skip_line(line):
            continue

        m = tx_re.match(line)
        if not m:
            continue

        date_str, mid, amount_str = m.groups()
        amount = int(amount_str.replace(",", ""))
        if amount <= 0:
            continue

        merchant = mid.strip()

        # 가맹점명이 없으면 앞/뒤 줄에서 보충 (줄 넘침 케이스)
        if not merchant:
            parts = []
            if i > 0 and (i - 1) not in used:
                prev = lines[i - 1]
                if not tx_re.match(prev) and not _is_skip_line(prev):
                    parts.insert(0, prev)
                    used.add(i - 1)
            if i + 1 < len(lines) and (i + 1) not in used:
                nxt = lines[i + 1]
                if not tx_re.match(nxt) and not _is_skip_line(nxt):
                    parts.append(nxt)
                    used.add(i + 1)
            merchant = "".join(parts).strip() or "알 수 없음"

        # 가맹점명 끝에 동일 금액이 붙어있으면 제거 (e.g. "교통-지하철048건 65,550")
        merchant = re.sub(rf"\s+{re.escape(amount_str)}\s*$", "", merchant).strip()

        used.add(i)
        rows.append({
            "이용일자": f"{year}/{date_str}",
            "이용가맹점": merchant,
            "이용금액": amount,
        })

    if not rows:
        return None, None
    return pd.DataFrame(rows), None


def parse_pdf_tables(file_bytes):
    """표가 있는 PDF에서 테이블 추출 시도."""
    all_rows = []
    headers = None

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            for table in (page.extract_tables() or []):
                if not table:
                    continue
                candidate = [str(c).strip() if c else "" for c in table[0]]
                is_header = any(
                    alias in candidate
                    for aliases in COLUMN_ALIASES.values()
                    for alias in aliases
                )
                if is_header and headers is None:
                    headers = candidate
                    data_rows = table[1:]
                else:
                    data_rows = table

                for row in data_rows:
                    cleaned = [str(c).strip() if c else "" for c in row]
                    if any(cleaned):
                        all_rows.append(cleaned)

    if not all_rows or headers is None:
        return None, None

    if len(headers) == len(all_rows[0]):
        df = pd.DataFrame(all_rows, columns=headers)
        df = df.replace("", pd.NA).dropna(how="all")
        return df, None
    return None, None


def parse_pdf(file_bytes):
    # 1) 표 기반 파싱 시도
    df, _ = parse_pdf_tables(file_bytes)
    if df is not None:
        return df, None

    # 2) 텍스트 기반 파싱 (하나카드 등)
    df, _ = parse_pdf_text(file_bytes)
    if df is not None:
        return df, None

    return None, "PDF에서 거래 내역을 추출할 수 없습니다. 스캔 이미지 PDF는 지원되지 않습니다."


# ── Flask 라우트 ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "파일이 없습니다."}), 400

    filename = file.filename.lower()
    raw = file.read()

    try:
        if filename.endswith(".pdf"):
            df, err = parse_pdf(raw)
            if err:
                return jsonify({"error": err}), 400
        elif filename.endswith(".csv"):
            encoding = request.form.get("encoding", "utf-8-sig")
            try:
                content = raw.decode(encoding)
            except UnicodeDecodeError:
                return jsonify({"error": "인코딩 오류입니다. EUC-KR 또는 UTF-8을 선택해주세요."}), 400
            df = pd.read_csv(io.StringIO(content))
        else:
            return jsonify({"error": "CSV 또는 PDF 파일만 지원합니다."}), 400

        result = analyze(df)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5050)
