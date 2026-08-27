using System;
using System.Collections.Generic;
using WhereIsIt.Domain.Enums;

namespace WhereIsIt.Application.DTOs;

public class ContainerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Box";
    public string? PhotoUrl { get; set; }
    public string? QRCode { get; set; }
    public string? QrToken { get; set; }
    public Guid LocationId { get; set; }
    public string LocationPath { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
}

public class ContainerDetailDto : ContainerDto
{
    public List<ItemDto> Items { get; set; } = new List<ItemDto>();
}

public class CreateContainerDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Box";
    public Guid LocationId { get; set; }
    public string? PhotoUrl { get; set; }
    public string? QRCode { get; set; }
}

public class QrScanResultDto
{
    public Guid ContainerId { get; set; }
    public string ContainerName { get; set; } = string.Empty;
    public string ContainerType { get; set; } = string.Empty;
    public string LocationPath { get; set; } = string.Empty;
    public List<ItemDto> Items { get; set; } = new List<ItemDto>();
}

public class ItemReminderDto
{
    public Guid Id { get; set; }
    public Guid ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public ReminderType ReminderType { get; set; }
    public DateTime ReminderDate { get; set; }
    public string? RepeatRule { get; set; }
    public string? Note { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsEnabled { get; set; }
    public int DaysRemaining => (ReminderDate.Date - DateTime.UtcNow.Date).Days;
}

public class CreateReminderDto
{
    public Guid ItemId { get; set; }
    public ReminderType ReminderType { get; set; } = ReminderType.Warranty;
    public DateTime ReminderDate { get; set; }
    public string? RepeatRule { get; set; }
    public string? Note { get; set; }
}

public class SearchResultDto
{
    public string Query { get; set; } = string.Empty;
    public int TotalMatches { get; set; }
    public List<ItemDto> Items { get; set; } = new List<ItemDto>();
    public List<ContainerDto> Containers { get; set; } = new List<ContainerDto>();
    public List<LocationDto> Locations { get; set; } = new List<LocationDto>();
}

public class SyncBatchRequestDto
{
    public List<SyncItemDto> Operations { get; set; } = new List<SyncItemDto>();
}

public class SyncItemDto
{
    public Guid ClientOperationId { get; set; }
    public string EntityType { get; set; } = string.Empty; // Item, Place, Location, Container
    public Guid EntityId { get; set; }
    public SyncOperation Operation { get; set; }
    public string JsonPayload { get; set; } = string.Empty;
    public DateTime ClientTimestamp { get; set; }
}

public class SyncBatchResponseDto
{
    public int ProcessedCount { get; set; }
    public int SuccessCount { get; set; }
    public List<SyncResultItemDto> Results { get; set; } = new List<SyncResultItemDto>();
}

public class SyncResultItemDto
{
    public Guid ClientOperationId { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? ServerEntityId { get; set; }
}
