using LoomWeaver.Modules.Maps.Domain;

namespace LoomWeaver.Modules.Maps.Infrastructure;

public static class SceneOutboxWriter
{
    private static readonly List<string> OutboxLog = [];

    public static string EnqueueRevisionProjection(SceneRevisionSnapshotDto snapshot, string summary)
    {
        var eventId = $"outbox-map-{snapshot.SceneKey}-r{snapshot.Revision}-{Guid.NewGuid().ToString("N")[..6]}";
        var record = $"{DateTimeOffset.UtcNow:O} | {eventId} | Scene={snapshot.SceneKey} | Rev={snapshot.Revision} | Layers={snapshot.Layers.Count} | Levels={snapshot.Levels.Count} | {summary}";
        OutboxLog.Insert(0, record);
        if (OutboxLog.Count > 50)
        {
            OutboxLog.RemoveAt(OutboxLog.Count - 1);
        }

        return eventId;
    }

    public static IReadOnlyList<string> GetRecentOutboxEvents() => OutboxLog;
}
