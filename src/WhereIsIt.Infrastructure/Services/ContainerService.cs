using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Application.Interfaces;
using WhereIsIt.Domain.Entities;
using WhereIsIt.Infrastructure.Data;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Infrastructure.Services;

public class ContainerService : IContainerService
{
    private readonly AppDbContext _context;

    public ContainerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<ContainerDto>>> GetContainersAsync(Guid userId, Guid? locationId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Containers
            .Include(c => c.Location)
            .ThenInclude(l => l.Place)
            .Include(c => c.ItemContainers)
            .Include(c => c.QrCodes)
            .Where(c => c.UserId == userId);

        if (locationId.HasValue)
        {
            query = query.Where(c => c.LocationId == locationId.Value);
        }

        var userLocations = await _context.Locations
            .Where(l => l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var containers = await query
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);

        var dtos = containers.Select(c =>
        {
            var path = userLocations.TryGetValue(c.LocationId, out var loc)
                ? LocationService.BuildLocationPath(loc, userLocations, loc.Place?.Name ?? "Place")
                : "Unknown";

            var activeQr = c.QrCodes.FirstOrDefault(q => q.IsActive);

            return new ContainerDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Type = c.Type,
                PhotoUrl = c.PhotoUrl,
                QRCode = c.QRCode,
                QrToken = activeQr?.Token,
                LocationId = c.LocationId,
                LocationPath = path,
                ItemsCount = c.ItemContainers.Count(ic => !ic.Item.IsDeleted)
            };
        }).ToList();

        return ApiResponse<List<ContainerDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<ContainerDetailDto>> GetContainerByIdAsync(Guid containerId, Guid userId, CancellationToken cancellationToken = default)
    {
        var container = await _context.Containers
            .Include(c => c.Location)
            .ThenInclude(l => l.Place)
            .Include(c => c.ItemContainers)
            .ThenInclude(ic => ic.Item)
            .ThenInclude(i => i.Category)
            .Include(c => c.ItemContainers)
            .ThenInclude(ic => ic.Item)
            .ThenInclude(i => i.Media)
            .Include(c => c.QrCodes)
            .FirstOrDefaultAsync(c => c.Id == containerId && c.UserId == userId, cancellationToken);

        if (container == null)
        {
            return ApiResponse<ContainerDetailDto>.Fail("Container not found.");
        }

        var userLocations = await _context.Locations
            .Where(l => l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var path = userLocations.TryGetValue(container.LocationId, out var loc)
            ? LocationService.BuildLocationPath(loc, userLocations, loc.Place?.Name ?? "Place")
            : "Unknown";

        var activeQr = container.QrCodes.FirstOrDefault(q => q.IsActive);

        var items = container.ItemContainers
            .Where(ic => !ic.Item.IsDeleted)
            .Select(ic =>
            {
                var i = ic.Item;
                var primaryMedia = i.Media.FirstOrDefault();
                return new ItemDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Description = i.Description,
                    Brand = i.Brand,
                    Model = i.Model,
                    SerialNumber = i.SerialNumber,
                    Quantity = i.Quantity,
                    Condition = i.Condition,
                    IsImportant = i.IsImportant,
                    LocationId = i.LocationId,
                    LocationPath = path,
                    CategoryId = i.CategoryId,
                    CategoryName = i.Category?.Name ?? "General",
                    CategoryIcon = i.Category?.Icon ?? "category",
                    CategoryColorHex = i.Category?.ColorHex ?? "#3B82F6",
                    PrimaryImageUrl = primaryMedia?.StorageUrl,
                    PrimaryThumbnailUrl = primaryMedia?.ThumbnailUrl,
                    ContainerName = container.Name,
                    CreatedAt = i.CreatedAt
                };
            }).ToList();

        var detail = new ContainerDetailDto
        {
            Id = container.Id,
            Name = container.Name,
            Description = container.Description,
            Type = container.Type,
            PhotoUrl = container.PhotoUrl,
            QRCode = container.QRCode,
            QrToken = activeQr?.Token,
            LocationId = container.LocationId,
            LocationPath = path,
            ItemsCount = items.Count,
            Items = items
        };

        return ApiResponse<ContainerDetailDto>.Ok(detail);
    }

    public async Task<ApiResponse<ContainerDto>> CreateContainerAsync(CreateContainerDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return ApiResponse<ContainerDto>.Fail("Container name is required.");
        }

        var location = await _context.Locations
            .Include(l => l.Place)
            .FirstOrDefaultAsync(l => l.Id == dto.LocationId && l.Place.UserId == userId, cancellationToken);

        if (location == null)
        {
            return ApiResponse<ContainerDto>.Fail("Selected location not found.");
        }

        var tokenBytes = new byte[16];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        var secureToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();

