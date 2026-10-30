"""Import the owner-approved batch004 locality sheet and its linked rate rows.

The importer reads the workbook as supplied. It does not verify, normalize, or
recalculate tax rates. Rows marked as unavailable for site use are not imported
as rate records. All original place fields and selected rate rows are retained.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkg": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def column_name(cell_ref: str) -> str:
    match = re.match(r"[A-Z]+", cell_ref)
    if not match:
        raise ValueError(f"Invalid cell reference: {cell_ref}")
    return match.group(0)


def workbook_sheets(archive: zipfile.ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
    result: dict[str, str] = {}
    sheets_node = workbook.find("main:sheets", NS)
    for sheet in sheets_node if sheets_node is not None else []:
        target = targets[sheet.attrib[f"{{{NS['rel']}}}id"]].lstrip("/")
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        result[sheet.attrib["name"]] = target
    return result


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [
        "".join(text.text or "" for text in item.findall(".//main:t", NS))
        for item in root.findall("main:si", NS)
    ]


def read_sheet(archive: zipfile.ZipFile, path: str, strings: list[str]) -> list[dict[str, str]]:
    root = ET.fromstring(archive.read(path))
    rows = root.findall(".//main:sheetData/main:row", NS)
    if not rows:
        return []

    def cell_value(cell: ET.Element) -> str:
        inline = cell.find("main:is", NS)
        if inline is not None:
            return "".join(text.text or "" for text in inline.findall(".//main:t", NS))
        value = cell.find("main:v", NS)
        if value is None or value.text is None:
            return ""
        if cell.attrib.get("t") == "s":
            return strings[int(value.text)]
        return value.text

    header_cells = {
        column_name(cell.attrib["r"]): cell_value(cell)
        for cell in rows[0].findall("main:c", NS)
    }
    headers = {column: text for column, text in header_cells.items() if text}
    records: list[dict[str, str]] = []
    for row in rows[1:]:
        cells = {
            column_name(cell.attrib["r"]): cell_value(cell)
            for cell in row.findall("main:c", NS)
        }
        record = {header: cells.get(column, "") for column, header in headers.items()}
        if any(record.values()):
            records.append(record)
    return records


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    workbook = args.workbook.resolve(strict=True)

    with zipfile.ZipFile(workbook) as archive:
        sheets = workbook_sheets(archive)
        publication_sheet = "Готові до публікації"
        missing = [name for name in (publication_sheet,) if name not in sheets]
        if missing:
            raise SystemExit(f"Missing required workbook sheets: {', '.join(missing)}")
        strings = shared_strings(archive)
        places = read_sheet(archive, sheets[publication_sheet], strings)

    if len(places) != 1970:
        raise SystemExit(f"Expected 1970 publication rows, found {len(places)}")
    if not places or "КАТОТТГ поселення" not in places[0]:
        raise SystemExit("Publication sheet does not have the expected locality header")

    code_counts: dict[str, int] = {}
    url_counts: dict[str, int] = {}
    for row in places:
        code = row.get("КАТОТТГ поселення", "").strip()
        if code:
            code_counts[code] = code_counts.get(code, 0) + 1
        for url in re.findall(r"/tourist-tax/[a-z0-9-]+/?", row.get("URL сторінок VDALO", "")):
            url_counts[url.rstrip("/") + "/"] = url_counts.get(url.rstrip("/") + "/", 0) + 1

    duplicate_codes = sorted(code for code, count in code_counts.items() if count > 1)
    duplicate_urls = sorted(url for url, count in url_counts.items() if count > 1)
    missing_codes = [index for index, row in enumerate(places, start=2) if not row.get("КАТОТТГ поселення", "").strip()]
    if duplicate_codes or missing_codes:
        raise SystemExit(
            f"Publication sheet identity check failed: duplicate_codes={len(duplicate_codes)}, "
            f"missing_codes={len(missing_codes)}"
        )

    enriched_places = []
    for row in places:
        has_rate_text = bool(row.get("Ставки 2026 з VDALO (коротко)", "").strip())
        enriched_places.append({
            "source": row,
            "publicationEligible": has_rate_text,
            "excludedReason": "Порожнє поле ставки для цієї локації" if not has_rate_text else None,
        })

    rows_with_inline_rate = sum(bool(row.get("Ставки 2026 з VDALO (коротко)", "").strip()) for row in places)
    excluded_without_rate = len(enriched_places) - rows_with_inline_rate
    page_status_counts: dict[str, int] = {}
    data_status_counts: dict[str, int] = {}
    for row in places:
        key = row.get("Статус сторінки на сайті (перевірено 30.10.2026)", "") or "(порожньо)"
        page_status_counts[key] = page_status_counts.get(key, 0) + 1
        key = row.get("Статус даних для сайту", "") or "(порожньо)"
        data_status_counts[key] = data_status_counts.get(key, 0) + 1

    payload = {
        "schemaVersion": 1,
        "sourceWorkbook": {
            "name": workbook.name,
            "sha256": hashlib.sha256(workbook.read_bytes()).hexdigest(),
            "publicationSheet": publication_sheet,
            "selectionRule": "Only publication-sheet rows with a non-empty locality-level rate field are marked publicationEligible; rates and statuses are not normalized.",
        },
        "audit": {
            "publicationRows": len(places),
            "uniqueSettlementCodes": len(code_counts),
            "publicationEligibleRowsWithRateText": rows_with_inline_rate,
            "existingPublishedRowsWithRateText": page_status_counts.get("ВЖЕ ОПУБЛІКОВАНО · є в реєстрі ставок", 0),
            "newRowsWithRateText": page_status_counts.get("НЕ ЗНАЙДЕНО У РЕЄСТРІ 48 ЛОКАЦІЙ · перевірити перед створенням", 0) - excluded_without_rate,
            "withheldRowsWithEmptyRateText": excluded_without_rate,
            "duplicateExistingUrlsInSource": duplicate_urls,
            "dataStatusCounts": data_status_counts,
            "sitePageStatusCounts": page_status_counts,
            "inlineRateTextRows": rows_with_inline_rate,
        },
        "places": enriched_places,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), **payload["audit"], "workbookSha256": payload["sourceWorkbook"]["sha256"]}, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
