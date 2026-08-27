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
using WhereIsIt.Infrastructure.Services;
using Xunit;

namespace WhereIsIt.Tests;

public class MockFileStorageService : IFileStorageService
{
    public Task<(string storageUrl, string? thumbnailUrl)> SaveFileAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(("/uploads/test.jpg", (string?)"/uploads/test.jpg"));
    }

    public Task<bool> DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(true);
    }
}

public class WhereIsItDomainAndServiceTests
{
    private DbContextOptions<AppDbContext> CreateNewContextOptions()
    {
        return new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public void LocationHierarchy_BuildsCorrectBreadcrumbPath()
    {
        // Arrange: Home -> Bedroom -> Study Table -> Top Drawer -> Blue Folder
        var place = new Place { Id = Guid.NewGuid(), Name = "Home" };
        var bedroom = new Location { Id = Guid.NewGuid(), PlaceId = place.Id, Name = "Bedroom" };
        var studyTable = new Location { Id = Guid.NewGuid(), PlaceId = place.Id, ParentLocationId = bedroom.Id, Name = "Study Table" };
        var topDrawer = new Location { Id = Guid.NewGuid(), PlaceId = place.Id, ParentLocationId = studyTable.Id, Name = "Top Drawer" };
        var blueFolder = new Location { Id = Guid.NewGuid(), PlaceId = place.Id, ParentLocationId = topDrawer.Id, Name = "Blue Folder" };

        var lookup = new Dictionary<Guid, Location>
        {
            [bedroom.Id] = bedroom,
            [studyTable.Id] = studyTable,
            [topDrawer.Id] = topDrawer,
            [blueFolder.Id] = blueFolder
        };

        // Act
        var path = LocationService.BuildLocationPath(blueFolder, lookup, place.Name);

        // Assert
        Assert.Equal("Home → Bedroom → Study Table → Top Drawer → Blue Folder", path);
    }

    [Fact]
    public async Task SearchService_FindsItem_WithFuzzyAndExactMatches()
    {
        var options = CreateNewContextOptions();
        var userId = Guid.NewGuid();

        // Arrange
        using (var context = new AppDbContext(options))
        {
            var user = new User { Id = userId, FirstName = "Balvinder", LastName = "Singh", Email = "test@example.com", PasswordHash = "hash" };
            var place = new Place { Id = Guid.NewGuid(), UserId = user.Id, Name = "Home" };
            var bedroom = new Location { Id = Guid.NewGuid(), PlaceId = place.Id, Name = "Bedroom" };
            var drawer = new Location { Id = Guid.NewGuid(), PlaceId = place.Id, ParentLocationId = bedroom.Id, Name = "Drawer" };
            var category = new Category { Id = Guid.NewGuid(), Name = "Documents" };

            var passport = new Item
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                LocationId = drawer.Id,
                CategoryId = category.Id,
                Name = "Passport",
                Description = "Indian Passport",
                IsImportant = true
            };

            var charger = new Item
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                LocationId = bedroom.Id,
                CategoryId = category.Id,
                Name = "MacBook Charger",
                Brand = "Apple"
            };

            context.Users.Add(user);
            context.Places.Add(place);
            context.Locations.AddRange(bedroom, drawer);
            context.Categories.Add(category);
            context.Items.AddRange(passport, charger);
            await context.SaveChangesAsync();
        }

        // Act & Assert
        using (var context = new AppDbContext(options))
        {
            var searchService = new SearchService(context);

            var resultPass = await searchService.SearchAsync("pass", userId);
            Assert.True(resultPass.Success);
            Assert.Contains(resultPass.Data!.Items, i => i.Name == "Passport");

            var resultCharger = await searchService.SearchAsync("charger", userId);
            Assert.True(resultCharger.Success);
            Assert.Contains(resultCharger.Data!.Items, i => i.Name == "MacBook Charger");
        }
    }

    [Fact]
    public async Task ItemService_QuickMove_RecordsLocationHistory()
    {
        var options = CreateNewContextOptions();
        var userId = Guid.NewGuid();
        var itemId = Guid.NewGuid();
        var drawerId = Guid.NewGuid();
        var lockerId = Guid.NewGuid();

        // Arrange
        using (var context = new AppDbContext(options))
        {
            var user = new User { Id = userId, FirstName = "Balvinder", LastName = "Singh", Email = "test@example.com", PasswordHash = "hash" };
            var place = new Place { Id = Guid.NewGuid(), UserId = user.Id, Name = "Home" };
            var drawer = new Location { Id = drawerId, PlaceId = place.Id, Name = "Study Drawer" };
            var locker = new Location { Id = lockerId, PlaceId = place.Id, Name = "Locker" };
            var category = new Category { Id = Guid.NewGuid(), Name = "Documents" };

            var item = new Item
            {
                Id = itemId,
                UserId = user.Id,
                LocationId = drawer.Id,
                CategoryId = category.Id,
                Name = "Passport"
            };

            context.Users.Add(user);
            context.Places.Add(place);
            context.Locations.AddRange(drawer, locker);
            context.Categories.Add(category);
            context.Items.Add(item);
            await context.SaveChangesAsync();
        }

        // Act: Move Passport from Study Drawer to Locker
        using (var context = new AppDbContext(options))
        {
            var mockFileStorage = new MockFileStorageService();
            var itemService = new ItemService(context, mockFileStorage);

            var moveResult = await itemService.MoveItemAsync(itemId, new MoveItemDto
            {
                NewLocationId = lockerId,
                Reason = "Moved to safe storage"
            }, userId);

            Assert.True(moveResult.Success);
        }

        // Assert
        using (var context = new AppDbContext(options))
        {
            var updatedItem = await context.Items.Include(i => i.LocationHistories).FirstAsync(i => i.Id == itemId);
            Assert.Equal(lockerId, updatedItem.LocationId);
            Assert.Single(updatedItem.LocationHistories);
            Assert.Equal(drawerId, updatedItem.LocationHistories.First().PreviousLocationId);
            Assert.Equal(lockerId, updatedItem.LocationHistories.First().NewLocationId);
            Assert.Equal("Moved to safe storage", updatedItem.LocationHistories.First().Reason);
        }
    }
}