        var container = new Container
        {
            UserId = userId,
            LocationId = dto.LocationId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Type = string.IsNullOrWhiteSpace(dto.Type) ? "Box" : dto.Type.Trim(),
            PhotoUrl = dto.PhotoUrl?.Trim(),
            QRCode = string.IsNullOrWhiteSpace(dto.QRCode) ? $"BOX-{Guid.NewGuid():N}"[..7].ToUpper() : dto.QRCode.Trim(),
            QrCodes = new List<ContainerQrCode>
            {
                new ContainerQrCode
                {
                    Token = secureToken,
                    IsActive = true,
                    IsPublic = false
                }
            }
        };

        _context.Containers.Add(container);
        await _context.SaveChangesAsync(cancellationToken);

        var userLocations = await _context.Locations
            .Where(l => l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var path = LocationService.BuildLocationPath(location, userLocations, location.Place?.Name ?? "Place");

        return ApiResponse<ContainerDto>.Ok(new ContainerDto
        {
            Id = container.Id,
            Name = container.Name,
            Description = container.Description,
            Type = container.Type,
            PhotoUrl = container.PhotoUrl,
            QRCode = container.QRCode,
            QrToken = secureToken,
            LocationId = container.LocationId,
            LocationPath = path,
            ItemsCount = 0
        }, "Container created successfully.");
    }

    public async Task<ApiResponse<QrScanResultDto>> ScanQrCodeAsync(string token, Guid userId, CancellationToken cancellationToken = default)
    {
        var qrCode = await _context.ContainerQrCodes
            .Include(q => q.Container)
            .ThenInclude(c => c.Location)
            .ThenInclude(l => l.Place)
            .Include(q => q.Container)
            .ThenInclude(c => c.ItemContainers)
            .ThenInclude(ic => ic.Item)
            .ThenInclude(i => i.Category)
            .Include(q => q.Container)
            .ThenInclude(c => c.ItemContainers)
            .ThenInclude(ic => ic.Item)
            .ThenInclude(i => i.Media)
            .FirstOrDefaultAsync(q => q.Token == token && q.IsActive, cancellationToken);

        if (qrCode == null || qrCode.Container == null || qrCode.Container.IsDeleted)
        {
            return ApiResponse<QrScanResultDto>.Fail("QR code is invalid or has expired.");
        }

        // Check ownership or public scan permission
        if (qrCode.Container.UserId != userId && !qrCode.IsPublic)
        {
            return ApiResponse<QrScanResultDto>.Fail("You don't have permission to view this container.");
        }

        var container = qrCode.Container;
        var userLocations = await _context.Locations
            .Where(l => l.Place.UserId == container.UserId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var path = userLocations.TryGetValue(container.LocationId, out var loc)
            ? LocationService.BuildLocationPath(loc, userLocations, loc.Place?.Name ?? "Place")
            : "Unknown";

        var items = container.ItemContainers
            .Where(ic => !ic.Item.IsDeleted)
            .Select(ic =>
            {
                var i = ic.Item;
                var primaryMedia = i.Media.FirstOrDefault();
                return new ItemDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Description = i.Description,
                    Brand = i.Brand,
                    Model = i.Model,
                    Quantity = i.Quantity,
                    Condition = i.Condition,
                    IsImportant = i.IsImportant,
                    LocationId = i.LocationId,
                    LocationPath = path,
                    CategoryId = i.CategoryId,
                    CategoryName = i.Category?.Name ?? "General",
                    CategoryIcon = i.Category?.Icon ?? "category",
                    CategoryColorHex = i.Category?.ColorHex ?? "#3B82F6",
                    PrimaryImageUrl = primaryMedia?.StorageUrl,
                    PrimaryThumbnailUrl = primaryMedia?.ThumbnailUrl,
                    ContainerName = container.Name,
                    CreatedAt = i.CreatedAt
                };
            }).ToList();

        return ApiResponse<QrScanResultDto>.Ok(new QrScanResultDto
        {
            ContainerId = container.Id,
            ContainerName = container.Name,
            ContainerType = container.Type,
            LocationPath = path,
            Items = items
        });
    }

    public async Task<ApiResponse<string>> GenerateQrCodeTokenAsync(Guid containerId, Guid userId, CancellationToken cancellationToken = default)
    {
        var container = await _context.Containers
            .Include(c => c.QrCodes)
            .FirstOrDefaultAsync(c => c.Id == containerId && c.UserId == userId, cancellationToken);

        if (container == null)
        {
            return ApiResponse<string>.Fail("Container not found.");
        }

        // Deactivate old tokens
        foreach (var qr in container.QrCodes)
        {
            qr.IsActive = false;
        }

        var tokenBytes = new byte[16];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        var newToken = Convert.ToHexString(tokenBytes).ToLowerInvariant();

        container.QrCodes.Add(new ContainerQrCode
        {
            Token = newToken,
            IsActive = true,
            IsPublic = false
        });

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<string>.Ok(newToken, "New QR Token generated successfully.");
    }
}
