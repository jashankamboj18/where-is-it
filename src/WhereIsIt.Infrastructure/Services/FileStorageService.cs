using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using WhereIsIt.Application.Interfaces;

namespace WhereIsIt.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _uploadDirectory;

    public FileStorageService(IConfiguration configuration)
    {
        var basePath = configuration["Storage:BasePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var relativeFolder = configuration["Storage:UploadFolder"] ?? "uploads";
        _uploadDirectory = Path.Combine(basePath, relativeFolder);

        if (!Directory.Exists(_uploadDirectory))
        {
            Directory.CreateDirectory(_uploadDirectory);
        }
    }

    public async Task<(string storageUrl, string? thumbnailUrl)> SaveFileAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension)) extension = ".jpg";

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var destinationPath = Path.Combine(_uploadDirectory, uniqueFileName);

        using (var fileStream = new FileStream(destinationPath, FileMode.Create))
        {
            await stream.CopyToAsync(fileStream, cancellationToken);
        }

        var relativeUrl = $"/uploads/{uniqueFileName}";
        return (relativeUrl, relativeUrl);
    }

    public Task<bool> DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            var fileName = Path.GetFileName(storageUrl);
            var filePath = Path.Combine(_uploadDirectory, fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return Task.FromResult(true);
            }
        }
        catch
        {
            // Ignore deletion failures
        }

        return Task.FromResult(false);
    }
}
