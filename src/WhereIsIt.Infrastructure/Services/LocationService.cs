using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Application.Interfaces;
using WhereIsIt.Domain.Entities;
using WhereIsIt.Infrastructure.Data;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Infrastructure.Services;

public class LocationService : ILocationService
{
    private readonly AppDbContext _context;

    public LocationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<LocationDto>>> GetLocationsByPlaceAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default)
    {
        var place = await _context.Places.FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId, cancellationToken);
        if (place == null)
        {
            return ApiResponse<List<LocationDto>>.Fail("Place not found.");
        }

        var allLocations = await _context.Locations
            .Include(l => l.Place)
            .Include(l => l.ParentLocation)
            .Include(l => l.SubLocations)
            .Include(l => l.Items)
            .Include(l => l.Containers)
            .Where(l => l.PlaceId == placeId)
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.Name)
            .ToListAsync(cancellationToken);

        var lookup = allLocations.ToDictionary(l => l.Id);
        var dtos = allLocations.Select(l => new LocationDto
        {
            Id = l.Id,
            PlaceId = l.PlaceId,
            PlaceName = l.Place.Name,
            ParentLocationId = l.ParentLocationId,
            ParentLocationName = l.ParentLocation?.Name,
            Name = l.Name,
            Description = l.Description,
            Icon = l.Icon,
            SortOrder = l.SortOrder,
            FullPath = BuildLocationPath(l, lookup, l.Place.Name),
            SubLocationsCount = l.SubLocations.Count(s => !s.IsDeleted),
            ItemsCount = l.Items.Count(i => !i.IsDeleted),
            ContainersCount = l.Containers.Count(c => !c.IsDeleted)
        }).ToList();

        return ApiResponse<List<LocationDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<List<LocationTreeNodeDto>>> GetLocationTreeAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default)
    {
        var place = await _context.Places.FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId, cancellationToken);
        if (place == null)
        {
            return ApiResponse<List<LocationTreeNodeDto>>.Fail("Place not found.");
        }

        var allLocations = await _context.Locations
            .Include(l => l.Items)
            .Include(l => l.Containers)
            .Where(l => l.PlaceId == placeId)
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.Name)
            .ToListAsync(cancellationToken);

        var roots = allLocations.Where(l => l.ParentLocationId == null).ToList();
        var tree = roots.Select(r => BuildTreeNode(r, allLocations)).ToList();

        return ApiResponse<List<LocationTreeNodeDto>>.Ok(tree);
    }

    public async Task<ApiResponse<LocationDto>> GetLocationByIdAsync(Guid locationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var location = await _context.Locations
            .Include(l => l.Place)
            .Include(l => l.ParentLocation)
            .Include(l => l.SubLocations)
            .Include(l => l.Items)
            .Include(l => l.Containers)
            .FirstOrDefaultAsync(l => l.Id == locationId && l.Place.UserId == userId, cancellationToken);

        if (location == null)
        {
            return ApiResponse<LocationDto>.Fail("Location not found.");
        }

        var allPlaceLocations = await _context.Locations
            .Where(l => l.PlaceId == location.PlaceId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var dto = new LocationDto
        {
            Id = location.Id,
            PlaceId = location.PlaceId,
            PlaceName = location.Place.Name,
            ParentLocationId = location.ParentLocationId,
            ParentLocationName = location.ParentLocation?.Name,
            Name = location.Name,
            Description = location.Description,
            Icon = location.Icon,
            SortOrder = location.SortOrder,
            FullPath = BuildLocationPath(location, allPlaceLocations, location.Place.Name),
            SubLocationsCount = location.SubLocations.Count(s => !s.IsDeleted),
            ItemsCount = location.Items.Count(i => !i.IsDeleted),
            ContainersCount = location.Containers.Count(c => !c.IsDeleted)
        };

        return ApiResponse<LocationDto>.Ok(dto);
    }

    public async Task<ApiResponse<LocationDto>> CreateLocationAsync(CreateLocationDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var place = await _context.Places.FirstOrDefaultAsync(p => p.Id == dto.PlaceId && p.UserId == userId, cancellationToken);
        if (place == null)
        {
            return ApiResponse<LocationDto>.Fail("Place not found or not owned by user.");
        }

        if (dto.ParentLocationId.HasValue)
        {
            var parentExists = await _context.Locations.AnyAsync(l => l.Id == dto.ParentLocationId.Value && l.PlaceId == dto.PlaceId, cancellationToken);
            if (!parentExists)
            {
                return ApiResponse<LocationDto>.Fail("Parent location does not belong to the selected Place.");
            }
        }

        var location = new Location
        {
            PlaceId = dto.PlaceId,
            ParentLocationId = dto.ParentLocationId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "room" : dto.Icon.Trim(),
            SortOrder = dto.SortOrder
        };

        _context.Locations.Add(location);
        await _context.SaveChangesAsync(cancellationToken);

        var allPlaceLocations = await _context.Locations
            .Where(l => l.PlaceId == location.PlaceId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var resultDto = new LocationDto
        {
            Id = location.Id,
            PlaceId = location.PlaceId,
            PlaceName = place.Name,
            ParentLocationId = location.ParentLocationId,
            Name = location.Name,
            Description = location.Description,
            Icon = location.Icon,
            SortOrder = location.SortOrder,
            FullPath = BuildLocationPath(location, allPlaceLocations, place.Name),
            SubLocationsCount = 0,
            ItemsCount = 0,
            ContainersCount = 0
        };

        return ApiResponse<LocationDto>.Ok(resultDto, "Location created successfully.");
    }

    public async Task<ApiResponse<LocationDto>> UpdateLocationAsync(Guid locationId, UpdateLocationDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var location = await _context.Locations
            .Include(l => l.Place)
            .FirstOrDefaultAsync(l => l.Id == locationId && l.Place.UserId == userId, cancellationToken);

        if (location == null)
        {
            return ApiResponse<LocationDto>.Fail("Location not found.");
        }

        if (dto.ParentLocationId == locationId)
        {
            return ApiResponse<LocationDto>.Fail("A location cannot be its own parent.");
        }

        location.ParentLocationId = dto.ParentLocationId;
        location.Name = dto.Name.Trim();
        location.Description = dto.Description?.Trim();
        location.Icon = string.IsNullOrWhiteSpace(dto.Icon) ? location.Icon : dto.Icon.Trim();
        location.SortOrder = dto.SortOrder;

        await _context.SaveChangesAsync(cancellationToken);

        var allPlaceLocations = await _context.Locations
            .Where(l => l.PlaceId == location.PlaceId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        var resultDto = new LocationDto
        {
            Id = location.Id,
            PlaceId = location.PlaceId,
            PlaceName = location.Place.Name,
            ParentLocationId = location.ParentLocationId,
            Name = location.Name,
            Description = location.Description,
            Icon = location.Icon,
            SortOrder = location.SortOrder,
            FullPath = BuildLocationPath(location, allPlaceLocations, location.Place.Name),
            SubLocationsCount = await _context.Locations.CountAsync(l => l.ParentLocationId == location.Id && !l.IsDeleted, cancellationToken),
            ItemsCount = await _context.Items.CountAsync(i => i.LocationId == location.Id && !i.IsDeleted, cancellationToken),
            ContainersCount = await _context.Containers.CountAsync(c => c.LocationId == location.Id && !c.IsDeleted, cancellationToken)
        };

        return ApiResponse<LocationDto>.Ok(resultDto, "Location updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteLocationAsync(Guid locationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var location = await _context.Locations
            .Include(l => l.Place)
            .FirstOrDefaultAsync(l => l.Id == locationId && l.Place.UserId == userId, cancellationToken);

        if (location == null)
        {
            return ApiResponse<bool>.Fail("Location not found.");
        }

        location.IsDeleted = true;
        location.DeletedAt = DateTime.UtcNow;

        // Cascade soft delete to sublocations
        var subLocations = await _context.Locations.Where(l => l.ParentLocationId == locationId).ToListAsync(cancellationToken);
        foreach (var sub in subLocations)
        {
            sub.IsDeleted = true;
            sub.DeletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Location deleted successfully.");
    }

    private static LocationTreeNodeDto BuildTreeNode(Location current, List<Location> all)
    {
        var node = new LocationTreeNodeDto
        {
            Id = current.Id,
            Name = current.Name,
            Icon = current.Icon,
            ParentLocationId = current.ParentLocationId,
            ItemsCount = current.Items.Count(i => !i.IsDeleted),
            ContainersCount = current.Containers.Count(c => !c.IsDeleted)
        };

        var children = all.Where(l => l.ParentLocationId == current.Id).OrderBy(l => l.SortOrder).ThenBy(l => l.Name);
        foreach (var child in children)
        {
            node.Children.Add(BuildTreeNode(child, all));
        }

        return node;
    }

    public static string BuildLocationPath(Location loc, Dictionary<Guid, Location> lookup, string placeName)
    {
        var segments = new List<string> { loc.Name };
        var currentParentId = loc.ParentLocationId;

        while (currentParentId.HasValue && lookup.TryGetValue(currentParentId.Value, out var parentLoc))
        {
            segments.Insert(0, parentLoc.Name);
            currentParentId = parentLoc.ParentLocationId;
        }

        segments.Insert(0, placeName);
        return string.Join(" → ", segments);
    }
}
