"""Freeze public 2026 fantasy-football source files for Fantasy GM Step 6.

The exporter deliberately preserves raw bytes and metadata. Parsing and model
work happen after the artifact is downloaded into the private research lane.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

import pandas as pd
import requests

STATHEAD_COMMIT = "b29793b6776b30a0c8aba32aac5a607ae86a5b6d"
STATHEAD_BASE = f"https://raw.githubusercontent.com/dachhack/stathead/{STATHEAD_COMMIT}/"

STATHEAD_FILES: dict[str, bool] = {
    "public/data/projection-base-2026.json": True,
    "public/data/clay-projections-2026.json": False,
    "public/data/nfl-projections-fantasypros.json": False,
    "public/data/fantasypros-projections.json": False,
    "public/data/fantasypros-projections-2026.json": False,
    "public/data/pff-projections-2026.json": False,
    "public/data/fanduel-full-projections-2026.json": False,
    "public/data/fp-season-projections-2026.json": False,
    "public/data/fp-season-projections-2026-raw.json": False,
    "public/data/rotowire-2026.json": False,
    "public/data/espn-2026.json": True,
    "public/data/cbs-2026.json": True,
    "public/data/fftoday-2026.json": True,
    "public/data/fanduel-nfl-2026.json": False,
    "public/data/fft-season-projections-2026.json": False,
    "public/data/nfl-projections-2026.json": False,
    "public/data/fantasypros-2026.json": False,
    "public/data/clay-2026.json": False,
    "public/data/redraft-projections.json": False,
    "public/data/redraft-projections-presets.json": False,
    "public/data/redraft-adp-consensus.json": True,
    "public/data/fantasypros-adp.json": False,
    "public/data/redraft-adp.json": False,
    "public/data/ffc_adp_ppr_2026.json": True,
    "public/data/sleeper_adp_ppr_2026.json": True,
    "public/data/espn-depthcharts-snapshot.json": False,
    "public/data/espn-depthcharts-current.json": False,
    "public/data/depth-charts.json": False,
    "public/data/depth-chart-model.json": False,
    "public/data/depth-order-2026.json": False,
    "public/data/yahoo-player-projections.json": False,
    "public/data/feature-store/players.json": True,
    "public/data/feature-store/profile.json": False,
    "public/data/player-crosswalk.json": False,
    "public/data/sleeper-players-slim.json": False,
    "public/data/score-store/shares.json": False,
    "public/data/score-store/ppg.json": False,
    "public/data/score-store/adp.json": False,
    "src/generated/team-projections.json": False,
}

EXTERNAL_FILES: dict[str, tuple[str, bool, str]] = {
    "sleeper_players_nfl.json": (
        "https://api.sleeper.app/v1/players/nfl",
        True,
        "Sleeper public API",
    ),
    "nflverse_players.csv.gz": (
        "https://github.com/nflverse/nflverse-data/releases/download/players/players.csv.gz",
        True,
        "nflverse/nflverse-data players release",
    ),
    "nflverse_roster_2026.parquet": (
        "https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.parquet",
        False,
        "nflverse/nflverse-data rosters release",
    ),
}


def stable_url(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_name(path: str) -> str:
    return path.replace("/", "__")


def download(
    session: requests.Session,
    *,
    dataset: str,
    source_url: str,
    destination: Path,
    required: bool,
    source_family: str,
) -> dict[str, object]:
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".partial")
    record: dict[str, object] = {
        "dataset": dataset,
        "source_family": source_family,
        "required": required,
        "source_url": stable_url(source_url),
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        with session.get(source_url, timeout=(30, 240), stream=True) as response:
            record.update(
                {
                    "http_status": response.status_code,
                    "final_url": stable_url(response.url),
                    "etag": response.headers.get("ETag"),
                    "last_modified": response.headers.get("Last-Modified"),
                    "content_type": response.headers.get("Content-Type"),
                }
            )
            if response.status_code == 404 and not required:
                record.update({"status": "optional_missing", "bytes": 0, "sha256": ""})
                return record
            response.raise_for_status()
            with temporary.open("wb") as handle:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        handle.write(chunk)
        if not temporary.exists() or temporary.stat().st_size == 0:
            raise RuntimeError("downloaded zero bytes")
        temporary.replace(destination)
        record.update(
            {
                "status": "downloaded",
                "local_path": str(destination),
                "bytes": destination.stat().st_size,
                "sha256": sha256_file(destination),
            }
        )
        return record
    except Exception as exc:
        if temporary.exists():
            temporary.unlink()
        record.update({"status": "failed", "error": f"{type(exc).__name__}: {exc}", "bytes": 0, "sha256": ""})
        if required:
            raise
        return record


def validate_json_files(output_dir: Path, manifest: pd.DataFrame) -> pd.DataFrame:
    records: list[dict[str, object]] = []
    for row in manifest.itertuples(index=False):
        if row.status != "downloaded" or not str(row.local_path).endswith(".json"):
            continue
        path = Path(row.local_path)
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            shape = type(payload).__name__
            if isinstance(payload, dict):
                count = len(payload)
            elif isinstance(payload, list):
                count = len(payload)
            else:
                count = 1
            records.append({"dataset": row.dataset, "status": "PASS", "json_shape": shape, "top_level_count": count})
        except Exception as exc:
            records.append({"dataset": row.dataset, "status": "FAIL", "json_shape": "", "top_level_count": 0, "error": str(exc)})
    return pd.DataFrame(records)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()
    output_dir: Path = args.output_dir.resolve()
    raw_dir = output_dir / "raw"
    output_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.headers.update({"User-Agent": "fantasy-gm-step6-source-freezer/1.0"})
    records: list[dict[str, object]] = []

    for relative_path, required in STATHEAD_FILES.items():
        records.append(
            download(
                session,
                dataset=relative_path,
                source_url=STATHEAD_BASE + relative_path,
                destination=raw_dir / safe_name(relative_path),
                required=required,
                source_family="dachhack/stathead",
            )
        )

    for filename, (url, required, family) in EXTERNAL_FILES.items():
        records.append(
            download(
                session,
                dataset=filename,
                source_url=url,
                destination=raw_dir / filename,
                required=required,
                source_family=family,
            )
        )

    manifest = pd.DataFrame(records)
    manifest.to_csv(output_dir / "source_manifest.csv", index=False)
    validation = validate_json_files(output_dir, manifest)
    validation.to_csv(output_dir / "json_validation.csv", index=False)

    downloaded = manifest[manifest["status"] == "downloaded"]
    required_failed = manifest[(manifest["required"] == True) & (manifest["status"] != "downloaded")]
    invalid_json = validation[validation["status"] != "PASS"] if len(validation) else validation

    summary = {
        "snapshot_local_date": "2026-08-04",
        "snapshot_timezone": "America/Montreal",
        "stathead_commit": STATHEAD_COMMIT,
        "files_requested": int(len(manifest)),
        "files_downloaded": int(len(downloaded)),
        "optional_missing_or_failed": int(len(manifest) - len(downloaded)),
        "required_failures": int(len(required_failed)),
        "downloaded_bytes": int(downloaded["bytes"].sum()),
        "json_files_validated": int(len(validation)),
        "json_validation_failures": int(len(invalid_json)),
    }
    (output_dir / "snapshot_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (output_dir / "README.md").write_text(
        "# Step 6 frozen 2026 public inputs\n\n"
        f"StatHead commit: `{STATHEAD_COMMIT}`\n\n"
        "This artifact preserves raw public inputs, URLs, response metadata and SHA-256 values. "
        "It is a private research snapshot, not a redistribution grant.\n",
        encoding="utf-8",
    )

    if len(required_failed):
        raise SystemExit(f"Required source failures:\n{required_failed[['dataset','error']].to_string(index=False)}")
    if len(invalid_json):
        raise SystemExit(f"Invalid downloaded JSON:\n{invalid_json.to_string(index=False)}")

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
