using System;
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

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return ApiResponse<AuthResponseDto>.Fail("Email and Password are required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
        if (existingUser)
        {
            return ApiResponse<AuthResponseDto>.Fail("An account with this email already exists.");
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            PhoneNumber = request.PhoneNumber?.Trim(),
            PasswordHash = passwordHash,
            IsActive = true,
            LastLoginAt = DateTime.UtcNow,
            Settings = new UserSettings
            {
                Theme = "dark",
                Language = "en",
                NotificationPreferences = true
            }
        };

        // Create default "My Home" Place for the user
        var defaultPlace = new Place
        {
            UserId = user.Id,
            Name = "My Home",
            Type = PlaceType.Home,
            Icon = "home",
            IsDefault = true,
            Description = "Default primary living location"
        };

        // Create default standard rooms inside My Home
        var livingRoom = new Location { Place = defaultPlace, Name = "Living Room", Icon = "weekend", SortOrder = 1 };
        var bedroom = new Location { Place = defaultPlace, Name = "Bedroom", Icon = "bed", SortOrder = 2 };
        var kitchen = new Location { Place = defaultPlace, Name = "Kitchen", Icon = "kitchen", SortOrder = 3 };
        var garage = new Location { Place = defaultPlace, Name = "Garage", Icon = "garage", SortOrder = 4 };

        // Sub-locations inside bedroom
        var studyTable = new Location { Place = defaultPlace, ParentLocation = bedroom, Name = "Study Table", Icon = "desk", SortOrder = 1 };
        var topDrawer = new Location { Place = defaultPlace, ParentLocation = studyTable, Name = "Top Drawer", Icon = "drawer", SortOrder = 1 };
        var cupboard = new Location { Place = defaultPlace, ParentLocation = bedroom, Name = "Cupboard", Icon = "door_sliding", SortOrder = 2 };

        defaultPlace.Locations.Add(livingRoom);
        defaultPlace.Locations.Add(bedroom);
        defaultPlace.Locations.Add(kitchen);
        defaultPlace.Locations.Add(garage);
        defaultPlace.Locations.Add(studyTable);
        defaultPlace.Locations.Add(topDrawer);
        defaultPlace.Locations.Add(cupboard);

        user.Places.Add(defaultPlace);

        // Generate tokens
        var accessToken = _jwtService.GenerateAccessToken(user.Id, user.Email, $"{user.FirstName} {user.LastName}");
        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // Update default home ID in settings
        user.Settings.DefaultHomeId = defaultPlace.Id;
        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            User = userDto
        }, "Registration successful.");
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return ApiResponse<AuthResponseDto>.Fail("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            return ApiResponse<AuthResponseDto>.Fail("Account is deactivated. Please contact support.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        var accessToken = _jwtService.GenerateAccessToken(user.Id, user.Email, $"{user.FirstName} {user.LastName}");
        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            User = userDto
        }, "Login successful.");
    }

    public async Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default)
    {
        var principal = _jwtService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
        {
            return ApiResponse<AuthResponseDto>.Fail("Invalid client access token.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == principal.Value.userId, cancellationToken);
        if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return ApiResponse<AuthResponseDto>.Fail("Invalid or expired refresh token.");
        }

        var newAccessToken = _jwtService.GenerateAccessToken(user.Id, user.Email, $"{user.FirstName} {user.LastName}");
        var newRefreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);

        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            CreatedAt = user.CreatedAt
        };

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            User = userDto
        });
    }

    public async Task<ApiResponse<bool>> LogoutAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<bool>.Ok(true, "Logged out successfully.");
    }

    public async Task<ApiResponse<UserDto>> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
        {
            return ApiResponse<UserDto>.Fail("User not found.");
        }

        return ApiResponse<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            CreatedAt = user.CreatedAt
        });
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(Guid userId, string firstName, string lastName, string? phoneNumber, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null)
        {
            return ApiResponse<UserDto>.Fail("User not found.");
        }

        user.FirstName = firstName.Trim();
        user.LastName = lastName.Trim();
        user.PhoneNumber = phoneNumber?.Trim();
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            CreatedAt = user.CreatedAt
        }, "Profile updated successfully.");
    }
}
