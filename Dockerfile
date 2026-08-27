# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy Solution and Project files for layer caching
COPY WhereIsIt.slnx ./
COPY src/WhereIsIt.Shared/*.csproj src/WhereIsIt.Shared/
COPY src/WhereIsIt.Domain/*.csproj src/WhereIsIt.Domain/
COPY src/WhereIsIt.Application/*.csproj src/WhereIsIt.Application/
COPY src/WhereIsIt.Infrastructure/*.csproj src/WhereIsIt.Infrastructure/
COPY src/WhereIsIt.Api/*.csproj src/WhereIsIt.Api/
COPY tests/WhereIsIt.Tests/*.csproj tests/WhereIsIt.Tests/

# Restore dependencies
RUN dotnet restore src/WhereIsIt.Api/WhereIsIt.Api.csproj

# Copy all sources and build
COPY . ./
WORKDIR /app/src/WhereIsIt.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "WhereIsIt.Api.dll"]
