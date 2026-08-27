using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using WhereIsIt.Shared.Models;

namespace WhereIsIt.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (Guid.TryParse(idClaim, out var id))
            {
                return id;
            }
            throw new UnauthorizedAccessException("User is not authenticated or valid.");
        }
    }

    protected IActionResult HandleResult<T>(ApiResponse<T> result)
    {
        if (result.Success)
        {
            return Ok(result);
        }
        return BadRequest(result);
    }
}
