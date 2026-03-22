using backend.Contracts;
using backend.Data;
using backend.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);

static EngineeringChangeDto MapEngineeringChange(EngineeringChangeEntity change)
{
    return new EngineeringChangeDto
    {
        Id = change.Id,
        Folio = change.Folio,
        Type = change.DocumentType.Code,
        Program = change.Program.Code,
        Family = change.Family.Name,
        Responsible = change.ResponsibleEngineer.Name,
        CreatedBy = change.CreatedByUser.Name,
        ModelYear = change.ModelYear,
        Phase = change.Phase,
        Status = change.Status,
        Created = change.CreatedAt.ToString("yyyy-MM-dd"),
        ClosedAt = change.ClosedAt?.ToString("yyyy-MM-dd"),
        CarLeader = change.BcnDetail?.CarLeader ?? change.DcnDetail?.CarLeader,
        ChangeDescription = change.BcnDetail?.ChangeDescription ?? change.DcnDetail?.ChangeDescription,
        AssociatedDocument = change.DcnDetail?.AssociatedDocument,
        Composite = change.DfmDetail?.Composite,
        Issue = change.DfmDetail?.Issue,
        Target = change.DfmDetail?.Target
    };
}

static IQueryable<EngineeringChangeEntity> BuildEngineeringChangeQuery(EngineeringRegistryDbContext dbContext)
{
    return dbContext.EngineeringChanges
        .AsNoTracking()
        .Include(change => change.Program)
        .Include(change => change.DocumentType)
        .Include(change => change.Family)
        .Include(change => change.ResponsibleEngineer)
        .Include(change => change.CreatedByUser)
        .Include(change => change.BcnDetail)
        .Include(change => change.DcnDetail)
        .Include(change => change.DfmDetail);
}

static bool HasValue(string? value)
{
    return !string.IsNullOrWhiteSpace(value);
}

static bool TryGetAuthenticatedUserId(HttpContext httpContext, out int userId)
{
    userId = 0;

    if (!httpContext.Request.Headers.TryGetValue("X-Auth-User-Id", out var values))
    {
        return false;
    }

    return int.TryParse(values.ToString(), out userId) && userId > 0;
}

static AuthenticatedUserDto MapAuthenticatedUser(UserEntity user)
{
    return new AuthenticatedUserDto
    {
        Id = user.Id,
        Name = user.Name,
        Username = user.Username,
        Role = user.Role,
        ProgramCode = user.Program.Code,
        ProgramName = user.Program.Name ?? user.Program.Code
    };
}

static bool VerifyPassword(string plainPassword, string storedPassword)
{
    if (string.IsNullOrWhiteSpace(storedPassword))
    {
        return false;
    }

    var parts = storedPassword.Split('$');

    // Backward compatibility: if the value is not a PBKDF2 hash, compare as plain text.
    if (parts.Length != 4 || !string.Equals(parts[0], "PBKDF2", StringComparison.Ordinal))
    {
        return string.Equals(plainPassword, storedPassword, StringComparison.Ordinal);
    }

    if (!int.TryParse(parts[1], out var iterations))
    {
        return false;
    }

    try
    {
        var salt = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            plainPassword,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expected.Length);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
    catch (FormatException)
    {
        return false;
    }
}

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

