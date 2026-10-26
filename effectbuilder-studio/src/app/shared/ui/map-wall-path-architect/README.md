# `lw-map-wall-path-architect`

Reusable standalone Angular component for **LoomMaps Stage 2**: procedural chamber & cutaway wall geometry, fitted polyline door/window/secret-portal insertion, and curved path/cliff escarpment ribbons.

## Inputs
- `walls`: `readonly MapWallSegmentNode[]`
- `paths`: `readonly MapPathRibbonNode[]`
- `config`: `MapWallPathArchitectConfig` (`variant: 'compact' | 'standard' | 'detailed'`, `allowSecretDoors`, `showPathBuilder`)

## Outputs
- `chamberBuildRequested`: `ChamberBuildIntent`
- `openingInsertRequested`: `WallOpeningInsertIntent`
- `pathRibbonBuildRequested`: `PathRibbonBuildIntent`
- `wallDeleted`: `string`
- `pathDeleted`: `string`
