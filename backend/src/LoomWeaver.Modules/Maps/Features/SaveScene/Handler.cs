using LoomWeaver.Modules.Maps.Domain;
using LoomWeaver.Modules.Maps.Infrastructure;

namespace LoomWeaver.Modules.Maps.Features.SaveScene;

public static class SaveSceneHandler
{
    public static SaveSceneRevisionResponse Execute(
        int campaignId,
        string sceneKey,
        SaveSceneRevisionRequest request)
    {
        var snapshot = SceneRepository.CommitRevision(campaignId, sceneKey, request);
        var summary = string.IsNullOrWhiteSpace(request.ChangeSummary)
            ? $"Saved '{snapshot.Title}' at Rev {snapshot.Revision} ({snapshot.Layers.Count} layers, Level L{snapshot.ActiveLevelIndex})."
            : request.ChangeSummary;
        var outboxId = SceneOutboxWriter.EnqueueRevisionProjection(snapshot, summary);

        return new SaveSceneRevisionResponse(
            Accepted: true,
            NewRevision: snapshot.Revision,
            OutboxEventId: outboxId,
            Summary: summary,
            Snapshot: snapshot
        );
    }
}
