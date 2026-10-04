"""
run.py — คำสั่งเดียวสำหรับรันทั้งโปรเจกต์ (ติดตั้ง Python deps + เทรนโมเดล + build หน้าเว็บ React + เปิดเว็บ)

วิธีใช้:
    python run.py

ทำอัตโนมัติตามลำดับ:
    0) ติดตั้ง Python package ที่ยังขาด (`pip install -r requirements.txt`)
       — เช็คจาก requirements.txt โดยตรง ข้ามให้ถ้าติดตั้งครบแล้ว
    1) เทรนโมเดล stroke + โมเดลโรคหัวใจ (`python train_model.py` และ `python train_heart_model.py`)
       — ถ้ายังไม่มี model/model.pkl หรือ model/heart/knn_model.pkl ตามลำดับ
    2) ติดตั้ง node_modules + build หน้าเว็บ React (`npm install && npm run build`
       ในโฟลเดอร์ stroke-risk-react/) — ถ้ายังไม่เคย build (ยังไม่มี dist/index.html)
    3) เปิด Flask (`python app.py`) ที่ http://localhost:5000
       (หน้าแรกจะเป็นหน้าเว็บ React ที่ build แล้ว, เข้าหน้า vanilla JS เดิมได้ที่ /classic)

ตัวเลือกเสริม:
    python run.py --retrain            บังคับเทรนโมเดลใหม่ แม้จะมีอยู่แล้ว
    python run.py --rebuild-frontend   บังคับ build หน้าเว็บ React ใหม่ แม้จะมีอยู่แล้ว
    (ใช้ตอนแก้โค้ด train_model.py หรือแก้โค้ดใน stroke-risk-react/src/ แล้วอยากเห็นผลล่าสุด)
"""
import importlib.util
import re
import shutil
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
REACT_DIR = BASE_DIR / "stroke-risk-react"
REQUIREMENTS_FILE = BASE_DIR / "requirements.txt"
MODEL_PKL = BASE_DIR / "model" / "model.pkl"
HEART_MODEL_PKL = BASE_DIR / "model" / "heart" / "knn_model.pkl"
REACT_DIST_INDEX = REACT_DIR / "dist" / "index.html"
REACT_NODE_MODULES = REACT_DIR / "node_modules"

# แม็ปชื่อ pip package (ใน requirements.txt) -> ชื่อโมดูลที่ import จริง เวลาต่างกัน
PIP_NAME_TO_IMPORT_NAME = {
    "flask": "flask",
    "pandas": "pandas",
    "scikit-learn": "sklearn",
    "joblib": "joblib",
    "numpy": "numpy",
}


def run_step(title: str, cmd: list, cwd: Path) -> None:
    print(f"\n=== {title} ===")
    print(f"$ {' '.join(cmd)}   (ที่ {cwd})")
    result = subprocess.run(cmd, cwd=cwd)
    if result.returncode != 0:
        print(f"\n✗ ขั้นตอน '{title}' ล้มเหลว (exit code {result.returncode})")
        sys.exit(result.returncode)


def find_npm() -> str:
    npm = shutil.which("npm")
    if npm is None:
        print(
            "✗ ไม่พบคำสั่ง `npm` — กรุณาติดตั้ง Node.js ก่อน (https://nodejs.org) "
            "แล้วรัน `python run.py` ใหม่อีกครั้ง"
        )
        sys.exit(1)
    return npm


def missing_python_packages() -> list:
    """เช็คว่า package แต่ละบรรทัดใน requirements.txt import ได้จริงไหมในตัวไพทอนปัจจุบัน
    (ตัวเดียวกับที่ `python run.py` ถูกเรียก รวมถึงกรณีอยู่ใน venv ที่เพิ่งสร้างใหม่)"""
    if not REQUIREMENTS_FILE.exists():
        return []
    missing = []
    for line in REQUIREMENTS_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        pip_name = re.split(r"[><=!~\[;]", line)[0].strip()
        import_name = PIP_NAME_TO_IMPORT_NAME.get(pip_name.lower(), pip_name.lower().replace("-", "_"))
        if importlib.util.find_spec(import_name) is None:
            missing.append(pip_name)
    return missing


def main() -> None:
    force_retrain = "--retrain" in sys.argv
    force_rebuild_frontend = "--rebuild-frontend" in sys.argv

    # 0) ติดตั้ง Python package ที่ยังขาด (เช่น venv ที่เพิ่งสร้างใหม่ ยังไม่เคย pip install)
    missing = missing_python_packages()
    if missing:
        print(f"พบ Python package ที่ยังไม่ได้ติดตั้ง: {', '.join(missing)}")
        run_step(
            "ติดตั้ง Python dependencies (pip install -r requirements.txt)",
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            BASE_DIR,
        )
    else:
        print("✓ Python dependencies ครบแล้ว (ตรวจจาก requirements.txt) — ข้ามขั้นตอนติดตั้ง")

    # 1) เทรนโมเดล ถ้ายังไม่มี (หรือถูกสั่งบังคับด้วย --retrain)
    if force_retrain or not MODEL_PKL.exists():
        run_step("เทรนโมเดล stroke (train_model.py)", [sys.executable, "train_model.py"], BASE_DIR)
    else:
        print(f"✓ พบโมเดล stroke อยู่แล้วที่ {MODEL_PKL} — ข้ามขั้นตอนเทรน (ใช้ --retrain เพื่อบังคับเทรนใหม่)")

    # 1b) เทรนโมเดลโรคหัวใจ ถ้ายังไม่มี (หรือถูกสั่งบังคับด้วย --retrain)
    if force_retrain or not HEART_MODEL_PKL.exists():
        run_step("เทรนโมเดลโรคหัวใจ (train_heart_model.py)", [sys.executable, "train_heart_model.py"], BASE_DIR)
    else:
        print(f"✓ พบโมเดลโรคหัวใจอยู่แล้วที่ {HEART_MODEL_PKL} — ข้ามขั้นตอนเทรน")

    # 2) npm install + build หน้าเว็บ React ถ้ายังไม่เคย build (หรือถูกสั่งบังคับด้วย --rebuild-frontend)
    if force_rebuild_frontend or not REACT_DIST_INDEX.exists():
        npm = find_npm()
        if force_rebuild_frontend or not REACT_NODE_MODULES.exists():
            run_step("ติดตั้ง dependencies ของหน้าเว็บ React (npm install)", [npm, "install"], REACT_DIR)
        run_step("Build หน้าเว็บ React (npm run build)", [npm, "run", "build"], REACT_DIR)
    else:
        print(
            f"✓ พบหน้าเว็บ React ที่ build แล้วที่ {REACT_DIST_INDEX} — ข้ามขั้นตอน build "
            "(ใช้ --rebuild-frontend เพื่อบังคับ build ใหม่ เช่นหลังแก้โค้ดใน src/)"
        )

    # 3) เปิด Flask (ให้รันเป็น subprocess โดยตรง เพื่อให้ debug reloader ของ Flask ทำงานปกติ
    #    และกด Ctrl+C ปิดได้ตามปกติ)
    print("\n=== เปิดเว็บแอป (app.py) ===")
    print("เปิดเบราว์เซอร์ไปที่ http://localhost:5000  (กด Ctrl+C เพื่อหยุด)\n")
    subprocess.run([sys.executable, "app.py"], cwd=BASE_DIR)


if __name__ == "__main__":
    main()
