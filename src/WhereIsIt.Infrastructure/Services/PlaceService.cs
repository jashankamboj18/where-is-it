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

public class PlaceService : IPlaceService
{
    private readonly AppDbContext _context;

    public PlaceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<PlaceDto>>> GetUserPlacesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var places = await _context.Places
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.Name)
            .Select(p => new PlaceDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Type = p.Type,
                Icon = p.Icon,
                Address = p.Address,
                IsDefault = p.IsDefault,
                LocationsCount = p.Locations.Count(l => !l.IsDeleted),
                ItemsCount = _context.Items.Count(i => !i.IsDeleted && i.Location.PlaceId == p.Id)
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<PlaceDto>>.Ok(places);
    }

    public async Task<ApiResponse<PlaceDto>> GetPlaceByIdAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default)
    {
        var place = await _context.Places
            .Where(p => p.Id == placeId && p.UserId == userId)
            .Select(p => new PlaceDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Type = p.Type,
                Icon = p.Icon,
                Address = p.Address,
                IsDefault = p.IsDefault,
                LocationsCount = p.Locations.Count(l => !l.IsDeleted),
                ItemsCount = _context.Items.Count(i => !i.IsDeleted && i.Location.PlaceId == p.Id)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (place == null)
        {
            return ApiResponse<PlaceDto>.Fail("Place not found.");
        }

        return ApiResponse<PlaceDto>.Ok(place);
    }

    public async Task<ApiResponse<PlaceDto>> CreatePlaceAsync(CreatePlaceDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return ApiResponse<PlaceDto>.Fail("Place name is required.");
        }

        if (dto.IsDefault)
        {
            var currentDefaults = await _context.Places.Where(p => p.UserId == userId && p.IsDefault).ToListAsync(cancellationToken);
            foreach (var cur in currentDefaults)
            {
                cur.IsDefault = false;
            }
        }

        var place = new Place
        {
            UserId = userId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Type = dto.Type,
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "home" : dto.Icon.Trim(),
            Address = dto.Address?.Trim(),
            IsDefault = dto.IsDefault
        };

        _context.Places.Add(place);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<PlaceDto>.Ok(new PlaceDto
        {
            Id = place.Id,
            Name = place.Name,
            Description = place.Description,
            Type = place.Type,
            Icon = place.Icon,
            Address = place.Address,
            IsDefault = place.IsDefault,
            LocationsCount = 0,
            ItemsCount = 0
        }, "Place created successfully.");
    }

    public async Task<ApiResponse<PlaceDto>> UpdatePlaceAsync(Guid placeId, UpdatePlaceDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var place = await _context.Places.FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId, cancellationToken);
        if (place == null)
        {
            return ApiResponse<PlaceDto>.Fail("Place not found.");
        }

        if (dto.IsDefault && !place.IsDefault)
        {
            var currentDefaults = await _context.Places.Where(p => p.UserId == userId && p.IsDefault).ToListAsync(cancellationToken);
            foreach (var cur in currentDefaults)
            {
                cur.IsDefault = false;
            }
        }

        place.Name = dto.Name.Trim();
        place.Description = dto.Description?.Trim();
        place.Type = dto.Type;
        place.Icon = string.IsNullOrWhiteSpace(dto.Icon) ? place.Icon : dto.Icon.Trim();
        place.Address = dto.Address?.Trim();
        place.IsDefault = dto.IsDefault;

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<PlaceDto>.Ok(new PlaceDto
        {
            Id = place.Id,
            Name = place.Name,
            Description = place.Description,
            Type = place.Type,
            Icon = place.Icon,
            Address = place.Address,
            IsDefault = place.IsDefault,
            LocationsCount = await _context.Locations.CountAsync(l => l.PlaceId == place.Id && !l.IsDeleted, cancellationToken),
            ItemsCount = await _context.Items.CountAsync(i => i.Location.PlaceId == place.Id && !i.IsDeleted, cancellationToken)
        }, "Place updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeletePlaceAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default)
    {
        var place = await _context.Places.FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId, cancellationToken);
        if (place == null)
        {
            return ApiResponse<bool>.Fail("Place not found.");
        }

        place.IsDeleted = true;
        place.DeletedAt = DateTime.UtcNow;

        // Soft delete associated locations
        var locations = await _context.Locations.Where(l => l.PlaceId == placeId).ToListAsync(cancellationToken);
        foreach (var loc in locations)
        {
            loc.IsDeleted = true;
            loc.DeletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Place deleted successfully.");
    }
}
