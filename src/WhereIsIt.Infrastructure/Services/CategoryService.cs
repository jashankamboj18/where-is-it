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

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var categories = await _context.Categories
            .Where(c => c.IsSystemCategory || c.UserId == userId)
            .OrderByDescending(c => c.IsSystemCategory)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Icon = c.Icon,
                ColorHex = c.ColorHex,
                IsSystemCategory = c.IsSystemCategory,
                ItemsCount = c.Items.Count(i => !i.IsDeleted && i.UserId == userId)
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<CategoryDto>>.Ok(categories);
    }

    public async Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return ApiResponse<CategoryDto>.Fail("Category name is required.");
        }

        var trimmedName = dto.Name.Trim();
        var exists = await _context.Categories.AnyAsync(c => (c.UserId == userId || c.IsSystemCategory) && c.Name.ToLower() == trimmedName.ToLower(), cancellationToken);
        if (exists)
        {
            return ApiResponse<CategoryDto>.Fail("A category with this name already exists.");
        }

        var category = new Category
        {
            UserId = userId,
            Name = trimmedName,
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "category" : dto.Icon.Trim(),
            ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#3B82F6" : dto.ColorHex.Trim(),
            IsSystemCategory = false
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<CategoryDto>.Ok(new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Icon = category.Icon,
            ColorHex = category.ColorHex,
            IsSystemCategory = false,
            ItemsCount = 0
        }, "Category created successfully.");
    }
}
