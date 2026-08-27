using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Application.Interfaces;
using WhereIsIt.Domain.Entities;
using WhereIsIt.Infrastructure.Data;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly AppDbContext _context;

    public SearchService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<SearchResultDto>> SearchAsync(string query, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return ApiResponse<SearchResultDto>.Ok(new SearchResultDto
            {
                Query = string.Empty,
                TotalMatches = 0,
                Items = new List<ItemDto>(),
                Containers = new List<ContainerDto>(),
                Locations = new List<LocationDto>()
            });
        }

        var normalized = NormalizeSearchTerm(query);
        var searchTerms = ExpandMultilingualTerms(query, normalized);

        // Fetch location lookup to build path
        var userLocations = await _context.Locations
            .Where(l => l.Place.UserId == userId)
            .ToDictionaryAsync(l => l.Id, cancellationToken);

        // Search Items
        var itemsQuery = _context.Items
            .Include(i => i.Location)
            .ThenInclude(l => l.Place)
            .Include(i => i.Category)
            .Include(i => i.Media)
            .Include(i => i.ItemContainers)
            .ThenInclude(ic => ic.Container)
            .Where(i => i.UserId == userId && !i.IsArchived);

        var matchedItems = new List<Item>();
        foreach (var term in searchTerms)
        {
            var termMatches = await itemsQuery
                .Where(i => EF.Functions.Like(i.Name, $"%{term}%") ||
                            (i.Description != null && EF.Functions.Like(i.Description, $"%{term}%")) ||
                            (i.Brand != null && EF.Functions.Like(i.Brand, $"%{term}%")) ||
                            (i.Model != null && EF.Functions.Like(i.Model, $"%{term}%")) ||
                            (i.Category != null && EF.Functions.Like(i.Category.Name, $"%{term}%")) ||
                            (i.Location != null && EF.Functions.Like(i.Location.Name, $"%{term}%")))
                .OrderByDescending(i => i.IsImportant)
                .ThenByDescending(i => i.CreatedAt)
                .Take(30)
                .ToListAsync(cancellationToken);

            foreach (var match in termMatches)
            {
                if (!matchedItems.Any(m => m.Id == match.Id))
                {
                    matchedItems.Add(match);
                }
            }
        }

        // In-memory keyword fallback for fuzzy multi-word matches (e.g. "laptop charger")
        if (matchedItems.Count == 0 && searchTerms.Count > 1)
        {
            var allItems = await itemsQuery.Take(100).ToListAsync(cancellationToken);
            matchedItems = allItems.Where(i =>
            {
                var combined = $"{i.Name} {i.Description} {i.Brand} {i.Category?.Name} {i.Location?.Name}".ToLowerInvariant();
                return searchTerms.Any(k => combined.Contains(k.ToLowerInvariant()));
            }).ToList();
        }

        var itemDtos = matchedItems.Select(i =>
        {
            var path = userLocations.TryGetValue(i.LocationId, out var loc)
                ? LocationService.BuildLocationPath(loc, userLocations, loc.Place?.Name ?? "Place")
                : "Unknown";

            var primaryMedia = i.Media.FirstOrDefault();
            var primaryContainer = i.ItemContainers.FirstOrDefault()?.Container;

            return new ItemDto
            {
                Id = i.Id,
                Name = i.Name,
                Description = i.Description,
                Brand = i.Brand,
                Model = i.Model,
                SerialNumber = i.SerialNumber,
                PurchaseDate = i.PurchaseDate,
                PurchasePrice = i.PurchasePrice,
                Quantity = i.Quantity,
                Condition = i.Condition,
                IsImportant = i.IsImportant,
                IsArchived = i.IsArchived,
                LocationId = i.LocationId,
                LocationName = i.Location?.Name ?? "Location",
                LocationPath = path,
                PlaceName = i.Location?.Place?.Name ?? "Place",
                CategoryId = i.CategoryId,
                CategoryName = i.Category?.Name ?? "General",
                CategoryIcon = i.Category?.Icon ?? "category",
                CategoryColorHex = i.Category?.ColorHex ?? "#3B82F6",
                PrimaryImageUrl = primaryMedia?.StorageUrl,
                PrimaryThumbnailUrl = primaryMedia?.ThumbnailUrl,
                ContainerName = primaryContainer?.Name,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            };
        }).ToList();

        // Search Containers
        var matchedContainers = await _context.Containers
            .Include(c => c.Location)
            .ThenInclude(l => l.Place)
            .Include(c => c.ItemContainers)
            .Where(c => c.UserId == userId &&
                       (EF.Functions.Like(c.Name, $"%{query}%") ||
                        (c.Description != null && EF.Functions.Like(c.Description, $"%{query}%")) ||
                        (c.QRCode != null && EF.Functions.Like(c.QRCode, $"%{query}%"))))
            .Take(10)
            .ToListAsync(cancellationToken);

        var containerDtos = matchedContainers.Select(c =>
        {
            var path = userLocations.TryGetValue(c.LocationId, out var loc)
                ? LocationService.BuildLocationPath(loc, userLocations, loc.Place?.Name ?? "Place")
                : "Unknown";

            return new ContainerDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Type = c.Type,
                PhotoUrl = c.PhotoUrl,
                QRCode = c.QRCode,
                LocationId = c.LocationId,
                LocationPath = path,
                ItemsCount = c.ItemContainers.Count(ic => !ic.Item.IsDeleted)
            };
        }).ToList();

        // Search Locations
        var matchedLocations = userLocations.Values
            .Where(l => l.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                       (l.Description != null && l.Description.Contains(query, StringComparison.OrdinalIgnoreCase)))
            .Take(10)
            .Select(l => new LocationDto
            {
                Id = l.Id,
                PlaceId = l.PlaceId,
                PlaceName = l.Place?.Name ?? "Place",
                ParentLocationId = l.ParentLocationId,
                Name = l.Name,
                Description = l.Description,
                Icon = l.Icon,
                SortOrder = l.SortOrder,
                FullPath = LocationService.BuildLocationPath(l, userLocations, l.Place?.Name ?? "Place"),
                SubLocationsCount = l.SubLocations.Count(s => !s.IsDeleted),
                ItemsCount = l.Items.Count(i => !i.IsDeleted),
                ContainersCount = l.Containers.Count(c => !c.IsDeleted)
            }).ToList();

        var result = new SearchResultDto
        {
            Query = query,
            TotalMatches = itemDtos.Count + containerDtos.Count + matchedLocations.Count,
            Items = itemDtos,
            Containers = containerDtos,
            Locations = matchedLocations
        };

        return ApiResponse<SearchResultDto>.Ok(result);
    }

    private static string NormalizeSearchTerm(string query)
    {
        return Regex.Replace(query.Trim(), @"\s+", " ");
    }

    private static List<string> ExpandMultilingualTerms(string rawQuery, string normalized)
    {
        var terms = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { rawQuery.Trim(), normalized };
        var lower = rawQuery.ToLowerInvariant().Trim();

        var synonymDict = new Dictionary<string, string[]>
        {
            // Phone
            { "फोन", new[] { "phone", "mobile", "smartphone", "iphone" } },
            { "फ़ोन", new[] { "phone", "mobile", "smartphone", "iphone" } },
            { "फ़ोन", new[] { "phone", "mobile", "smartphone", "iphone" } },
            { "मोबाइल", new[] { "phone", "mobile", "smartphone", "iphone" } },
            { "ਫੋਨ", new[] { "phone", "mobile", "smartphone" } },
            { "phone", new[] { "phone", "iphone", "smartphone", "mobile", "फोन" } },

            // Keys
            { "चाबी", new[] { "key", "keys", "lock" } },
            { "चाबियां", new[] { "key", "keys" } },
            { "ਕੁੰਜੀ", new[] { "key", "keys" } },
            { "keys", new[] { "keys", "key", "चाबी" } },

            // Charger
            { "चार्जर", new[] { "charger", "adapter", "cable" } },
            { "ਚਾਰਜਰ", new[] { "charger", "adapter" } },
            { "charger", new[] { "charger", "adapter", "cable", "चार्जर" } },

            // Passport
            { "पासपोर्ट", new[] { "passport", "document" } },
            { "ਪਾਸਪੋਰਟ", new[] { "passport" } },
            { "passport", new[] { "passport", "पासपोर्ट" } },

            // Laptop
            { "लैपटॉप", new[] { "laptop", "macbook", "computer" } },
            { "laptop", new[] { "laptop", "macbook", "लैपटॉप" } },

            // Wallet
            { "वॉलेट", new[] { "wallet", "purse" } },
            { "बटुवा", new[] { "wallet", "purse" } },
            { "wallet", new[] { "wallet", "purse", "वॉलेट" } },

            // Clothes / Jacket
            { "जैकेट", new[] { "jacket", "coat" } },
            { "कपड़े", new[] { "clothes", "jacket" } },
            { "jacket", new[] { "jacket", "coat", "जैकेट" } },

            // Drill
            { "ड्रिल", new[] { "drill", "tool" } },
            { "drill", new[] { "drill", "ड्रिल" } }
        };

        foreach (var kvp in synonymDict)
        {
            if (lower.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase))
            {
                foreach (var syn in kvp.Value)
                {
                    terms.Add(syn);
                }
            }
        }

        return terms.Where(t => !string.IsNullOrWhiteSpace(t)).ToList();
    }
}
