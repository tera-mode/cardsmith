#!/usr/bin/env python3
"""
カード・背景画像一括生成スクリプト
- Gemini 2.5 Flash Image で生成
- 既存画像はスキップ（再生成しない）

使い方:
  python tools/gen_images.py              # 全画像生成
  python tools/gen_images.py cards        # カードのみ
  python tools/gen_images.py backgrounds  # 背景のみ
  python tools/gen_images.py <cardId>     # 指定カードのみ（例: militia）
"""
import base64
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env.local")

from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[ERR] GEMINI_API_KEY が .env.local に設定されていません")
    sys.exit(1)

PROJ = Path(__file__).parent.parent
PUBLIC = PROJ / "public"

client = genai.Client(api_key=GEMINI_API_KEY)

STYLE_PREFIX = (
    "Fantasy strategy game card art, anime style, simple high-visibility design "
    "suitable for a 6x6 grid board game. Medieval fantasy theme. "
    "Dynamic composition, front-facing or 3/4 angle. "
    "White or transparent background, centered figure. "
    "absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana. "
)


def generate_image(prompt: str, save_path: Path) -> bool:
    print(f"  生成中: {save_path.name}")
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-05-20",
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"]),
        )
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                raw = (
                    base64.b64decode(part.inline_data.data)
                    if isinstance(part.inline_data.data, str)
                    else part.inline_data.data
                )
                save_path.parent.mkdir(parents=True, exist_ok=True)
                save_path.write_bytes(raw)
                print(f"  [OK] {save_path.relative_to(PROJ)} ({len(raw) // 1024}KB)")
                return True
        print(f"  [WARN] 画像データなし（テキストのみ返却）")
        return False
    except Exception as e:
        print(f"  [ERR] {e}")
        return False


# ============================================================
# カード定義（13種）
# ============================================================
CARD_TASKS = [
    {
        "id": "militia",
        "prompt": STYLE_PREFIX + "A peasant soldier holding a crude spear. Ragged armor, determined look.",
    },
    {
        "id": "light_infantry",
        "prompt": STYLE_PREFIX + "A lightly armored infantry soldier in leather armor, short sword at ready.",
    },
    {
        "id": "assault_soldier",
        "prompt": STYLE_PREFIX + "An agile soldier with twin daggers, crouching in attack stance, swift movement.",
    },
    {
        "id": "scout",
        "prompt": STYLE_PREFIX + "A scout in a hooded cloak, crouching alertly, quiver on back.",
    },
    {
        "id": "spear_soldier",
        "prompt": STYLE_PREFIX + "A soldier brandishing a long spear, medium armor, poised for thrust.",
    },
    {
        "id": "heavy_infantry",
        "prompt": STYLE_PREFIX + "A fully plate-armored heavy infantry, massive shield and broadsword, imposing stance.",
    },
    {
        "id": "combat_soldier",
        "prompt": STYLE_PREFIX + "An elite soldier with sword and round shield, battle-hardened expression.",
    },
    {
        "id": "archer",
        "prompt": STYLE_PREFIX + "An archer pulling a longbow, leather armor, focused aim.",
    },
    {
        "id": "guard",
        "prompt": STYLE_PREFIX + "A guard holding a large tower shield defensively, sturdy armor.",
    },
    {
        "id": "healer",
        "prompt": STYLE_PREFIX + "A field healer holding a glowing chalice, white robes with red cross emblem.",
    },
    {
        "id": "cavalry",
        "prompt": STYLE_PREFIX + "A knight on horseback in full armor, lance raised, dynamic charging pose.",
    },
    {
        "id": "cannon",
        "prompt": STYLE_PREFIX + "An artillery crew operating a bronze cannon, smoke and sparks, medieval setting.",
    },
    {
        "id": "defender",
        "prompt": STYLE_PREFIX + "A guardian soldier bearing an enormous kite shield, fortified armor, resolute stance.",
    },
]

# ============================================================
# 背景定義
# ============================================================
BACKGROUND_TASKS = [
    {
        "id": "board",
        "path": PUBLIC / "images/backgrounds/board.jpg",
        "prompt": (
            "Top-down tactical board game battlefield, medieval fantasy setting. "
            "Grassy plains with stone castle ruins, strategic grid-like terrain. "
            "Overhead aerial view map style, 6x6 grid overlay impression. "
            "Warm natural lighting. "
            "Full frame edge-to-edge composition, no white borders, no padding, no frame. "
            "No characters, no units, no people in the artwork. "
            "absolutely NO text NO letters NO words NO numbers NO kanji NO hiragana NO katakana. "
        ),
    },
]


def run_cards(target_id: str | None = None):
    print("=== カード画像生成 ===")
    for task in CARD_TASKS:
        if target_id and task["id"] != target_id:
            continue
        raw_path = PUBLIC / f"images/cards/raw/{task['id']}_raw.png"
        final_path = PUBLIC / f"images/cards/{task['id']}.png"
        if final_path.exists():
            print(f"  スキップ（既存）: {task['id']}.png")
            continue
        if not raw_path.exists():
            generate_image(task["prompt"], raw_path)
        else:
            print(f"  スキップ（rawあり）: {raw_path.name}")
        if raw_path.exists() and not final_path.exists():
            import shutil
            shutil.copy(raw_path, final_path)
            print(f"  [OK] コピー: {final_path.name}")


def run_backgrounds():
    print("=== 背景画像生成 ===")
    for task in BACKGROUND_TASKS:
        p = task["path"]
        if p.exists():
            print(f"  スキップ（既存）: {p.name}")
            continue
        generate_image(task["prompt"], p)


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "all"

    if arg == "backgrounds":
        run_backgrounds()
    elif arg == "cards":
        run_cards()
    elif arg == "all":
        run_backgrounds()
        run_cards()
    else:
        run_cards(target_id=arg)

    print("\n[DONE] 完了")
