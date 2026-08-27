using System;
using System.IO;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using WhereIsIt.Api.Services;
using WhereIsIt.Application.Interfaces;
using WhereIsIt.Infrastructure.Data;
using WhereIsIt.Infrastructure.Services;
using WhereIsIt.Shared.Models;

var builder = WebApplication.CreateBuilder(args);

// Add Database Context (Auto-detects SQL Server or cloud SQLite)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var isSqlServer = !string.IsNullOrEmpty(connectionString) && (connectionString.Contains("Server=") || connectionString.Contains("database.windows.net") || connectionString.Contains("Trusted_Connection="));

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (isSqlServer)
    {
        options.UseSqlServer(connectionString!, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
    }
    else
    {
        var dbPath = Path.Combine(AppContext.BaseDirectory, "WhereIsIt.db");
        options.UseSqlite($"Data Source={dbPath}");
    }
});

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "WhereIsIt_Production_Super_Secure_Secret_Key_2026_Balvinder_UltraSafe_Key!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "WhereIsIt.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "WhereIsIt.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Register HttpContextAccessor and Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPlaceService, PlaceService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IContainerService, ContainerService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<IReminderService, ReminderService>();
builder.Services.AddScoped<ISyncService, SyncService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Controllers
builder.Services.AddControllers();

// Swagger with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Migrate and Seed Database on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        if (context.Database.IsSqlite())
        {
            context.Database.EnsureCreated();
        }
        else
        {
            context.Database.Migrate();
        }
        DatabaseSeeder.SeedAsync(context).GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database.");
    }
}

// Exception Handling Middleware
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var response = ApiResponse<string>.Fail($"An internal server error occurred: {ex.Message}");
        await context.Response.WriteAsJsonAsync(response);
    }
});

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "WHERE IS IT API v1");
    c.RoutePrefix = "swagger";
});

// Static files for UI and uploaded images
var uploadsDir = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
if (!Directory.Exists(uploadsDir))
{
    Directory.CreateDirectory(uploadsDir);
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
