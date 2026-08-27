using System;
using WhereIsIt.Domain.Common;
using WhereIsIt.Domain.Enums;

namespace WhereIsIt.Domain.Entities;

public class SharedItem : BaseEntity
{
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;

    public Guid SharedWithUserId { get; set; }
    public User SharedWithUser { get; set; } = null!;

    public PermissionLevel Permission { get; set; } = PermissionLevel.View;
    public DateTime SharedAt { get; set; } = DateTime.UtcNow;
}

public class ItemPermission : BaseEntity
{
    public string EntityType { get; set; } = "Item"; // Item, Place, Container
    public Guid EntityId { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public PermissionLevel PermissionLevel { get; set; } = PermissionLevel.View;
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
}

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Reminder"; // Reminder, Expiry, System, Sharing
    public string? TargetUrl { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
}

public class SyncQueue : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string EntityType { get; set; } = string.Empty; // Item, Place, Location, Container
    public Guid EntityId { get; set; }
    public SyncOperation Operation { get; set; } = SyncOperation.Create;
    public string Payload { get; set; } = string.Empty; // JSON payload
    public int RetryCount { get; set; } = 0;
    public DateTime? LastAttemptAt { get; set; }
    public SyncStatus Status { get; set; } = SyncStatus.Pending;
    public string? ErrorMessage { get; set; }
}

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string Action { get; set; } = string.Empty; // ItemCreated, ItemMoved, ItemDeleted, QRGenerated, etc.
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
