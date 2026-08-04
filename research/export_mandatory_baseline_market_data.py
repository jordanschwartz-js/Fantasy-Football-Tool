"""Export pinned public market inputs for Fantasy GM Step 3.

The job contains no private league data. It exists only to move public GitHub
source files into a downloadable Actions artifact for an offline analysis run.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import pandas as pd
import requests

STATHEAD_COMMIT = "3429ab7adf5d8e90e7be54394d008d91ff8bd15d"
DYNASTYPROCESS_COMMIT = "9aa625f9a44e56ec7dc91c4d355d24c37a235fe1"
STATHEAD_RAW = f"https://raw.githubusercontent.com/dachhack/stathead/{STATHEAD_COMMIT}"
DYNASTYPROCESS_ECR_URL = (
    "https://raw.githubusercontent.com/dynastyprocess/data/"
    f"{DYNASTYPROCESS_COMMIT}/files/db_fpecr.parquet"
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def stable_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def download(url: str, destination: Path) -> dict[str, object]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".partial")
    headers = {"User-Agent": "fantasy-gm-public-research-export/0.1"}
    with requests.get(url, headers=headers, timeout=(30, 240), stream=True) as response:
        response.raise_for_status()
        with temporary.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)
        final_url = stable_url(response.url)
        status = response.status_code
        etag = response.headers.get("ETag")
        last_modified = response.headers.get("Last-Modified")
    if temporary.stat().st_size == 0:
        raise RuntimeError(f"Downloaded zero bytes from {url}")
    temporary.replace(destination)
    return {
        "source_url": stable_url(url),
        "final_url": final_url,
        "http_status": status,
        "etag": etag,
        "last_modified": last_modified,
        "bytes": destination.stat().st_size,
        "sha256": sha256_file(destination),
    }


def fetch_json(path: str) -> object:
    url = f"{STATHEAD_RAW}/{path}"
    headers = {"User-Agent": "fantasy-gm-public-research-export/0.1"}
    response = requests.get(url, headers=headers, timeout=(30, 240))
    response.raise_for_status()
    return response.json()


def dataframe_coverage(frame: pd.DataFrame, *, date_column: str | None = None) -> dict[str, object]:
    result: dict[str, object] = {
        "rows": int(len(frame)),
        "columns": list(frame.columns),
        "dtypes": {column: str(dtype) for column, dtype in frame.dtypes.items()},
        "null_counts": {column: int(value) for column, value in frame.isna().sum().items()},
    }
    if "season" in frame.columns:
        seasons = pd.to_numeric(frame["season"], errors="coerce").dropna().astype(int)
        if len(seasons):
            result["season_min"] = int(seasons.min())
            result["season_max"] = int(seasons.max())
            result["rows_by_season"] = {
                str(key): int(value)
                for key, value in seasons.value_counts().sort_index().items()
            }
    if date_column and date_column in frame.columns:
        dates = pd.to_datetime(frame[date_column], errors="coerce").dropna()
        if len(dates):
            result[f"{date_column}_min"] = dates.min().isoformat()
            result[f"{date_column}_max"] = dates.max().isoformat()
            result[f"rows_by_{date_column}_year"] = {
                str(key): int(value)
                for key, value in dates.dt.year.value_counts().sort_index().items()
            }
    return result


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True), encoding="utf-8")


def build_stathead_historical_adp() -> pd.DataFrame:
    profile = fetch_json("public/data/feature-store/profile.json")
    players = fetch_json("public/data/feature-store/players.json")
    if not isinstance(profile, dict) or not isinstance(players, dict):
        raise TypeError("StatHead feature-store files must be JSON objects")
    rows: list[dict[str, object]] = []
    for key, record in profile.items():
        if "::" not in key or not isinstance(record, dict):
            continue
        name_norm, season_text = key.rsplit("::", 1)
        try:
            season = int(season_text)
        except ValueError:
            continue
        info = players.get(key)
        if not isinstance(info, dict):
            info = {}
        rows.append(
            {
                "season": season,
                "name": info.get("displayName", name_norm),
                "name_norm": name_norm,
                "position": info.get("position"),
                "adp": record.get("adp"),
                "adp_round": record.get("adpRound"),
                "nfl_draft_pick": record.get("nflDraftPick"),
                "nfl_draft_round": record.get("nflDraftRound"),
                "age": record.get("age"),
                "years_in_league": record.get("yearsInLeague"),
            }
        )
    return pd.DataFrame(rows).sort_values(["season", "adp"], na_position="last").reset_index(drop=True)


def build_stathead_ffc_adp() -> tuple[pd.DataFrame, list[dict[str, object]]]:
    rows: list[dict[str, object]] = []
    sources: list[dict[str, object]] = []
    headers = {"User-Agent": "fantasy-gm-public-research-export/0.1"}
    for season in range(2018, 2027):
        path = f"public/data/ffc_adp_ppr_{season}.json"
        url = f"{STATHEAD_RAW}/{path}"
        response = requests.get(url, headers=headers, timeout=(30, 120))
        if response.status_code == 404:
            sources.append({"season": season, "status": "missing", "source_url": stable_url(url)})
            continue
        response.raise_for_status()
        payload = response.json()
        players = payload.get("players", []) if isinstance(payload, dict) else []
        for player in players:
            if isinstance(player, dict):
                rows.append({"season": season, **player})
        sources.append(
            {
                "season": season,
                "status": "downloaded",
                "source_url": stable_url(url),
                "rows": len(players),
                "sha256": hashlib.sha256(response.content).hexdigest(),
                "bytes": len(response.content),
            }
        )
    return pd.DataFrame(rows), sources


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    output_dir: Path = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest: list[dict[str, object]] = []

    adp = build_stathead_historical_adp()
    adp_path = output_dir / "stathead_historical_adp.csv"
    adp.to_csv(adp_path, index=False)
    write_json(output_dir / "stathead_historical_adp_coverage.json", dataframe_coverage(adp))
    manifest.append(
        {
            "dataset": "stathead_historical_adp",
            "source_commit": STATHEAD_COMMIT,
            "rows": int(len(adp)),
            "bytes": adp_path.stat().st_size,
            "sha256": sha256_file(adp_path),
        }
    )

    ffc, ffc_sources = build_stathead_ffc_adp()
    ffc_path = output_dir / "stathead_ffc_ppr_adp.csv"
    ffc.to_csv(ffc_path, index=False)
    write_json(output_dir / "stathead_ffc_ppr_adp_coverage.json", dataframe_coverage(ffc))
    pd.DataFrame(ffc_sources).to_csv(output_dir / "stathead_ffc_source_manifest.csv", index=False)
    manifest.append(
        {
            "dataset": "stathead_ffc_ppr_adp",
            "source_commit": STATHEAD_COMMIT,
            "rows": int(len(ffc)),
            "bytes": ffc_path.stat().st_size,
            "sha256": sha256_file(ffc_path),
        }
    )

    ecr_parquet = output_dir / "dynastyprocess_db_fpecr.parquet"
    ecr_source = download(DYNASTYPROCESS_ECR_URL, ecr_parquet)
    ecr = pd.read_parquet(ecr_parquet)
    ecr_csv = output_dir / "dynastyprocess_db_fpecr.csv.gz"
    ecr.to_csv(ecr_csv, index=False, compression="gzip")
    write_json(
        output_dir / "dynastyprocess_db_fpecr_coverage.json",
        dataframe_coverage(ecr, date_column="scrape_date"),
    )
    ecr.head(500).to_csv(output_dir / "dynastyprocess_db_fpecr_sample.csv", index=False)
    for column in ("ecr_type", "page_type", "position", "player_position_id"):
        if column in ecr.columns:
            ecr.groupby(column, dropna=False).size().rename("rows").reset_index().to_csv(
                output_dir / f"dynastyprocess_{column}_counts.csv", index=False
            )
    if "scrape_date" in ecr.columns:
        dates = pd.to_datetime(ecr["scrape_date"], errors="coerce")
        ecr.assign(scrape_year=dates.dt.year).groupby(
            ["scrape_year", "ecr_type"] if "ecr_type" in ecr.columns else ["scrape_year"],
            dropna=False,
        ).size().rename("rows").reset_index().to_csv(
            output_dir / "dynastyprocess_scrape_year_type_counts.csv", index=False
        )
    manifest.append(
        {
            "dataset": "dynastyprocess_db_fpecr_parquet",
            "source_commit": DYNASTYPROCESS_COMMIT,
            "rows": int(len(ecr)),
            **ecr_source,
        }
    )
    manifest.append(
        {
            "dataset": "dynastyprocess_db_fpecr_csv_gz",
            "source_commit": DYNASTYPROCESS_COMMIT,
            "rows": int(len(ecr)),
            "bytes": ecr_csv.stat().st_size,
            "sha256": sha256_file(ecr_csv),
        }
    )

    pd.DataFrame(manifest).to_csv(output_dir / "source_manifest.csv", index=False)
    write_json(
        output_dir / "export_metadata.json",
        {
            "stathead_commit": STATHEAD_COMMIT,
            "dynastyprocess_commit": DYNASTYPROCESS_COMMIT,
            "datasets": manifest,
        },
    )
    print(json.dumps({"output_dir": str(output_dir), "datasets": manifest}, indent=2))


if __name__ == "__main__":
    main()
