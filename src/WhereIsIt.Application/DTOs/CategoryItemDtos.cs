using System;
using System.Collections.Generic;
using WhereIsIt.Domain.Enums;

namespace WhereIsIt.Application.DTOs;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "category";
    public string ColorHex { get; set; } = "#3B82F6";
    public bool IsSystemCategory { get; set; }
    public int ItemsCount { get; set; }
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "category";
    public string ColorHex { get; set; } = "#3B82F6";
}

public class ItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public int Quantity { get; set; }
    public string Condition { get; set; } = "Good";
    public bool IsImportant { get; set; }
    public bool IsArchived { get; set; }

    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string LocationPath { get; set; } = string.Empty; // e.g. "Home → Bedroom → Study Table → Top Drawer"
    public string PlaceName { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryIcon { get; set; } = "category";
    public string CategoryColorHex { get; set; } = "#3B82F6";

    public string? PrimaryImageUrl { get; set; }
    public string? PrimaryThumbnailUrl { get; set; }
    public string? ContainerName { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public byte[]? RowVersion { get; set; }
}

public class ItemDetailDto : ItemDto
{
    public List<ItemMediaDto> Media { get; set; } = new List<ItemMediaDto>();
    public List<ItemReminderDto> Reminders { get; set; } = new List<ItemReminderDto>();
    public List<ItemLocationHistoryDto> LocationHistories { get; set; } = new List<ItemLocationHistoryDto>();
}

public class ItemMediaDto
{
    public Guid Id { get; set; }
    public MediaType MediaType { get; set; }
    public string StorageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string FileName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ItemLocationHistoryDto
{
    public Guid Id { get; set; }
    public string? PreviousLocationPath { get; set; }
    public string NewLocationPath { get; set; } = string.Empty;
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? Reason { get; set; }
}

public class CreateItemDto
{
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

    public Guid LocationId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? ContainerId { get; set; }
    public string? PhotoUrl { get; set; }
}

public class UpdateItemDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? PurchasePrice { get; set; }
    public int Quantity { get; set; }
    public string Condition { get; set; } = "Good";
    public bool IsImportant { get; set; }
    public bool IsArchived { get; set; }

    public Guid LocationId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? ContainerId { get; set; }
    public byte[]? RowVersion { get; set; }
}

public class MoveItemDto
{
    public Guid NewLocationId { get; set; }
    public Guid? NewContainerId { get; set; }
    public string? Reason { get; set; } // e.g. "Moved for storage"
}

public class BulkMoveItemsDto
{
    public List<Guid> ItemIds { get; set; } = new List<Guid>();
    public Guid NewLocationId { get; set; }
    public string? Reason { get; set; } = "Bulk Relocation";
}

public class InventoryValuationDto
{
    public int TotalItems { get; set; }
    public decimal TotalEstimatedValue { get; set; }
    public int ItemsWithPrice { get; set; }
    public List<CategoryValuationDto> CategoryBreakdown { get; set; } = new List<CategoryValuationDto>();
}

public class CategoryValuationDto
{
    public string CategoryName { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#2563EB";
    public int ItemCount { get; set; }
    public decimal TotalValue { get; set; }
}
