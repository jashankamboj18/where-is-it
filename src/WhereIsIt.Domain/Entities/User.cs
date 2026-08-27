using System;
using System.Collections.Generic;
using WhereIsIt.Domain.Common;

namespace WhereIsIt.Domain.Entities;

public class User : SoftDeletableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    public bool IsPhoneVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }

    // Refresh Token Management
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Navigation properties
    public UserSettings? Settings { get; set; }
    public ICollection<UserDevice> Devices { get; set; } = new List<UserDevice>();
    public ICollection<Place> Places { get; set; } = new List<Place>();
    public ICollection<Item> Items { get; set; } = new List<Item>();
    public ICollection<Container> Containers { get; set; } = new List<Container>();
    public ICollection<Category> CustomCategories { get; set; } = new List<Category>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<SyncQueue> SyncQueues { get; set; } = new List<SyncQueue>();
}

public class UserSettings : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Language { get; set; } = "en";
    public string Theme { get; set; } = "dark";
    public bool NotificationPreferences { get; set; } = true;
    public bool BiometricLoginPreference { get; set; } = false;
    public Guid? DefaultHomeId { get; set; }
    public string? SearchPreferences { get; set; }
    public string? PrivacySettings { get; set; }
}

public class UserDevice : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string DeviceToken { get; set; } = string.Empty;
    public string Platform { get; set; } = "Android"; // Android, iOS, Web
    public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
}
