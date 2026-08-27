using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhereIsIt.Application.DTOs;
using WhereIsIt.Application.Interfaces;

namespace WhereIsIt.Api.Controllers;

[Authorize]
public class PlacesController : BaseApiController
{
    private readonly IPlaceService _placeService;

    public PlacesController(IPlaceService placeService)
    {
        _placeService = placeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPlaces(CancellationToken cancellationToken)
    {
        var result = await _placeService.GetUserPlacesAsync(CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPlaceById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _placeService.GetPlaceByIdAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePlace([FromBody] CreatePlaceDto dto, CancellationToken cancellationToken)
    {
        var result = await _placeService.CreatePlaceAsync(dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePlace(Guid id, [FromBody] UpdatePlaceDto dto, CancellationToken cancellationToken)
    {
        var result = await _placeService.UpdatePlaceAsync(id, dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePlace(Guid id, CancellationToken cancellationToken)
    {
        var result = await _placeService.DeletePlaceAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}

[Authorize]
public class LocationsController : BaseApiController
{
    private readonly ILocationService _locationService;

    public LocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    [HttpGet("by-place/{placeId:guid}")]
    public async Task<IActionResult> GetLocationsByPlace(Guid placeId, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetLocationsByPlaceAsync(placeId, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("tree/{placeId:guid}")]
    public async Task<IActionResult> GetLocationTree(Guid placeId, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetLocationTreeAsync(placeId, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLocationById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetLocationByIdAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLocation([FromBody] CreateLocationDto dto, CancellationToken cancellationToken)
    {
        var result = await _locationService.CreateLocationAsync(dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationDto dto, CancellationToken cancellationToken)
    {
        var result = await _locationService.UpdateLocationAsync(id, dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteLocation(Guid id, CancellationToken cancellationToken)
    {
        var result = await _locationService.DeleteLocationAsync(id, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}

[Authorize]
public class CategoriesController : BaseApiController
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var result = await _categoryService.GetCategoriesAsync(CurrentUserId, cancellationToken);
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto, CancellationToken cancellationToken)
    {
        var result = await _categoryService.CreateCategoryAsync(dto, CurrentUserId, cancellationToken);
        return HandleResult(result);
    }
}
