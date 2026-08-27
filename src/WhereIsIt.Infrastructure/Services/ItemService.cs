using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Application.Interfaces;
using WhereIsIt.Domain.Entities;
using WhereIsIt.Domain.Enums;
using WhereIsIt.Infrastructure.Data;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Infrastructure.Services;

public class ItemService : IItemService
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorageService;

    public ItemService(AppDbContext context, IFileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
    }

    public async Task<ApiResponse<PagedResult<ItemDto>>> GetItemsAsync(Guid userId, Guid? placeId = null, Guid? locationId = null, Guid? categoryId = null, bool? isImportant = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var query = _context.Items
            .Include(i => i.Location)
            .ThenInclude(l => l!.Place)
            .Include(i => i.Category)
            .Include(i => i.Media)
            .Include(i => i.ItemContainers)
            .ThenInclude(ic => ic.Container)
            .Where(i => i.UserId == userId && !i.IsArchived);

        if (placeId.HasValue)
        {
            query = query.Where(i => i.Location != null && i.Location.PlaceId == placeId.Value);
        }

        if (locationId.HasValue)
        {
            query = query.Where(i => i.LocationId == locationId.Value);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(i => i.CategoryId == categoryId.Value);
        }

        if (isImportant.HasValue)
        {
            query = query.Where(i => i.IsImportant == isImportant.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(i => i.IsImportant)
            .ThenByDescending(i => i.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var userLocations = await _context.Locations
            .Where(l => l.Place != null && l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var itemDtos = items.Select(i => MapToItemDto(i, userLocations)).ToList();
        var pagedResult = new PagedResult<ItemDto>(itemDtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PagedResult<ItemDto>>.Ok(pagedResult);
    }

    public async Task<ApiResponse<ItemDetailDto>> GetItemByIdAsync(Guid itemId, Guid userId, CancellationToken cancellationToken = default)
    {
        var item = await _context.Items
            .Include(i => i.Location)
            .ThenInclude(l => l!.Place)
            .Include(i => i.Category)
            .Include(i => i.Media)
            .Include(i => i.ItemContainers)
            .ThenInclude(ic => ic.Container)
            .Include(i => i.Reminders)
            .Include(i => i.LocationHistories)
            .ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId, cancellationToken);

        if (item == null)
        {
            return ApiResponse<ItemDetailDto>.Fail("Item not found.");
        }

        var userLocations = await _context.Locations
            .Where(l => l.Place != null && l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var baseDto = MapToItemDto(item, userLocations);
        var detailDto = new ItemDetailDto
        {
            Id = baseDto.Id,
            Name = baseDto.Name,
            Description = baseDto.Description,
            Brand = baseDto.Brand,
            Model = baseDto.Model,
            SerialNumber = baseDto.SerialNumber,
            PurchaseDate = baseDto.PurchaseDate,
            PurchasePrice = baseDto.PurchasePrice,
            Quantity = baseDto.Quantity,
            Condition = baseDto.Condition,
            IsImportant = baseDto.IsImportant,
            IsArchived = baseDto.IsArchived,
            LocationId = baseDto.LocationId,
            LocationName = baseDto.LocationName,
            LocationPath = baseDto.LocationPath,
            PlaceName = baseDto.PlaceName,
            CategoryId = baseDto.CategoryId,
            CategoryName = baseDto.CategoryName,
            CategoryIcon = baseDto.CategoryIcon,
            CategoryColorHex = baseDto.CategoryColorHex,
            PrimaryImageUrl = baseDto.PrimaryImageUrl,
            PrimaryThumbnailUrl = baseDto.PrimaryThumbnailUrl,
            ContainerName = baseDto.ContainerName,
            CreatedAt = baseDto.CreatedAt,
            UpdatedAt = baseDto.UpdatedAt,
            RowVersion = baseDto.RowVersion,
            Media = item.Media.Select(m => new ItemMediaDto
            {
                Id = m.Id,
                MediaType = m.MediaType,
                StorageUrl = m.StorageUrl,
                ThumbnailUrl = m.ThumbnailUrl,
                FileName = m.FileName,
                CreatedAt = m.CreatedAt
            }).ToList(),
            Reminders = item.Reminders.Select(r => new ItemReminderDto
            {
                Id = r.Id,
                ItemId = r.ItemId,
                ItemName = item.Name,
                ReminderType = r.ReminderType,
                ReminderDate = r.ReminderDate,
                RepeatRule = r.RepeatRule,
                Note = r.Note,
                IsCompleted = r.IsCompleted,
                IsEnabled = r.IsEnabled
            }).ToList(),
            LocationHistories = item.LocationHistories
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new ItemLocationHistoryDto
                {
                    Id = h.Id,
                    PreviousLocationPath = h.PreviousLocationId.HasValue && userLocations.TryGetValue(h.PreviousLocationId.Value, out var prevLoc)
                        ? LocationService.BuildLocationPath(prevLoc, userLocations, prevLoc.Place?.Name ?? "Place")
                        : null,
                    NewLocationPath = userLocations.TryGetValue(h.NewLocationId, out var newLoc)
                        ? LocationService.BuildLocationPath(newLoc, userLocations, newLoc.Place?.Name ?? "Place")
                        : "Unknown Location",
                    ChangedByName = h.ChangedByUser != null ? $"{h.ChangedByUser.FirstName} {h.ChangedByUser.LastName}".Trim() : "User",
                    ChangedAt = h.ChangedAt,
                    Reason = h.Reason
                }).ToList()
        };

        return ApiResponse<ItemDetailDto>.Ok(detailDto);
    }

    public async Task<ApiResponse<ItemDto>> CreateItemAsync(CreateItemDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return ApiResponse<ItemDto>.Fail("Item name is required.");
        }

        var location = await _context.Locations
            .Include(l => l.Place)
            .FirstOrDefaultAsync(l => l.Id == dto.LocationId && l.Place != null && l.Place.UserId == userId, cancellationToken);

        if (location == null)
        {
            return ApiResponse<ItemDto>.Fail("Selected location not found or not owned by user.");
        }

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && (c.IsSystemCategory || c.UserId == userId), cancellationToken);

        if (category == null)
        {
            return ApiResponse<ItemDto>.Fail("Selected category not found.");
        }

        var item = new Item
        {
            UserId = userId,
            LocationId = dto.LocationId,
            CategoryId = dto.CategoryId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Brand = dto.Brand?.Trim(),
            Model = dto.Model?.Trim(),
            SerialNumber = dto.SerialNumber?.Trim(),
            PurchaseDate = dto.PurchaseDate,
            PurchasePrice = dto.PurchasePrice,
            Quantity = dto.Quantity > 0 ? dto.Quantity : 1,
            Condition = string.IsNullOrWhiteSpace(dto.Condition) ? "Good" : dto.Condition.Trim(),
            IsImportant = dto.IsImportant
        };

        if (dto.ContainerId.HasValue)
        {
            var container = await _context.Containers.FirstOrDefaultAsync(c => c.Id == dto.ContainerId.Value && c.UserId == userId, cancellationToken);
            if (container != null)
            {
                item.ItemContainers.Add(new ItemContainer
                {
                    ContainerId = container.Id,
                    Item = item
                });
            }
        }

        if (!string.IsNullOrWhiteSpace(dto.PhotoUrl))
        {
            item.Media.Add(new ItemMedia
            {
                MediaType = MediaType.Image,
                StorageUrl = dto.PhotoUrl,
                ThumbnailUrl = dto.PhotoUrl,
                FileName = Path.GetFileName(dto.PhotoUrl) ?? "photo.jpg"
            });
        }

        item.LocationHistories.Add(new ItemLocationHistory
        {
            PreviousLocationId = null,
            NewLocationId = location.Id,
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow,
            Reason = "Initial creation"
        });

        _context.Items.Add(item);
        await _context.SaveChangesAsync(cancellationToken);

        var userLocations = await _context.Locations
            .Where(l => l.Place != null && l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var resultDto = MapToItemDto(item, userLocations);
        return ApiResponse<ItemDto>.Ok(resultDto, "Item created successfully.");
    }

    public async Task<ApiResponse<ItemDto>> UpdateItemAsync(Guid itemId, UpdateItemDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var item = await _context.Items
            .Include(i => i.Location)
            .ThenInclude(l => l!.Place)
            .Include(i => i.Category)
            .Include(i => i.Media)
            .Include(i => i.ItemContainers)
            .ThenInclude(ic => ic.Container)
            .Include(i => i.LocationHistories)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId, cancellationToken);

        if (item == null)
        {
            return ApiResponse<ItemDto>.Fail("Item not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return ApiResponse<ItemDto>.Fail("Item name cannot be empty.");
        }

        if (dto.RowVersion != null && item.RowVersion != null && !dto.RowVersion.SequenceEqual(item.RowVersion))
        {
            return ApiResponse<ItemDto>.Fail("Concurrency conflict: This item was modified by another request. Please refresh and retry.");
        }

        if (item.LocationId != dto.LocationId)
        {
            var newLocation = await _context.Locations.Include(l => l.Place).FirstOrDefaultAsync(l => l.Id == dto.LocationId && l.Place != null && l.Place.UserId == userId, cancellationToken);
            if (newLocation == null)
            {
                return ApiResponse<ItemDto>.Fail("New location not found.");
            }

            item.LocationHistories.Add(new ItemLocationHistory
            {
                ItemId = item.Id,
                PreviousLocationId = item.LocationId,
                NewLocationId = dto.LocationId,
                ChangedBy = userId,
                ChangedAt = DateTime.UtcNow,
                Reason = "Item updated"
            });

            item.LocationId = dto.LocationId;
            item.Location = newLocation;
        }

        item.CategoryId = dto.CategoryId;
        item.Name = dto.Name.Trim();
        item.Description = dto.Description?.Trim();
        item.Brand = dto.Brand?.Trim();
        item.Model = dto.Model?.Trim();
        item.SerialNumber = dto.SerialNumber?.Trim();
        item.PurchaseDate = dto.PurchaseDate;
        item.PurchasePrice = dto.PurchasePrice;
        item.Quantity = dto.Quantity > 0 ? dto.Quantity : 1;
        item.Condition = dto.Condition;
        item.IsImportant = dto.IsImportant;
        item.IsArchived = dto.IsArchived;

        if (dto.ContainerId.HasValue)
        {
            var existingContainer = item.ItemContainers.FirstOrDefault();
            if (existingContainer == null || existingContainer.ContainerId != dto.ContainerId.Value)
            {
                item.ItemContainers.Clear();
                item.ItemContainers.Add(new ItemContainer
                {
                    ContainerId = dto.ContainerId.Value,
                    ItemId = item.Id
                });
            }
        }
        else
        {
            item.ItemContainers.Clear();
        }

        await _context.SaveChangesAsync(cancellationToken);

        var userLocations = await _context.Locations
            .Where(l => l.Place != null && l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        return ApiResponse<ItemDto>.Ok(MapToItemDto(item, userLocations), "Item updated successfully.");
    }

    public async Task<ApiResponse<ItemDto>> MoveItemAsync(Guid itemId, MoveItemDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var item = await _context.Items
            .Include(i => i.Location)
            .ThenInclude(l => l!.Place)
            .Include(i => i.Category)
            .Include(i => i.Media)
            .Include(i => i.ItemContainers)
            .Include(i => i.LocationHistories)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId, cancellationToken);

        if (item == null)
        {
            return ApiResponse<ItemDto>.Fail("Item not found.");
        }

        var newLocation = await _context.Locations
            .Include(l => l.Place)
            .FirstOrDefaultAsync(l => l.Id == dto.NewLocationId && l.Place != null && l.Place.UserId == userId, cancellationToken);

        if (newLocation == null)
        {
            return ApiResponse<ItemDto>.Fail("Target location not found.");
        }

        var previousLocationId = item.LocationId;
        item.LocationId = dto.NewLocationId;
        item.Location = newLocation;

        var history = new ItemLocationHistory
        {
            ItemId = item.Id,
            PreviousLocationId = previousLocationId,
            NewLocationId = dto.NewLocationId,
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow,
            Reason = dto.Reason ?? "Quick Move"
        };

        _context.ItemLocationHistories.Add(history);

        if (dto.NewContainerId.HasValue)
        {
            item.ItemContainers.Clear();
            item.ItemContainers.Add(new ItemContainer
            {
                ContainerId = dto.NewContainerId.Value,
                ItemId = item.Id
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        var userLocations = await _context.Locations
            .Where(l => l.Place != null && l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        return ApiResponse<ItemDto>.Ok(MapToItemDto(item, userLocations), "Item moved successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteItemAsync(Guid itemId, Guid userId, CancellationToken cancellationToken = default)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId, cancellationToken);
        if (item == null)
        {
            return ApiResponse<bool>.Fail("Item not found.");
        }

        item.IsDeleted = true;
        item.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Item deleted successfully.");
    }

    public async Task<ApiResponse<ItemMediaDto>> AddItemMediaAsync(Guid itemId, Guid userId, Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == itemId && i.UserId == userId, cancellationToken);
        if (item == null)
        {
            return ApiResponse<ItemMediaDto>.Fail("Item not found.");
        }

        var (storageUrl, thumbnailUrl) = await _fileStorageService.SaveFileAsync(stream, fileName, contentType, cancellationToken);

        var media = new ItemMedia
        {
            ItemId = itemId,
            MediaType = MediaType.Image,
            StorageUrl = storageUrl,
            ThumbnailUrl = thumbnailUrl,
            FileName = fileName,
            FileExtension = Path.GetExtension(fileName),
            FileSizeBytes = stream.Length
        };

        _context.ItemMedia.Add(media);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<ItemMediaDto>.Ok(new ItemMediaDto
        {
            Id = media.Id,
            MediaType = media.MediaType,
            StorageUrl = media.StorageUrl,
            ThumbnailUrl = media.ThumbnailUrl,
            FileName = media.FileName,
            CreatedAt = media.CreatedAt
        }, "Photo added successfully.");
    }

    public async Task<ApiResponse<bool>> BulkMoveItemsAsync(BulkMoveItemsDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (dto.ItemIds == null || dto.ItemIds.Count == 0)
        {
            return ApiResponse<bool>.Fail("No items specified for bulk relocation.");
        }

        var targetLocation = await _context.Locations
            .Include(l => l.Place)
            .FirstOrDefaultAsync(l => l.Id == dto.NewLocationId && l.Place != null && l.Place.UserId == userId, cancellationToken);

        if (targetLocation == null)
        {
            return ApiResponse<bool>.Fail("Target location not found or not owned by user.");
        }

        var items = await _context.Items
            .Where(i => dto.ItemIds.Contains(i.Id) && i.UserId == userId && !i.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            var prevLoc = item.LocationId;
            item.LocationId = dto.NewLocationId;
            item.Location = targetLocation;
            item.UpdatedAt = DateTime.UtcNow;

            _context.ItemLocationHistories.Add(new ItemLocationHistory
            {
                ItemId = item.Id,
                PreviousLocationId = prevLoc,
                NewLocationId = dto.NewLocationId,
                ChangedBy = userId,
                ChangedAt = DateTime.UtcNow,
                Reason = dto.Reason ?? "Bulk Relocation"
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, $"Successfully relocated {items.Count} items.");
    }

    public async Task<ApiResponse<InventoryValuationDto>> GetInventoryValuationAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await _context.Items
            .Include(i => i.Category)
            .Where(i => i.UserId == userId && !i.IsDeleted)
            .ToListAsync(cancellationToken);

        var totalItems = items.Count;
        var totalEstimatedValue = items.Sum(i => (i.PurchasePrice ?? 0) * i.Quantity);
        var itemsWithPrice = items.Count(i => i.PurchasePrice.HasValue && i.PurchasePrice.Value > 0);

        var categoryBreakdown = items
            .GroupBy(i => i.Category?.Name ?? "Uncategorized")
            .Select(g => new CategoryValuationDto
            {
                CategoryName = g.Key,
                ColorHex = g.FirstOrDefault()?.Category?.ColorHex ?? "#2563EB",
                ItemCount = g.Count(),
                TotalValue = g.Sum(i => (i.PurchasePrice ?? 0) * i.Quantity)
            })
            .OrderByDescending(c => c.TotalValue)
            .ToList();

        var dto = new InventoryValuationDto
        {
            TotalItems = totalItems,
            TotalEstimatedValue = totalEstimatedValue,
            ItemsWithPrice = itemsWithPrice,
            CategoryBreakdown = categoryBreakdown
        };

        return ApiResponse<InventoryValuationDto>.Ok(dto);
    }

    private static ItemDto MapToItemDto(Item item, Dictionary<Guid, Location> userLocations)
    {
        var locationPath = userLocations.TryGetValue(item.LocationId, out var loc)
            ? LocationService.BuildLocationPath(loc, userLocations, loc.Place?.Name ?? "Place")
            : (item.Location != null ? $"{item.Location.Place?.Name ?? "Place"} → {item.Location.Name}" : "Unknown");

        var primaryMedia = item.Media.FirstOrDefault();
        var primaryContainer = item.ItemContainers.FirstOrDefault()?.Container;

        return new ItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            Brand = item.Brand,
            Model = item.Model,
            SerialNumber = item.SerialNumber,
            PurchaseDate = item.PurchaseDate,
            PurchasePrice = item.PurchasePrice,
            Quantity = item.Quantity,
            Condition = item.Condition,
            IsImportant = item.IsImportant,
            IsArchived = item.IsArchived,
            LocationId = item.LocationId,
            LocationName = item.Location?.Name ?? "Location",
            LocationPath = locationPath,
            PlaceName = item.Location?.Place?.Name ?? "Place",
            CategoryId = item.CategoryId,
            CategoryName = item.Category?.Name ?? "Uncategorized",
            CategoryIcon = item.Category?.Icon ?? "category",
            CategoryColorHex = item.Category?.ColorHex ?? "#3B82F6",
            PrimaryImageUrl = primaryMedia?.StorageUrl,
            PrimaryThumbnailUrl = primaryMedia?.ThumbnailUrl,
            ContainerName = primaryContainer?.Name,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt,
            RowVersion = item.RowVersion
        };
    }
}
