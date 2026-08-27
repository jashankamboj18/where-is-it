using System;
using System.Collections.Generic;
using WhereIsIt.Domain.Enums;

namespace WhereIsIt.Application.DTOs;

public class PlaceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PlaceType Type { get; set; }
    public string Icon { get; set; } = "home";
    public string? Address { get; set; }
    public bool IsDefault { get; set; }
    public int LocationsCount { get; set; }
    public int ItemsCount { get; set; }
}

public class CreatePlaceDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PlaceType Type { get; set; } = PlaceType.Home;
    public string Icon { get; set; } = "home";
    public string? Address { get; set; }
    public bool IsDefault { get; set; } = false;
}

public class UpdatePlaceDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PlaceType Type { get; set; }
    public string Icon { get; set; } = "home";
    public string? Address { get; set; }
    public bool IsDefault { get; set; }
}

public class LocationDto
{
    public Guid Id { get; set; }
    public Guid PlaceId { get; set; }
    public string PlaceName { get; set; } = string.Empty;
    public Guid? ParentLocationId { get; set; }
    public string? ParentLocationName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "room";
    public int SortOrder { get; set; }
    public string FullPath { get; set; } = string.Empty; // e.g. Home → Bedroom → Study Table
    public int SubLocationsCount { get; set; }
    public int ItemsCount { get; set; }
    public int ContainersCount { get; set; }
}

public class CreateLocationDto
{
    public Guid PlaceId { get; set; }
    public Guid? ParentLocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "room";
    public int SortOrder { get; set; } = 0;
}

public class UpdateLocationDto
{
    public Guid? ParentLocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "room";
    public int SortOrder { get; set; }
}

public class LocationTreeNodeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "room";
    public Guid? ParentLocationId { get; set; }
    public List<LocationTreeNodeDto> Children { get; set; } = new List<LocationTreeNodeDto>();
    public int ItemsCount { get; set; }
    public int ContainersCount { get; set; }
}
