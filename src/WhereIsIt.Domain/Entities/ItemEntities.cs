using System;
using System.Collections.Generic;
using WhereIsIt.Domain.Common;
using WhereIsIt.Domain.Enums;

namespace WhereIsIt.Domain.Entities;

public class Category : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "category";
    public string ColorHex { get; set; } = "#3B82F6";
    public bool IsSystemCategory { get; set; } = false;

    public ICollection<Item> Items { get; set; } = new List<Item>();
}

public class Item : SoftDeletableEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid LocationId { get; set; }
    public Location? Location { get; set; }

    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public int Quantity { get; set; } = 1;
    public string Condition { get; set; } = "Good";
    public bool IsImportant { get; set; } = false;
    public bool IsArchived { get; set; } = false;

    public byte[]? RowVersion { get; set; }

    public ICollection<ItemMedia> Media { get; set; } = new List<ItemMedia>();
    public ICollection<ItemContainer> ItemContainers { get; set; } = new List<ItemContainer>();
    public ICollection<ItemReminder> Reminders { get; set; } = new List<ItemReminder>();
    public ICollection<ItemLocationHistory> LocationHistories { get; set; } = new List<ItemLocationHistory>();
    public ICollection<SharedItem> SharedItems { get; set; } = new List<SharedItem>();
}

public class ItemMedia : BaseEntity
{
    public Guid ItemId { get; set; }
    public Item? Item { get; set; }

    public MediaType MediaType { get; set; } = MediaType.Image;
    public string StorageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}

public class ItemLocationHistory : BaseEntity
{
    public Guid ItemId { get; set; }
    public Item? Item { get; set; }

    public Guid? PreviousLocationId { get; set; }
    public Location? PreviousLocation { get; set; }

    public Guid NewLocationId { get; set; }
    public Location? NewLocation { get; set; }

    public Guid ChangedBy { get; set; }
    public User? ChangedByUser { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? Reason { get; set; }
}

public class ItemReminder : BaseEntity
{
    public Guid ItemId { get; set; }
    public Item? Item { get; set; }

    public ReminderType ReminderType { get; set; } = ReminderType.Warranty;
    public DateTime ReminderDate { get; set; }
    public string? RepeatRule { get; set; }
    public string? Note { get; set; }
    public bool IsCompleted { get; set; } = false;
    public bool IsEnabled { get; set; } = true;
}
