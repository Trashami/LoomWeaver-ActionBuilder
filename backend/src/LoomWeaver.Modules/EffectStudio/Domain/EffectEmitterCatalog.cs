using LoomWeaver.Domain;

namespace LoomWeaver.Modules.EffectStudio.Domain;

public static class EffectEmitterCatalog
{
    public static IReadOnlyList<EffectEmitterCardDto> GetAllEmitters() => Emitters;

    private static readonly IReadOnlyList<EffectEmitterCardDto> Emitters =
    [
        new("emit-magic-bolt", "Magic Bolt", "Projectiles", "Particle", "Directional Cone", 1.2, 2.5, 95, 1.4, 3.8, 18, "Arcane Plasma", "#38bdf8", "#bae6fd", 0.15, 0.85, 90, "Additive", true, 1.4, false, "#38bdf8"),
        new("emit-fire-burst", "Fire Burst", "Elemental", "Particle", "Sphere Burst", 3.5, 4.2, 180, 1.8, 2.6, 65, "Solar Ember", "#f97316", "#fde047", 0.25, 1.65, 88, "Additive", true, 1.8, false, "#f97316"),
        new("emit-ice-shards", "Ice Shards", "Elemental", "Mesh Shard", "Directional Cone", 2.4, 3.0, 75, 2.0, 3.2, 32, "Crystalline Frost", "#7dd3fc", "#e0f2fe", 0.20, 1.10, 85, "Additive", true, 1.0, true, "#7dd3fc"),
        new("emit-shadow-swirl", "Shadow Swirl", "Necrotic & Void", "Ribbon Vortex", "Circle (Area)", 3.8, 4.5, 110, 2.8, 1.4, 50, "Abyssal Mist", "#a855f7", "#3b0764", 0.30, 1.80, 82, "AlphaBlend", false, 0.4, true, "#a855f7"),
        new("emit-holy-light", "Holy Light", "Radiant & Runes", "Particle", "Circle (Area)", 4.0, 6.0, 120, 2.5, 1.5, 45, "Golden Light", "#fcd34d", "#fffbeb", 0.20, 1.50, 80, "Additive", true, 1.2, false, "#f59e0b"),
        new("emit-poison-cloud", "Poison Cloud", "Atmospheric", "Volumetric Fog", "Circle (Area)", 4.5, 2.8, 65, 3.6, 0.6, 80, "Spore Vapor", "#84cc16", "#365314", 0.45, 2.20, 72, "AlphaBlend", false, 0.3, true, "#84cc16"),
        new("emit-rune-circle", "Rune Circle", "Radiant & Runes", "Ground Sigil", "Circle (Area)", 4.0, 0.4, 40, 4.0, 0.5, 15, "Golden Light", "#2dd4bf", "#fcd34d", 0.30, 1.40, 92, "Additive", true, 1.5, false, "#2dd4bf"),
        new("emit-healing-aura", "Healing Aura", "Radiant & Runes", "Particle", "Cylinder Pillar", 3.2, 5.2, 130, 2.4, 1.2, 35, "Emerald Vitality", "#34d399", "#a7f3d0", 0.18, 1.25, 84, "Additive", true, 1.3, false, "#34d399"),
        new("emit-lightning-arc", "Lightning Arc", "Elemental", "Shader Beam", "Arc Chain", 2.0, 5.5, 150, 0.9, 4.5, 25, "High-Voltage Arc", "#60a5fa", "#e0f2fe", 0.12, 0.95, 95, "Additive", true, 2.0, false, "#60a5fa"),
        new("emit-smoke", "Smoke", "Atmospheric", "Volumetric Fog", "Circle (Area)", 3.6, 4.8, 55, 3.8, 0.8, 60, "Charcoal Plume", "#94a3b8", "#334155", 0.50, 2.40, 68, "AlphaBlend", false, 0.0, true, "#94a3b8"),
        new("emit-embers", "Embers", "Elemental", "Particle", "Circle (Area)", 3.8, 5.8, 140, 2.6, 1.9, 55, "Cinder Spark", "#fb923c", "#fef08a", 0.10, 0.65, 90, "Additive", true, 1.1, false, "#fb923c"),
        new("emit-water-splash", "Water Splash", "Elemental", "Particle", "Ring Fountain", 3.0, 3.4, 115, 1.7, 2.4, 48, "Refractive Foam", "#38bdf8", "#f0f9ff", 0.20, 1.30, 78, "Additive", false, 0.6, true, "#38bdf8"),
        new("emit-wind-gust", "Wind Gust", "Atmospheric", "Ribbon Vortex", "Spiral Funnel", 4.2, 5.4, 90, 2.2, 2.8, 52, "Zephyr Ribbon", "#cbd5e1", "#f8fafc", 0.25, 1.60, 64, "AlphaBlend", false, 0.2, false, "#cbd5e1"),
        new("emit-leaf-swirl", "Leaf Swirl", "Atmospheric", "Mesh Shard", "Spiral Funnel", 3.5, 4.6, 85, 2.9, 1.6, 42, "Feywild Foliage", "#4ade80", "#bef264", 0.18, 0.90, 88, "AlphaBlend", false, 0.4, true, "#4ade80"),
        new("emit-blood-mist", "Blood Mist", "Necrotic & Void", "Volumetric Fog", "Circle (Area)", 3.8, 3.2, 100, 2.7, 1.1, 62, "Crimson Vapor", "#ef4444", "#7f1d1d", 0.35, 1.95, 76, "AlphaBlend", true, 0.8, true, "#ef4444"),
        new("emit-arcane-sigil", "Arcane Sigil", "Radiant & Runes", "Ground Sigil", "Circle (Area)", 4.4, 0.5, 60, 4.2, 0.4, 12, "Anelith Glyph", "#38bdf8", "#818cf8", 0.35, 1.50, 94, "Additive", true, 1.6, false, "#38bdf8"),
        new("emit-portal", "Portal", "Necrotic & Void", "Ribbon Vortex", "Vertical Ring", 3.6, 5.0, 160, 3.2, 1.8, 40, "Void Rift", "#c084fc", "#f472b6", 0.22, 1.55, 86, "Additive", true, 1.7, false, "#c084fc"),
        new("emit-energy-beam", "Energy Beam", "Projectiles", "Shader Beam", "Linear Ray", 1.5, 6.0, 175, 1.5, 4.2, 14, "Concentrated Aether", "#e879f9", "#fae8ff", 0.20, 1.35, 92, "Additive", true, 1.9, false, "#e879f9"),
    ];
}
