using System;
using System.Collections.Generic;
using WhereIsIt.Domain.Common;
using WhereIsIt.Domain.Enums;

namespace WhereIsIt.Domain.Entities;

public class Place : SoftDeletableEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Name { get; set; } = string.Empty; // e.g. "My Home", "Office"
    public string? Description { get; set; }
    public PlaceType Type { get; set; } = PlaceType.Home;
    public string Icon { get; set; } = "home";
    public string? Address { get; set; }
    public bool IsDefault { get; set; } = false;

    // Navigation properties
    public ICollection<Location> Locations { get; set; } = new List<Location>();
}

public class Location : SoftDeletableEntity
{
    public Guid PlaceId { get; set; }
    public Place Place { get; set; } = null!;

    public Guid? ParentLocationId { get; set; }
    public Location? ParentLocation { get; set; }

    public string Name { get; set; } = string.Empty; // e.g. "Bedroom", "Study Table", "Top Drawer"
    public string? Description { get; set; }
    public string Icon { get; set; } = "room";
    public int SortOrder { get; set; } = 0;

    // Navigation properties
    public ICollection<Location> SubLocations { get; set; } = new List<Location>();
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public ICollection<Container> Containers { get; set; } = new List<Container>();
}
