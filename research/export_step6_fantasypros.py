"""Freeze current FantasyPros half-PPR VBD projections and Yahoo ADP.

The script saves raw HTML and a normalized table. It does not crawl linked pages
or republish article text; it captures the structured player tables needed for
private draft research.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests

PAGES = {
    "fantasypros_half_ppr_vbd": "https://www.fantasypros.com/nfl/rankings/half-ppr-vbd.php",
    "fantasypros_half_ppr_adp": "https://www.fantasypros.com/nfl/adp/half-point-ppr-overall.php",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def flatten_columns(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    if isinstance(result.columns, pd.MultiIndex):
        result.columns = [
            "_".join(str(part) for part in column if str(part) != "nan").strip("_")
            for column in result.columns
        ]
    else:
        result.columns = [str(column) for column in result.columns]
    return result


def select_table(tables: list[pd.DataFrame], required_tokens: tuple[str, ...]) -> pd.DataFrame:
    for table in tables:
        flattened = flatten_columns(table)
        columns = " ".join(flattened.columns).lower()
        if all(token.lower() in columns for token in required_tokens):
            return flattened
    raise RuntimeError(
        f"No table matched {required_tokens}. Available columns: "
        + repr([list(flatten_columns(table).columns) for table in tables])
    )


def clean_player(value: object) -> tuple[str, str]:
    text = re.sub(r"\s+", " ", str(value)).strip()
    # The visible table commonly ends with TEAM (BYE). Keep a conservative
    # parser and retain the unparsed field in the raw table as well.
    match = re.match(r"^(.*?)\s+([A-Z]{2,3})\s*\(\d+\)\s*$", text)
    if match:
        return match.group(1).strip(), match.group(2)
    match = re.match(r"^(.*?)\s+\(([A-Z]{2,3})\)\s*$", text)
    if match:
        return match.group(1).strip(), match.group(2)
    return text, ""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (compatible; FantasyGMResearch/1.0; private draft analysis)",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    manifest: list[dict[str, object]] = []

    for dataset, url in PAGES.items():
        response = session.get(url, timeout=(30, 120))
        response.raise_for_status()
        html_path = output_dir / f"{dataset}.html"
        html_path.write_bytes(response.content)
        tables = pd.read_html(io.StringIO(response.text))
        if dataset.endswith("vbd"):
            frame = select_table(tables, ("player", "vbd", "vorp"))
        else:
            frame = select_table(tables, ("player", "yahoo", "avg"))
        frame.to_csv(output_dir / f"{dataset}_raw_table.csv", index=False)

        normalized = frame.copy()
        player_col = next(column for column in normalized.columns if "player" in column.lower())
        parsed = normalized[player_col].map(clean_player)
        normalized.insert(0, "player_name", [item[0] for item in parsed])
        normalized.insert(1, "team", [item[1] for item in parsed])
        normalized.to_csv(output_dir / f"{dataset}.csv", index=False)
        manifest.append(
            {
                "dataset": dataset,
                "url": url,
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "http_status": response.status_code,
                "etag": response.headers.get("ETag"),
                "last_modified": response.headers.get("Last-Modified"),
                "html_bytes": html_path.stat().st_size,
                "html_sha256": sha256(html_path),
                "rows": len(normalized),
                "columns": json.dumps(list(normalized.columns)),
                "csv_sha256": sha256(output_dir / f"{dataset}.csv"),
            }
        )

    pd.DataFrame(manifest).to_csv(output_dir / "fantasypros_manifest.csv", index=False)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
