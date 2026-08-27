using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserEmail { get; }
    bool IsAuthenticated { get; }
}

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email, string fullName);
    string GenerateRefreshToken();
    (Guid userId, string email)? GetPrincipalFromExpiredToken(string token);
}

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> LogoutAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> UpdateProfileAsync(Guid userId, string firstName, string lastName, string? phoneNumber, CancellationToken cancellationToken = default);
}

public interface IPlaceService
{
    Task<ApiResponse<List<PlaceDto>>> GetUserPlacesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<PlaceDto>> GetPlaceByIdAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<PlaceDto>> CreatePlaceAsync(CreatePlaceDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<PlaceDto>> UpdatePlaceAsync(Guid placeId, UpdatePlaceDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeletePlaceAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default);
}

public interface ILocationService
{
    Task<ApiResponse<List<LocationDto>>> GetLocationsByPlaceAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<LocationTreeNodeDto>>> GetLocationTreeAsync(Guid placeId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<LocationDto>> GetLocationByIdAsync(Guid locationId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<LocationDto>> CreateLocationAsync(CreateLocationDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<LocationDto>> UpdateLocationAsync(Guid locationId, UpdateLocationDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteLocationAsync(Guid locationId, Guid userId, CancellationToken cancellationToken = default);
}

public interface ICategoryService
{
    Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto, Guid userId, CancellationToken cancellationToken = default);
}

public interface IItemService
{
    Task<ApiResponse<PagedResult<ItemDto>>> GetItemsAsync(Guid userId, Guid? placeId = null, Guid? locationId = null, Guid? categoryId = null, bool? isImportant = null, int pageNumber = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<ApiResponse<ItemDetailDto>> GetItemByIdAsync(Guid itemId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ItemDto>> CreateItemAsync(CreateItemDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ItemDto>> UpdateItemAsync(Guid itemId, UpdateItemDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ItemDto>> MoveItemAsync(Guid itemId, MoveItemDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> BulkMoveItemsAsync(BulkMoveItemsDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<InventoryValuationDto>> GetInventoryValuationAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteItemAsync(Guid itemId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ItemMediaDto>> AddItemMediaAsync(Guid itemId, Guid userId, Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
}

public interface IContainerService
{
    Task<ApiResponse<List<ContainerDto>>> GetContainersAsync(Guid userId, Guid? locationId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ContainerDetailDto>> GetContainerByIdAsync(Guid containerId, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ContainerDto>> CreateContainerAsync(CreateContainerDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<QrScanResultDto>> ScanQrCodeAsync(string token, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<string>> GenerateQrCodeTokenAsync(Guid containerId, Guid userId, CancellationToken cancellationToken = default);
}

public interface ISearchService
{
    Task<ApiResponse<SearchResultDto>> SearchAsync(string query, Guid userId, CancellationToken cancellationToken = default);
}

public interface IReminderService
{
    Task<ApiResponse<List<ItemReminderDto>>> GetUpcomingRemindersAsync(Guid userId, int daysAhead = 30, CancellationToken cancellationToken = default);
    Task<ApiResponse<ItemReminderDto>> CreateReminderAsync(CreateReminderDto dto, Guid userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> CompleteReminderAsync(Guid reminderId, Guid userId, CancellationToken cancellationToken = default);
}

public interface ISyncService
{
    Task<ApiResponse<SyncBatchResponseDto>> ProcessSyncBatchAsync(SyncBatchRequestDto request, Guid userId, CancellationToken cancellationToken = default);
}

public interface IFileStorageService
{
    Task<(string storageUrl, string? thumbnailUrl)> SaveFileAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<bool> DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default);
}
