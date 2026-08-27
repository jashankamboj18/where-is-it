using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Application.Interfaces;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Api.Controllers;

[Authorize]
public class ItemsController : BaseApiController
{
    private readonly IItemService _itemService;

    public ItemsController(IItemService itemService)
    {
        _itemService = itemService;
    }

    [HttpGet]
    public async Task<IActionResult> GetItems([FromQuery] Guid? placeId, [FromQuery] Guid? locationId, [FromQuery] Guid? categoryId, [FromQuery] bool? isImportant, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var result = await _itemService.GetItemsAsync(CurrentUserId, placeId, locationId, categoryId, isImportant, page, pageSize, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetItemById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _itemService.GetItemByIdAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateItem([FromBody] CreateItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _itemService.CreateItemAsync(dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _itemService.UpdateItemAsync(id, dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/move")]
    public async Task<IActionResult> MoveItem(Guid id, [FromBody] MoveItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _itemService.MoveItemAsync(id, dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id, CancellationToken cancellationToken)
    {
        var result = await _itemService.DeleteItemAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/photos")]
    public async Task<IActionResult> UploadPhoto(Guid id, IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<ItemMediaDto>.Fail("No file uploaded."));
        }

        using var stream = file.OpenReadStream();
        var result = await _itemService.AddItemMediaAsync(id, CurrentUserId, stream, file.FileName, file.ContentType, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("bulk-move")]
    public async Task<IActionResult> BulkMove([FromBody] BulkMoveItemsDto dto, CancellationToken cancellationToken)
    {
        var result = await _itemService.BulkMoveItemsAsync(dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("valuation")]
    public async Task<IActionResult> GetValuation(CancellationToken cancellationToken)
    {
        var result = await _itemService.GetInventoryValuationAsync(CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}

[Authorize]
public class ContainersController : BaseApiController
{
    private readonly IContainerService _containerService;

    public ContainersController(IContainerService containerService)
    {
        _containerService = containerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetContainers([FromQuery] Guid? locationId, CancellationToken cancellationToken)
    {
        var result = await _containerService.GetContainersAsync(CurrentUserId, locationId, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetContainerById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _containerService.GetContainerByIdAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateContainer([FromBody] CreateContainerDto dto, CancellationToken cancellationToken)
    {
        var result = await _containerService.CreateContainerAsync(dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("scan/{token}")]
    public async Task<IActionResult> ScanQrCode(string token, CancellationToken cancellationToken)
    {
        var result = await _containerService.ScanQrCodeAsync(token, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/generate-qr")]
    public async Task<IActionResult> GenerateQrCode(Guid id, CancellationToken cancellationToken)
    {
        var result = await _containerService.GenerateQrCodeTokenAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}

[Authorize]
public class SearchController : BaseApiController
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken cancellationToken)
    {
        var result = await _searchService.SearchAsync(q, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}

[Authorize]
public class RemindersController : BaseApiController
{
    private readonly IReminderService _reminderService;

    public RemindersController(IReminderService reminderService)
    {
        _reminderService = reminderService;
    }

    [HttpGet]
    public async Task<IActionResult> GetReminders([FromQuery] int daysAhead = 30, CancellationToken cancellationToken = default)
    {
        var result = await _reminderService.GetUpcomingRemindersAsync(CurrentUserId, daysAhead, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReminder([FromBody] CreateReminderDto dto, CancellationToken cancellationToken)
    {
        var result = await _reminderService.CreateReminderAsync(dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}/complete")]
    public async Task<IActionResult> CompleteReminder(Guid id, CancellationToken cancellationToken)
    {
        var result = await _reminderService.CompleteReminderAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}

[Authorize]
public class SyncController : BaseApiController
{
    private readonly ISyncService _syncService;

    public SyncController(ISyncService syncService)
    {
        _syncService = syncService;
    }

    [HttpPost]
    public async Task<IActionResult> ProcessBatch([FromBody] SyncBatchRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _syncService.ProcessSyncBatchAsync(request, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}

[Authorize]
public class MediaController : BaseApiController
{
    private readonly IFileStorageService _fileStorageService;

    public MediaController(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<string>.Fail("No file uploaded."));
        }

        using var stream = file.OpenReadStream();
        var (url, _) = await _fileStorageService.SaveFileAsync(stream, file.FileName, file.ContentType, cancellationToken);
        return HandleResult(ApiResponse<string>.Ok(url, "File uploaded successfully."));
    }
}
