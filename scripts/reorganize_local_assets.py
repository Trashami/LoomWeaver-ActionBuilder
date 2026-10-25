import json
import os
import shutil
from pathlib import Path

ROOT = Path(r"c:\map assets")

MODELS_3D = ROOT / "models-3d"
STAMPS_2D = ROOT / "stamps-2d"
TERRAIN_TEXTURES = ROOT / "terrain-textures"
CATALOGS = ROOT / "catalogs"

for d in (MODELS_3D, STAMPS_2D, TERRAIN_TEXTURES, CATALOGS):
    d.mkdir(parents=True, exist_ok=True)


def move_or_merge(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    if src.is_dir():
        dst.mkdir(parents=True, exist_ok=True)
        for item in list(src.iterdir()):
            target = dst / item.name
            if item.is_dir():
                move_or_merge(item, target)
            else:
                if target.exists():
                    target.unlink()
                shutil.move(str(item), str(target))
        try:
            src.rmdir()
        except OSError:
            pass
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            dst.unlink()
        shutil.move(str(src), str(dst))


# 1. Organize 3d objects -> models-3d/ and catalogs/
old_3d = ROOT / "3d objects"
if old_3d.exists():
    for item in list(old_3d.iterdir()):
        if item.suffix.lower() in (".glb", ".gltf", ".obj", ".fbx"):
            move_or_merge(item, MODELS_3D / item.name)
        elif item.suffix.lower() == ".json":
            move_or_merge(item, CATALOGS / item.name)
        else:
            move_or_merge(item, MODELS_3D / item.name)
    shutil.rmtree(old_3d, ignore_errors=True)

# 2. Organize nested map-assets/stamps/...
nested_public = ROOT / "map-assets" / "stamps" / "room-bundles-v1" / "public" / "assets"
if nested_public.exists():
    move_or_merge(nested_public / "room-bundles-v1", STAMPS_2D / "room-bundles-v1")
    move_or_merge(nested_public / "room-furnishings-v1", STAMPS_2D / "room-furnishings-v1")
    move_or_merge(nested_public / "table-room-decor-v1", STAMPS_2D / "table-room-decor-v1")
    move_or_merge(nested_public / "stamps" / "furniture", STAMPS_2D / "furniture")
    move_or_merge(nested_public / "stamps" / "props", STAMPS_2D / "props")
    move_or_merge(
        nested_public / "sewer-dungeon-wall-library-v1",
        TERRAIN_TEXTURES / "sewer-dungeon-wall-library-v1",
    )
    move_or_merge(nested_public / "textures" / "castle-timber", TERRAIN_TEXTURES / "castle-timber")
    move_or_merge(nested_public / "textures" / "walls", TERRAIN_TEXTURES / "walls")

# 3. Merge top-level duplicate room-furnishings-v1
dup_furnishings = ROOT / "map-assets" / "stamps" / "room-furnishings-v1"
if dup_furnishings.exists():
    move_or_merge(dup_furnishings, STAMPS_2D / "room-furnishings-v1")

# 4. Remove old nested client-source and empty map-assets wrapper
old_map_assets = ROOT / "map-assets"
if old_map_assets.exists():
    shutil.rmtree(old_map_assets, ignore_errors=True)

old_3d_conv = ROOT / "3d-stamp-conversion"
if old_3d_conv.exists():
    for item in list(old_3d_conv.iterdir()):
        move_or_merge(item, CATALOGS / item.name)
    shutil.rmtree(old_3d_conv, ignore_errors=True)

# 5. Generate clean manifest summary
manifest = {
    "schemaVersion": "2.0.0",
    "root": str(ROOT),
    "categories": {
        "models-3d": len(list(MODELS_3D.rglob("*.*"))),
        "stamps-2d": len(list(STAMPS_2D.rglob("*.*"))),
        "terrain-textures": len(list(TERRAIN_TEXTURES.rglob("*.*"))),
        "catalogs": len(list(CATALOGS.rglob("*.*"))),
    },
    "stampsSubfolders": [p.name for p in sorted(STAMPS_2D.iterdir()) if p.is_dir()],
    "terrainSubfolders": [p.name for p in sorted(TERRAIN_TEXTURES.iterdir()) if p.is_dir()],
}
(CATALOGS / "loomweaver-asset-manifest.json").write_text(
    json.dumps(manifest, indent=2), encoding="utf-8"
)
print(json.dumps(manifest, indent=2))
