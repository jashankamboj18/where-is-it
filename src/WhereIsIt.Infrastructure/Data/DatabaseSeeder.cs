using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WhereIsIt.Domain.Entities;

namespace WhereIsIt.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (!await context.Categories.AnyAsync(c => c.IsSystemCategory))
        {
            var defaultCategories = new List<Category>
            {
                new Category { Name = "Documents", Icon = "description", ColorHex = "#3B82F6", IsSystemCategory = true },
                new Category { Name = "Electronics", Icon = "devices", ColorHex = "#10B981", IsSystemCategory = true },
                new Category { Name = "Clothing", Icon = "checkroom", ColorHex = "#F59E0B", IsSystemCategory = true },
                new Category { Name = "Kitchen", Icon = "kitchen", ColorHex = "#EF4444", IsSystemCategory = true },
                new Category { Name = "Tools", Icon = "build", ColorHex = "#8B5CF6", IsSystemCategory = true },
                new Category { Name = "Medicine", Icon = "medication", ColorHex = "#EC4899", IsSystemCategory = true },
                new Category { Name = "Vehicles", Icon = "directions_car", ColorHex = "#06B6D4", IsSystemCategory = true },
                new Category { Name = "Accessories", Icon = "watch", ColorHex = "#6366F1", IsSystemCategory = true },
                new Category { Name = "Books", Icon = "menu_book", ColorHex = "#14B8A6", IsSystemCategory = true },
                new Category { Name = "Sports", Icon = "sports_soccer", ColorHex = "#84CC16", IsSystemCategory = true },
                new Category { Name = "Travel", Icon = "flight", ColorHex = "#F97316", IsSystemCategory = true },
                new Category { Name = "Other", Icon = "inventory_2", ColorHex = "#6B7280", IsSystemCategory = true }
            };

            await context.Categories.AddRangeAsync(defaultCategories);
            await context.SaveChangesAsync();
        }
    }
}