app.MapPost("/api/auth/login", async (
    LoginRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var normalizedUsername = request.Username?.Trim();
    var password = request.Password?.Trim();

    if (string.IsNullOrWhiteSpace(normalizedUsername) || string.IsNullOrWhiteSpace(password))
    {
        return Results.BadRequest(new { message = "Username and password are required." });
    }

    var user = await dbContext.Users
        .AsNoTracking()
        .Include(item => item.Program)
        .SingleOrDefaultAsync(item =>
            item.IsActive &&
            item.Username.ToLower() == normalizedUsername.ToLower());

    if (user is null || !VerifyPassword(password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new LoginResponseDto
    {
        User = MapAuthenticatedUser(user)
    });
});

app.MapGet("/api/engineering-changes", async (
    string? search,
    string? type,
    string? program,
    string? status,
    string? modelYear,
    string? phase,
    EngineeringRegistryDbContext dbContext) =>
{
    var query = BuildEngineeringChangeQuery(dbContext);

    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(change => change.Folio.Contains(search));
    }

    if (!string.IsNullOrWhiteSpace(type))
    {
        query = query.Where(change => change.DocumentType.Code == type);
    }

    if (!string.IsNullOrWhiteSpace(program))
    {
        query = query.Where(change => change.Program.Code == program);
    }

    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(change => change.Status == status);
    }

    if (!string.IsNullOrWhiteSpace(modelYear))
    {
        query = query.Where(change => change.ModelYear == modelYear);
    }

    if (!string.IsNullOrWhiteSpace(phase))
    {
        query = query.Where(change => change.Phase == phase);
    }

    var documents = await query
        .OrderByDescending(change => change.CreatedAt)
        .ToListAsync();

    return Results.Ok(documents.Select(MapEngineeringChange));
});

app.MapGet("/api/engineering-changes/{id:int}", async (int id, EngineeringRegistryDbContext dbContext) =>
{
    var document = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id)
        .SingleOrDefaultAsync();

    return document is null ? Results.NotFound() : Results.Ok(MapEngineeringChange(document));
});

app.MapGet("/api/document-form-options", async (EngineeringRegistryDbContext dbContext) =>
{
    var documentTypes = await dbContext.DocumentTypes
        .AsNoTracking()
        .OrderBy(documentType => documentType.Code)
        .Select(documentType => new DocumentTypeOptionDto
        {
            Code = documentType.Code,
            Name = documentType.Name ?? documentType.Code
        })
        .ToListAsync();

    var programs = await dbContext.Programs
        .AsNoTracking()
        .OrderBy(program => program.Code)
        .Select(program => new ProgramOptionDto
        {
            Code = program.Code,
            Name = program.Name ?? program.Code
        })
        .ToListAsync();

    var families = await dbContext.Families
        .AsNoTracking()
        .Include(family => family.Program)
        .OrderBy(family => family.Program.Code)
        .ThenBy(family => family.Name)
        .Select(family => new FamilyOptionDto
        {
            Id = family.Id,
            Name = family.Name,
            ProgramCode = family.Program.Code
        })
        .ToListAsync();

    var responsibleEngineers = await dbContext.Users
        .AsNoTracking()
        .Include(user => user.Program)
        .Where(user => user.IsActive && user.Role.ToUpper() == "ENGINEER")
        .OrderBy(user => user.Program.Code)
        .ThenBy(user => user.Name)
        .Select(user => new ResponsibleEngineerOptionDto
        {
            Id = user.Id,
            Name = user.Name,
            ProgramCode = user.Program.Code
        })
        .ToListAsync();

    return Results.Ok(new DocumentFormOptionsDto
    {
        DocumentTypes = documentTypes,
        Programs = programs,
        Families = families,
        ResponsibleEngineers = responsibleEngineers
    });
});

app.MapPatch("/api/engineering-changes/{id:int}/close", async (int id, EngineeringRegistryDbContext dbContext) =>
{
    var document = await dbContext.EngineeringChanges
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    if (document.Status != "OPEN")
    {
        return Results.BadRequest(new { message = "Only OPEN documents can be closed." });
    }

    document.Status = "CLOSED";
    document.ClosedAt = DateTime.UtcNow;

    await dbContext.SaveChangesAsync();

    var updatedDocument = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id)
        .SingleAsync();

    return Results.Ok(MapEngineeringChange(updatedDocument));
});

app.MapPatch("/api/engineering-changes/{id:int}/cancel", async (int id, EngineeringRegistryDbContext dbContext) =>
{
    var document = await dbContext.EngineeringChanges
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    if (document.Status != "OPEN")
    {
        return Results.BadRequest(new { message = "Only OPEN documents can be cancelled." });
    }

    document.Status = "CANCELLED";
    document.ClosedAt = DateTime.UtcNow;

    await dbContext.SaveChangesAsync();

    var updatedDocument = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id)
        .SingleAsync();

    return Results.Ok(MapEngineeringChange(updatedDocument));
});

