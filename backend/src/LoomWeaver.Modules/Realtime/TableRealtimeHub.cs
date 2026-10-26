using LoomWeaver.Domain;
using Microsoft.AspNetCore.SignalR;

namespace LoomWeaver.Modules.Realtime;

public sealed class TableRealtimeHub : Hub
{
    public async Task JoinCampaignTable(int campaignId, string actorName, string role)
    {
        var groupName = $"campaign-{campaignId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        var evt = TableRealtimeEndpoints.RecordEvent(
            campaignId,
            "seat_joined",
            actorName,
            $"{actorName} ({role.ToUpperInvariant()}) connected to live table SignalR hub.",
            "{}"
        );
        await Clients.Group(groupName).SendAsync("TableEventReceived", evt);
    }

    public async Task BroadcastTableAction(int campaignId, PublishRealtimeEventRequest request)
    {
        var groupName = $"campaign-{campaignId}";
        var evt = TableRealtimeEndpoints.RecordEvent(
            campaignId,
            request.EventType,
            request.ActorName,
            request.Summary,
            request.PayloadJson ?? "{}"
        );
        await Clients.Group(groupName).SendAsync("TableEventReceived", evt);
    }
}
