using backend.Contracts;
using backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddDbContext<EngineeringRegistryDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("EngineeringRegistryDb")));

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("AllowFrontend");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/health", () => new { status = "ok" });

app.MapGet("/api/engineering-changes", async (EngineeringRegistryDbContext dbContext) =>
{
    var documents = await dbContext.EngineeringChanges
        .AsNoTracking()
        .Include(change => change.Program)
        .Include(change => change.DocumentType)
        .Include(change => change.Family)
        .Include(change => change.ResponsibleEngineer)
        .OrderByDescending(change => change.CreatedAt)
        .Select(change => new EngineeringChangeDto
        {
            Id = change.Id,
            Folio = change.Folio,
            Type = change.DocumentType.Code,
            Program = change.Program.Code,
            Family = change.Family.Name,
            Responsible = change.ResponsibleEngineer.Name,
            Status = change.Status,
            Created = change.CreatedAt.ToString("yyyy-MM-dd"),
            Title = change.Title,
            Description = change.Description,
            ClosedAt = change.ClosedAt.HasValue
                ? change.ClosedAt.Value.ToString("yyyy-MM-dd")
                : null
        })
        .ToListAsync();

    return Results.Ok(documents);
});

app.MapGet("/api/engineering-changes/{id:int}", async (int id, EngineeringRegistryDbContext dbContext) =>
{
    var document = await dbContext.EngineeringChanges
        .AsNoTracking()
        .Include(change => change.Program)
        .Include(change => change.DocumentType)
        .Include(change => change.Family)
        .Include(change => change.ResponsibleEngineer)
        .Where(change => change.Id == id)
        .Select(change => new EngineeringChangeDto
        {
            Id = change.Id,
            Folio = change.Folio,
            Type = change.DocumentType.Code,
            Program = change.Program.Code,
            Family = change.Family.Name,
            Responsible = change.ResponsibleEngineer.Name,
            Status = change.Status,
            Created = change.CreatedAt.ToString("yyyy-MM-dd"),
            Title = change.Title,
            Description = change.Description,
            ClosedAt = change.ClosedAt.HasValue
                ? change.ClosedAt.Value.ToString("yyyy-MM-dd")
                : null
        })
        .SingleOrDefaultAsync();

    return document is null ? Results.NotFound() : Results.Ok(document);
});

app.Run();