app.MapPost("/api/engineering-changes", async (
    HttpContext httpContext,
    CreateEngineeringChangeRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var normalizedType = request.Type?.Trim() ?? string.Empty;
    var normalizedProgramCode = request.ProgramCode?.Trim() ?? string.Empty;
    var normalizedModelYear = request.ModelYear?.Trim();
    var normalizedPhase = request.Phase?.Trim();
    var normalizedCarLeader = request.CarLeader?.Trim();
    var normalizedChangeDescription = request.ChangeDescription?.Trim();
    var normalizedAssociatedDocument = request.AssociatedDocument?.Trim();
    var normalizedComposite = request.Composite?.Trim();
    var normalizedIssue = request.Issue?.Trim();
    var normalizedTarget = request.Target?.Trim();

    if (string.IsNullOrWhiteSpace(normalizedType))
    {
        return Results.BadRequest(new { message = "Document type is required." });
    }

    if (string.IsNullOrWhiteSpace(normalizedProgramCode))
    {
        return Results.BadRequest(new { message = "Program is required." });
    }

    if (request.FamilyId <= 0)
    {
        return Results.BadRequest(new { message = "Family is required." });
    }

    if (request.ResponsibleEngineerId <= 0)
    {
        return Results.BadRequest(new { message = "Responsible engineer is required." });
    }

    if (!TryGetAuthenticatedUserId(httpContext, out var creatorUserId))
    {
        return Results.Unauthorized();
    }

    if (string.IsNullOrWhiteSpace(normalizedModelYear))
    {
        return Results.BadRequest(new { message = "Model year is required." });
    }

    if (string.IsNullOrWhiteSpace(normalizedPhase))
    {
        return Results.BadRequest(new { message = "Phase is required." });
    }

    switch (normalizedType)
    {
        case "BCN":
            if (!HasValue(normalizedCarLeader))
            {
                return Results.BadRequest(new { message = "Car leader is required for BCN." });
            }

            if (!HasValue(normalizedChangeDescription))
            {
                return Results.BadRequest(new { message = "Change description is required for BCN." });
            }

            if (HasValue(normalizedAssociatedDocument) ||
                HasValue(normalizedComposite) ||
                HasValue(normalizedIssue) ||
                HasValue(normalizedTarget))
            {
                return Results.BadRequest(new { message = "BCN contains fields that belong to another document type." });
            }
            break;

        case "DCN":
            if (!HasValue(normalizedCarLeader))
            {
                return Results.BadRequest(new { message = "Car leader is required for DCN." });
            }

            if (!HasValue(normalizedChangeDescription))
            {
                return Results.BadRequest(new { message = "Change description is required for DCN." });
            }

            if (HasValue(normalizedComposite) ||
                HasValue(normalizedIssue) ||
                HasValue(normalizedTarget))
            {
                return Results.BadRequest(new { message = "DCN contains fields that belong to another document type." });
            }
            break;

        case "DFM":
            if (!HasValue(normalizedComposite))
            {
                return Results.BadRequest(new { message = "Composite is required for DFM." });
            }

            if (!HasValue(normalizedIssue))
            {
                return Results.BadRequest(new { message = "Issue is required for DFM." });
            }

            if (!HasValue(normalizedTarget))
            {
                return Results.BadRequest(new { message = "Target is required for DFM." });
            }

            if (HasValue(normalizedCarLeader) ||
                HasValue(normalizedChangeDescription) ||
                HasValue(normalizedAssociatedDocument))
            {
                return Results.BadRequest(new { message = "DFM contains fields that belong to another document type." });
            }
            break;

        default:
            return Results.BadRequest(new { message = "Unsupported document type." });
    }

    await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);

    var program = await dbContext.Programs
        .SingleOrDefaultAsync(item => item.Code == normalizedProgramCode);

    if (program is null)
    {
        return Results.BadRequest(new { message = "Selected program was not found." });
    }

    var documentType = await dbContext.DocumentTypes
        .SingleOrDefaultAsync(item => item.Code == normalizedType);

    if (documentType is null)
    {
        return Results.BadRequest(new { message = "Selected document type was not found." });
    }

    var family = await dbContext.Families
        .SingleOrDefaultAsync(item => item.Id == request.FamilyId);

    if (family is null || family.ProgramId != program.Id)
    {
        return Results.BadRequest(new { message = "Selected family does not belong to the chosen program." });
    }

    var responsibleEngineer = await dbContext.Users
        .SingleOrDefaultAsync(item =>
            item.Id == request.ResponsibleEngineerId &&
            item.IsActive &&
            item.Role.ToUpper() == "ENGINEER");

    if (responsibleEngineer is null || responsibleEngineer.ProgramId != program.Id)
    {
        return Results.BadRequest(new { message = "Selected responsible engineer does not belong to the chosen program." });
    }

    var createdByUser = await dbContext.Users
        .SingleOrDefaultAsync(item => item.Id == creatorUserId && item.IsActive);

    if (createdByUser is null || createdByUser.ProgramId != program.Id)
    {
        return Results.BadRequest(new { message = "Creator user does not belong to the chosen program." });
    }

    var year = DateTime.UtcNow.Year;
    var generatedFolioParameter = new SqlParameter("@GeneratedFolio", SqlDbType.NVarChar, 50)
    {
        Direction = ParameterDirection.Output,
    };

    await dbContext.Database.ExecuteSqlRawAsync(
        """
        EXEC GenerateEngineeringFolio
            @ProgramId,
            @DocumentTypeId,
            @Year,
            @GeneratedFolio OUTPUT
        """,
        new SqlParameter("@ProgramId", program.Id),
        new SqlParameter("@DocumentTypeId", documentType.Id),
        new SqlParameter("@Year", year),
        generatedFolioParameter);

    var folio = generatedFolioParameter.Value?.ToString();

    if (string.IsNullOrWhiteSpace(folio))
    {
        return Results.Problem("The folio stored procedure did not return a value.");
    }

    var engineeringChange = new EngineeringChangeEntity
    {
        Folio = folio,
        ProgramId = program.Id,
        DocumentTypeId = documentType.Id,
        FamilyId = family.Id,
        ResponsibleEngineerId = responsibleEngineer.Id,
        CreatedByUserId = createdByUser.Id,
        ModelYear = normalizedModelYear,
        Phase = normalizedPhase,
        Status = "OPEN",
        CreatedAt = DateTime.UtcNow
    };

    dbContext.EngineeringChanges.Add(engineeringChange);

    switch (documentType.Code)
    {
        case "BCN":
            dbContext.EngineeringChangeBcnDetails.Add(new EngineeringChangeBcnDetailEntity
            {
                EngineeringChange = engineeringChange,
                CarLeader = normalizedCarLeader,
                ChangeDescription = normalizedChangeDescription
            });
            break;
        case "DCN":
            dbContext.EngineeringChangeDcnDetails.Add(new EngineeringChangeDcnDetailEntity
            {
                EngineeringChange = engineeringChange,
                CarLeader = normalizedCarLeader,
                AssociatedDocument = normalizedAssociatedDocument,
                ChangeDescription = normalizedChangeDescription
            });
            break;
        case "DFM":
            dbContext.EngineeringChangeDfmDetails.Add(new EngineeringChangeDfmDetailEntity
            {
                EngineeringChange = engineeringChange,
                Composite = normalizedComposite,
                Issue = normalizedIssue,
                Target = normalizedTarget
            });
            break;
        default:
            return Results.BadRequest(new { message = "Unsupported document type." });
    }

    await dbContext.SaveChangesAsync();
    await transaction.CommitAsync();

    var createdDocument = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == engineeringChange.Id)
        .SingleAsync();

    return Results.Created($"/api/engineering-changes/{createdDocument.Id}", MapEngineeringChange(createdDocument));
});

app.Run();
