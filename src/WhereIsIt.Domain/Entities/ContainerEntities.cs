using System;
using System.Collections.Generic;
using WhereIsIt.Domain.Common;

namespace WhereIsIt.Domain.Entities;

public class Container : SoftDeletableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid LocationId { get; set; }
    public Location Location { get; set; } = null!;

    public string Name { get; set; } = string.Empty; // e.g. "Blue Box", "Winter Clothes Bag", "Tool Box"
    public string? Description { get; set; }
    public string Type { get; set; } = "Box"; // Box, Bag, Drawer, Folder, Cupboard, Suitcase
    public string? PhotoUrl { get; set; }
    public string? QRCode { get; set; } // Human-readable label code e.g. BOX-001

    // Navigation properties
    public ICollection<ItemContainer> ItemContainers { get; set; } = new List<ItemContainer>();
    public ICollection<ContainerQrCode> QrCodes { get; set; } = new List<ContainerQrCode>();
}

public class ItemContainer : BaseEntity
{
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;

    public Guid ContainerId { get; set; }
    public Container Container { get; set; } = null!;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}

public class ContainerQrCode : BaseEntity
{
    public Guid ContainerId { get; set; }
    public Container Container { get; set; } = null!;

    public string Token { get; set; } = Guid.NewGuid().ToString("N"); // Secure non-guessable random token
    public bool IsActive { get; set; } = true;
    public bool IsPublic { get; set; } = false; // If true, can show basic non-sensitive contents
    public DateTime? ExpiresAt { get; set; }
}
