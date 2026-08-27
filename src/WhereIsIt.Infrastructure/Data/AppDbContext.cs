using System;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using WhereIsIt.Domain.Common;
using WhereIsIt.Domain.Entities;

namespace WhereIsIt.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<UserDevice> UserDevices => Set<UserDevice>();
    public DbSet<Place> Places => Set<Place>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<ItemMedia> ItemMedia => Set<ItemMedia>();
    public DbSet<Container> Containers => Set<Container>();
    public DbSet<ItemContainer> ItemContainers => Set<ItemContainer>();
    public DbSet<ContainerQrCode> ContainerQrCodes => Set<ContainerQrCode>();
    public DbSet<ItemReminder> ItemReminders => Set<ItemReminder>();
    public DbSet<ItemLocationHistory> ItemLocationHistories => Set<ItemLocationHistory>();
    public DbSet<SharedItem> SharedItems => Set<SharedItem>();
    public DbSet<ItemPermission> ItemPermissions => Set<ItemPermission>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SyncQueue> SyncQueues => Set<SyncQueue>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global query filter for soft delete
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<Place>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<Location>().HasQueryFilter(l => !l.IsDeleted);
        modelBuilder.Entity<Item>().HasQueryFilter(i => !i.IsDeleted);
        modelBuilder.Entity<Container>().HasQueryFilter(c => !c.IsDeleted);

        // User indexes & configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.PhoneNumber);
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
        });

        // Place configuration
        modelBuilder.Entity<Place>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Places)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Location hierarchy configuration
        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PlaceId);
            entity.HasIndex(e => e.ParentLocationId);
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();

            entity.HasOne(e => e.Place)
                  .WithMany(p => p.Locations)
                  .HasForeignKey(e => e.PlaceId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ParentLocation)
                  .WithMany(l => l.SubLocations)
                  .HasForeignKey(e => e.ParentLocationId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
        });

        // Item configuration
        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.LocationId);
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.Name);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.PurchasePrice).HasPrecision(18, 2);

            if (Database.IsSqlServer())
            {
                entity.Property(e => e.RowVersion).IsRowVersion();
            }

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Items)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Location)
                  .WithMany(l => l.Items)
                  .HasForeignKey(e => e.LocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Items)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Container configuration
        modelBuilder.Entity<Container>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.LocationId);
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Containers)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Location)
                  .WithMany(l => l.Containers)
                  .HasForeignKey(e => e.LocationId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ItemContainer join table
        modelBuilder.Entity<ItemContainer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ItemId, e.ContainerId }).IsUnique();

            entity.HasOne(e => e.Item)
                  .WithMany(i => i.ItemContainers)
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Container)
                  .WithMany(c => c.ItemContainers)
                  .HasForeignKey(e => e.ContainerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Container QR Code
        modelBuilder.Entity<ContainerQrCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.Token).HasMaxLength(100).IsRequired();

            entity.HasOne(e => e.Container)
                  .WithMany(c => c.QrCodes)
                  .HasForeignKey(e => e.ContainerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ItemReminders
        modelBuilder.Entity<ItemReminder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ItemId);
            entity.HasIndex(e => e.ReminderDate);

            entity.HasOne(e => e.Item)
                  .WithMany(i => i.Reminders)
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ItemLocationHistory
        modelBuilder.Entity<ItemLocationHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ItemId);
            entity.HasIndex(e => e.ChangedAt);

            entity.HasOne(e => e.Item)
                  .WithMany(i => i.LocationHistories)
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.PreviousLocation)
                  .WithMany()
                  .HasForeignKey(e => e.PreviousLocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.NewLocation)
                  .WithMany()
                  .HasForeignKey(e => e.NewLocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ChangedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ChangedBy)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // SharedItem
        modelBuilder.Entity<SharedItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.ItemId, e.SharedWithUserId }).IsUnique();

            entity.HasOne(e => e.Item)
                  .WithMany(i => i.SharedItems)
                  .HasForeignKey(e => e.ItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.SharedWithUser)
                  .WithMany()
                  .HasForeignKey(e => e.SharedWithUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsRead);
            entity.Property(e => e.Title).HasMaxLength(200).IsRequired();

            entity.HasOne(e => e.User)
                  .WithMany(u => u.Notifications)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // SyncQueue
        modelBuilder.Entity<SyncQueue>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Status });

            entity.HasOne(e => e.User)
                  .WithMany(u => u.SyncQueues)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
