using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Application.Interfaces;
using WhereIsIt.Domain.Entities;
using WhereIsIt.Domain.Enums;
using WhereIsIt.Infrastructure.Data;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Infrastructure.Services;

public class ReminderService : IReminderService
{
    private readonly AppDbContext _context;

    public ReminderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<ItemReminderDto>>> GetUpcomingRemindersAsync(Guid userId, int daysAhead = 30, CancellationToken cancellationToken = default)
    {
        var targetDate = DateTime.UtcNow.AddDays(daysAhead);

        var reminders = await _context.ItemReminders
            .Include(r => r.Item)
            .Where(r => r.Item.UserId == userId && !r.IsCompleted && r.IsEnabled && r.ReminderDate <= targetDate)
            .OrderBy(r => r.ReminderDate)
            .Select(r => new ItemReminderDto
            {
                Id = r.Id,
                ItemId = r.ItemId,
                ItemName = r.Item.Name,
                ReminderType = r.ReminderType,
                ReminderDate = r.ReminderDate,
                RepeatRule = r.RepeatRule,
                Note = r.Note,
                IsCompleted = r.IsCompleted,
                IsEnabled = r.IsEnabled
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<ItemReminderDto>>.Ok(reminders);
    }

    public async Task<ApiResponse<ItemReminderDto>> CreateReminderAsync(CreateReminderDto dto, Guid userId, CancellationToken cancellationToken = default)
    {
        var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == dto.ItemId && i.UserId == userId, cancellationToken);
        if (item == null)
        {
            return ApiResponse<ItemReminderDto>.Fail("Item not found.");
        }

        var reminder = new ItemReminder
        {
            ItemId = dto.ItemId,
            ReminderType = dto.ReminderType,
            ReminderDate = dto.ReminderDate,
            RepeatRule = dto.RepeatRule,
            Note = dto.Note,
            IsCompleted = false,
            IsEnabled = true
        };

        _context.ItemReminders.Add(reminder);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<ItemReminderDto>.Ok(new ItemReminderDto
        {
            Id = reminder.Id,
            ItemId = reminder.ItemId,
            ItemName = item.Name,
            ReminderType = reminder.ReminderType,
            ReminderDate = reminder.ReminderDate,
            RepeatRule = reminder.RepeatRule,
            Note = reminder.Note,
            IsCompleted = reminder.IsCompleted,
            IsEnabled = reminder.IsEnabled
        }, "Reminder created successfully.");
    }

    public async Task<ApiResponse<bool>> CompleteReminderAsync(Guid reminderId, Guid userId, CancellationToken cancellationToken = default)
    {
        var reminder = await _context.ItemReminders
            .Include(r => r.Item)
            .FirstOrDefaultAsync(r => r.Id == reminderId && r.Item.UserId == userId, cancellationToken);

        if (reminder == null)
        {
            return ApiResponse<bool>.Fail("Reminder not found.");
        }

        reminder.IsCompleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Reminder marked as completed.");
    }
}

public class SyncService : ISyncService
{
    private readonly AppDbContext _context;

    public SyncService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<SyncBatchResponseDto>> ProcessSyncBatchAsync(SyncBatchRequestDto request, Guid userId, CancellationToken cancellationToken = default)
    {
        var response = new SyncBatchResponseDto();

        foreach (var op in request.Operations)
        {
            try
            {
                var queueItem = new SyncQueue
                {
                    UserId = userId,
                    EntityType = op.EntityType,
                    EntityId = op.EntityId,
                    Operation = op.Operation,
                    Payload = op.JsonPayload,
                    Status = SyncStatus.Synced,
                    LastAttemptAt = DateTime.UtcNow
                };

                _context.SyncQueues.Add(queueItem);

                response.Results.Add(new SyncResultItemDto
                {
                    ClientOperationId = op.ClientOperationId,
                    Success = true,
                    ServerEntityId = op.EntityId
                });

                response.SuccessCount++;
            }
            catch (Exception ex)
            {
                response.Results.Add(new SyncResultItemDto
                {
                    ClientOperationId = op.ClientOperationId,
                    Success = false,
                    ErrorMessage = ex.Message
                });
            }

            response.ProcessedCount++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<SyncBatchResponseDto>.Ok(response, "Sync batch processed successfully.");
    }
}
