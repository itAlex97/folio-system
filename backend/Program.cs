using backend.Contracts;
using backend.Data;
using backend.Middleware;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
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
        FamilyId = change.FamilyId,
        ResponsibleEngineerId = change.ResponsibleEngineerId,
        Folio = change.Folio,
        Type = change.DocumentType.Code,
        Program = change.Program.Code,
        Family = change.Family.Name,
        Responsible = change.ResponsibleEngineer.DisplayName,
        CreatedBy = change.CreatedByUser.DisplayName,
        ModelYear = change.ModelYear,
        Phase = change.Phase,
        Status = change.Status,
        Created = change.CreatedAt.ToString("yyyy-MM-dd"),
        ClosedAt = change.ClosedAt?.ToString("yyyy-MM-dd"),
        CarLeaderId = change.BcnDetail?.CarLeaderId ?? change.DcnDetail?.CarLeaderId,
        CarLeader = change.BcnDetail?.CarLeader?.Name ?? change.DcnDetail?.CarLeader?.Name,
        ChangeDescription = change.BcnDetail?.ChangeDescription ?? change.DcnDetail?.ChangeDescription,
        AssociatedDocument = change.DcnDetail?.AssociatedDocument,
        Composite = change.DfmDetail?.Composite,
        Issue = change.DfmDetail?.Issue,
        DreId = change.DfmDetail?.DreId,
        DreName = change.DfmDetail?.Dre?.Name
    };
}

static (string FirstName, string LastName) SplitDisplayName(string displayName)
{
    var parts = displayName
        .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    if (parts.Length == 0)
    {
        return (string.Empty, string.Empty);
    }

    if (parts.Length == 1)
    {
        return (parts[0], string.Empty);
    }

    return (string.Join(' ', parts[..^1]), parts[^1]);
}

static async Task<CarLeaderEntity?> TryGetProgramCarLeaderAsync(
    EngineeringRegistryDbContext dbContext,
    int programId)
{
    var carLeaders = await dbContext.CarLeaders
        .Where(item => item.ProgramId == programId)
        .OrderBy(item => item.Id)
        .Take(2)
        .ToListAsync();

    return carLeaders.Count == 1 ? carLeaders[0] : null;
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
        .ThenInclude(detail => detail!.CarLeader)
        .Include(change => change.DcnDetail)
        .ThenInclude(detail => detail!.CarLeader)
        .Include(change => change.DfmDetail)
        .ThenInclude(detail => detail!.Dre);
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
        Name = user.DisplayName,
        Username = user.Username,
        Role = user.Role,
        ProgramCode = user.Program.Code,
        ProgramName = user.Program.Name ?? user.Program.Code
    };
}

static bool IsRole(UserEntity user, string role)
{
    return string.Equals(user.Role, role, StringComparison.OrdinalIgnoreCase);
}

static bool CanCancelDocument(UserEntity user, EngineeringChangeEntity document)
{
    return IsAdmin(user) ||
        IsRole(user, "LEADER") ||
        (IsRole(user, "ENGINEER") && user.Id == document.ResponsibleEngineerId);
}

static bool CanCloseDocument(UserEntity user, EngineeringChangeEntity document)
{
    return IsAdmin(user) ||
        (IsRole(user, "ENGINEER") && user.Id == document.ResponsibleEngineerId);
}

static bool IsDrafter(UserEntity user)
{
    return IsRole(user, "DRAFTER");
}

static bool IsEngineer(UserEntity user)
{
    return IsRole(user, "ENGINEER");
}

static bool IsLeader(UserEntity user)
{
    return IsRole(user, "LEADER");
}

static bool IsAdmin(UserEntity user)
{
    return IsRole(user, "ADMIN");
}

static bool IsProgramScopedUser(UserEntity user)
{
    return IsDrafter(user) || IsEngineer(user) || IsLeader(user);
}

static bool VerifyPassword(string plainPassword, string storedPassword)
{
    if (string.IsNullOrWhiteSpace(storedPassword))
    {
        return false;
    }

    var parts = storedPassword.Split('$');

    if (storedPassword.Length == 64 &&
        storedPassword.All(Uri.IsHexDigit))
    {
        var passwordBytes = System.Text.Encoding.UTF8.GetBytes(plainPassword);
        var actualBytes = SHA256.HashData(passwordBytes);
        var actualHash = Convert.ToHexString(actualBytes);

        return CryptographicOperations.FixedTimeEquals(
            System.Text.Encoding.ASCII.GetBytes(actualHash),
            System.Text.Encoding.ASCII.GetBytes(storedPassword.ToUpperInvariant()));
    }

    // Backward compatibility: if the value is not a PBKDF2 or SHA256 hash, compare as plain text.
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

static async Task<UserEntity?> TryGetAuthenticatedActiveUserAsync(
    HttpContext httpContext,
    EngineeringRegistryDbContext dbContext)
{
    if (!TryGetAuthenticatedUserId(httpContext, out var userId))
    {
        return null;
    }

    return await dbContext.Users
        .AsNoTracking()
        .SingleOrDefaultAsync(user => user.Id == userId && user.IsActive);
}

builder.Services.AddCors(options =>
{
    var configuredOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>();

    var allowedOrigins = configuredOrigins?
        .Where(HasValue)
        .Select(origin => origin.Trim().TrimEnd('/'))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();

    if (allowedOrigins is null || allowedOrigins.Length == 0)
    {
        allowedOrigins = new[]
        {
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        };
    }

    options.AddPolicy("AllowFrontend",
        policy =>
        {
            if (allowedOrigins.Contains("*", StringComparer.Ordinal))
            {
                policy.AllowAnyOrigin();
            }
            else
            {
                policy.WithOrigins(allowedOrigins);
            }

            policy.AllowAnyHeader()
                .AllowAnyMethod();
        });
});

builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

builder.Services.AddDbContext<EngineeringRegistryDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("EngineeringRegistryDb")));

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("AllowFrontend");

// Add JWT authentication middleware
app.UseMiddleware<JwtAuthenticationMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/api/health", () => new { status = "ok" });

app.MapPost("/api/auth/login", async (
    LoginRequestDto request,
    EngineeringRegistryDbContext dbContext,
    IJwtTokenGenerator tokenGenerator) =>
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

    var token = tokenGenerator.GenerateToken(user);

    return Results.Ok(new LoginResponseDto
    {
        User = MapAuthenticatedUser(user),
        Token = token
    });
});

app.MapGet("/api/engineering-changes", async (
    HttpContext httpContext,
    string? search,
    string? type,
    string? program,
    string? status,
    string? modelYear,
    string? phase,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

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

    if (IsProgramScopedUser(authenticatedUser))
    {
        query = query.Where(change => change.ProgramId == authenticatedUser.ProgramId);
    }

    var documents = await query
        .OrderByDescending(change => change.CreatedAt)
        .ToListAsync();

    return Results.Ok(documents.Select(MapEngineeringChange));
});

app.MapGet("/api/engineering-changes/{id:int}", async (
    HttpContext httpContext,
    int id,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    var query = BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id);

    if (IsProgramScopedUser(authenticatedUser))
    {
        query = query.Where(change => change.ProgramId == authenticatedUser.ProgramId);
    }

    var document = await query
        .SingleOrDefaultAsync();

    return document is null ? Results.NotFound() : Results.Ok(MapEngineeringChange(document));
});

app.MapGet("/api/document-form-options", async (HttpContext httpContext, EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    var documentTypes = await dbContext.DocumentTypes
        .AsNoTracking()
        .OrderBy(documentType => documentType.Code)
        .Select(documentType => new DocumentTypeOptionDto
        {
            Code = documentType.Code,
            Name = documentType.Name ?? documentType.Code
        })
        .ToListAsync();

    IQueryable<ProgramEntity> programsQuery = dbContext.Programs
        .AsNoTracking();

    if (IsProgramScopedUser(authenticatedUser))
    {
        programsQuery = programsQuery.Where(program => program.Id == authenticatedUser.ProgramId);
    }

    var programs = await programsQuery
        .AsNoTracking()
        .OrderBy(program => program.Code)
        .Select(program => new ProgramOptionDto
        {
            Code = program.Code,
            Name = program.Name ?? program.Code
        })
        .ToListAsync();

    IQueryable<FamilyEntity> familiesQuery = dbContext.Families
        .AsNoTracking()
        .Include(family => family.Program);

    if (IsProgramScopedUser(authenticatedUser))
    {
        familiesQuery = familiesQuery.Where(family => family.ProgramId == authenticatedUser.ProgramId);
    }

    var families = await familiesQuery
        .AsNoTracking()
        .OrderBy(family => family.Program.Code)
        .ThenBy(family => family.Name)
        .Select(family => new FamilyOptionDto
        {
            Id = family.Id,
            Name = family.Name,
            ProgramCode = family.Program.Code
        })
        .ToListAsync();

    IQueryable<CarLeaderEntity> carLeadersQuery = dbContext.CarLeaders
        .AsNoTracking()
        .Include(carLeader => carLeader.Program);

    if (IsProgramScopedUser(authenticatedUser))
    {
        carLeadersQuery = carLeadersQuery.Where(carLeader => carLeader.ProgramId == authenticatedUser.ProgramId);
    }

    var carLeaders = await carLeadersQuery
        .AsNoTracking()
        .OrderBy(carLeader => carLeader.Program.Code)
        .ThenBy(carLeader => carLeader.Name)
        .Select(carLeader => new CarLeaderOptionDto
        {
            Id = carLeader.Id,
            Name = carLeader.Name,
            ProgramCode = carLeader.Program.Code
        })
        .ToListAsync();

    IQueryable<DreEntity> dresQuery = dbContext.Dres
        .AsNoTracking()
        .Include(dre => dre.Program);

    if (IsProgramScopedUser(authenticatedUser))
    {
        dresQuery = dresQuery.Where(dre => dre.ProgramId == authenticatedUser.ProgramId);
    }

    var dres = await dresQuery
        .AsNoTracking()
        .OrderBy(dre => dre.Program.Code)
        .ThenBy(dre => dre.Name)
        .Select(dre => new DreOptionDto
        {
            Id = dre.Id,
            Name = dre.Name,
            ProgramCode = dre.Program.Code
        })
        .ToListAsync();

    IQueryable<UserEntity> responsibleEngineersQuery = dbContext.Users
        .AsNoTracking()
        .Include(user => user.Program)
        .Where(user => user.IsActive && user.Role.ToUpper() == "ENGINEER");

    if (IsProgramScopedUser(authenticatedUser))
    {
        responsibleEngineersQuery = responsibleEngineersQuery.Where(user => user.ProgramId == authenticatedUser.ProgramId);
    }

    var responsibleEngineers = await responsibleEngineersQuery
        .AsNoTracking()
        .OrderBy(user => user.Program.Code)
        .ThenBy(user => user.FirstName)
        .ThenBy(user => user.LastName)
        .Select(user => new ResponsibleEngineerOptionDto
        {
            Id = user.Id,
            Name = (user.FirstName + " " + user.LastName).Trim(),
            ProgramCode = user.Program.Code
        })
        .ToListAsync();

    return Results.Ok(new DocumentFormOptionsDto
    {
        DocumentTypes = documentTypes,
        Programs = programs,
        Families = families,
        CarLeaders = carLeaders,
        Dres = dres,
        ResponsibleEngineers = responsibleEngineers
    });
});

app.MapPatch("/api/engineering-changes/{id:int}", async (
    HttpContext httpContext,
    int id,
    UpdateEngineeringChangeRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    var document = await dbContext.EngineeringChanges
        .Include(change => change.DocumentType)
        .Include(change => change.BcnDetail)
        .Include(change => change.DcnDetail)
        .Include(change => change.DfmDetail)
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    if (document.Status != "OPEN")
    {
        return Results.BadRequest(new { message = "Only OPEN documents can be edited." });
    }

    var isEngineerEditor = IsEngineer(authenticatedUser);
    var isLeaderEditor = IsLeader(authenticatedUser);

    // Engineer can edit only if currently responsible. Leader can edit within their program.
    // Admin can edit OPEN documents in any program.
    if (isEngineerEditor)
    {
        if (authenticatedUser.Id != document.ResponsibleEngineerId)
        {
            return Results.StatusCode(403);
        }
    }
    else if (isLeaderEditor)
    {
        if (authenticatedUser.ProgramId != document.ProgramId)
        {
            return Results.StatusCode(403);
        }
    }
    else if (IsAdmin(authenticatedUser))
    {
        // Admin allowed.
    }
    else
    {
        return Results.StatusCode(403);
    }

    var normalizedModelYear = request.ModelYear?.Trim();
    var normalizedPhase = request.Phase?.Trim();
    var normalizedReassignmentReason = request.ReassignmentReason?.Trim();
    var hasCarLeaderInput = request.CarLeaderId.HasValue;
    var normalizedChangeDescription = request.ChangeDescription?.Trim();
    var normalizedAssociatedDocument = request.AssociatedDocument?.Trim();
    var normalizedComposite = request.Composite?.Trim();
    var normalizedIssue = request.Issue?.Trim();
    var dreId = request.DreId;

    if (request.FamilyId <= 0)
    {
        return Results.BadRequest(new { message = "Family is required." });
    }

    if (request.ResponsibleEngineerId <= 0)
    {
        return Results.BadRequest(new { message = "Responsible engineer is required." });
    }

    if (string.IsNullOrWhiteSpace(normalizedModelYear))
    {
        return Results.BadRequest(new { message = "Model year is required." });
    }

    if (string.IsNullOrWhiteSpace(normalizedPhase))
    {
        return Results.BadRequest(new { message = "Phase is required." });
    }

    var isReassigningResponsible = request.ResponsibleEngineerId != document.ResponsibleEngineerId;
    if (isLeaderEditor && isReassigningResponsible && string.IsNullOrWhiteSpace(normalizedReassignmentReason))
    {
        return Results.BadRequest(new { message = "Reassignment reason is required when leader changes responsible engineer." });
    }

    switch (document.DocumentType.Code)
    {
        case "BCN":
            if (!HasValue(normalizedChangeDescription))
            {
                return Results.BadRequest(new { message = "Change description is required for BCN." });
            }

            if (HasValue(normalizedAssociatedDocument) ||
                HasValue(normalizedComposite) ||
                HasValue(normalizedIssue) ||
                dreId.HasValue)
            {
                return Results.BadRequest(new { message = "BCN contains fields that belong to another document type." });
            }
            break;

        case "DCN":
            if (!HasValue(normalizedChangeDescription))
            {
                return Results.BadRequest(new { message = "Change description is required for DCN." });
            }

            if (HasValue(normalizedComposite) ||
                HasValue(normalizedIssue) ||
                dreId.HasValue)
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

            if (!dreId.HasValue || dreId.Value <= 0)
            {
                return Results.BadRequest(new { message = "DRE is required for DFM." });
            }

            if (hasCarLeaderInput ||
                HasValue(normalizedChangeDescription) ||
                HasValue(normalizedAssociatedDocument))
            {
                return Results.BadRequest(new { message = "DFM contains fields that belong to another document type." });
            }
            break;

        default:
            return Results.BadRequest(new { message = "Unsupported document type." });
    }

    var family = await dbContext.Families
        .SingleOrDefaultAsync(item => item.Id == request.FamilyId);

    if (family is null || family.ProgramId != document.ProgramId)
    {
        return Results.BadRequest(new { message = "Selected family does not belong to the document program." });
    }

    var responsibleEngineer = await dbContext.Users
        .SingleOrDefaultAsync(item =>
            item.Id == request.ResponsibleEngineerId &&
            item.IsActive &&
            item.Role.ToUpper() == "ENGINEER");

    if (responsibleEngineer is null || responsibleEngineer.ProgramId != document.ProgramId)
    {
        return Results.BadRequest(new { message = "Selected responsible engineer does not belong to the document program." });
    }

    CarLeaderEntity? carLeader = null;
    if (document.DocumentType.Code is "BCN" or "DCN")
    {
        carLeader = await TryGetProgramCarLeaderAsync(dbContext, document.ProgramId);

        if (carLeader is null)
        {
            return Results.BadRequest(new { message = "The document program must have exactly one assigned car leader." });
        }
    }

    DreEntity? dre = null;
    if (document.DocumentType.Code == "DFM")
    {
        dre = await dbContext.Dres
            .SingleOrDefaultAsync(item => item.Id == dreId);

        if (dre is null || dre.ProgramId != document.ProgramId)
        {
            return Results.BadRequest(new { message = "Selected DRE does not belong to the document program." });
        }
    }

    document.FamilyId = family.Id;
    document.ResponsibleEngineerId = responsibleEngineer.Id;
    document.ModelYear = normalizedModelYear;
    document.Phase = normalizedPhase;

    switch (document.DocumentType.Code)
    {
        case "BCN":
            document.BcnDetail ??= new EngineeringChangeBcnDetailEntity
            {
                EngineeringChangeId = document.Id
            };
            document.BcnDetail.CarLeaderId = carLeader!.Id;
            document.BcnDetail.ChangeDescription = normalizedChangeDescription;
            break;
        case "DCN":
            document.DcnDetail ??= new EngineeringChangeDcnDetailEntity
            {
                EngineeringChangeId = document.Id
            };
            document.DcnDetail.CarLeaderId = carLeader!.Id;
            document.DcnDetail.AssociatedDocument = normalizedAssociatedDocument;
            document.DcnDetail.ChangeDescription = normalizedChangeDescription;
            break;
        case "DFM":
            document.DfmDetail ??= new EngineeringChangeDfmDetailEntity
            {
                EngineeringChangeId = document.Id
            };
            document.DfmDetail.Composite = normalizedComposite;
            document.DfmDetail.Issue = normalizedIssue;
            document.DfmDetail.DreId = dre!.Id;
            break;
    }

    await dbContext.SaveChangesAsync();

    var updatedDocument = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id)
        .SingleAsync();

    return Results.Ok(MapEngineeringChange(updatedDocument));
});

app.MapPatch("/api/engineering-changes/{id:int}/close", async (
    HttpContext httpContext,
    int id,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    var document = await dbContext.EngineeringChanges
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    if (IsProgramScopedUser(authenticatedUser) && document.ProgramId != authenticatedUser.ProgramId)
    {
        return Results.StatusCode(403);
    }

    if (document.Status != "OPEN")
    {
        return Results.BadRequest(new { message = "Only OPEN documents can be closed." });
    }

    if (!CanCloseDocument(authenticatedUser, document))
    {
        return Results.StatusCode(403);
    }

    document.Status = "CLOSED";
    document.ClosedAt = DateTime.UtcNow;

    await dbContext.SaveChangesAsync();

    var updatedDocument = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id)
        .SingleAsync();

    return Results.Ok(MapEngineeringChange(updatedDocument));
});

app.MapPatch("/api/engineering-changes/{id:int}/cancel", async (
    HttpContext httpContext,
    int id,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    var document = await dbContext.EngineeringChanges
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    if (IsProgramScopedUser(authenticatedUser) && document.ProgramId != authenticatedUser.ProgramId)
    {
        return Results.StatusCode(403);
    }

    if (document.Status != "OPEN")
    {
        return Results.BadRequest(new { message = "Only OPEN documents can be cancelled." });
    }

    if (!CanCancelDocument(authenticatedUser, document))
    {
        return Results.StatusCode(403);
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
    var hasCarLeaderInput = request.CarLeaderId.HasValue;
    var normalizedChangeDescription = request.ChangeDescription?.Trim();
    var normalizedAssociatedDocument = request.AssociatedDocument?.Trim();
    var normalizedComposite = request.Composite?.Trim();
    var normalizedIssue = request.Issue?.Trim();
    var dreId = request.DreId;

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
            if (!HasValue(normalizedChangeDescription))
            {
                return Results.BadRequest(new { message = "Change description is required for BCN." });
            }

            if (HasValue(normalizedAssociatedDocument) ||
                HasValue(normalizedComposite) ||
                HasValue(normalizedIssue) ||
                dreId.HasValue)
            {
                return Results.BadRequest(new { message = "BCN contains fields that belong to another document type." });
            }
            break;

        case "DCN":
            if (!HasValue(normalizedChangeDescription))
            {
                return Results.BadRequest(new { message = "Change description is required for DCN." });
            }

            if (HasValue(normalizedComposite) ||
                HasValue(normalizedIssue) ||
                dreId.HasValue)
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

            if (!dreId.HasValue || dreId.Value <= 0)
            {
                return Results.BadRequest(new { message = "DRE is required for DFM." });
            }

            if (hasCarLeaderInput ||
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

    CarLeaderEntity? carLeader = null;
    if (normalizedType is "BCN" or "DCN")
    {
        carLeader = await TryGetProgramCarLeaderAsync(dbContext, program.Id);

        if (carLeader is null)
        {
            return Results.BadRequest(new { message = "The selected program must have exactly one assigned car leader." });
        }
    }

    DreEntity? dre = null;
    if (normalizedType == "DFM")
    {
        dre = await dbContext.Dres
            .SingleOrDefaultAsync(item => item.Id == dreId);

        if (dre is null || dre.ProgramId != program.Id)
        {
            return Results.BadRequest(new { message = "Selected DRE does not belong to the chosen program." });
        }
    }

    var createdByUser = await dbContext.Users
        .SingleOrDefaultAsync(item => item.Id == creatorUserId && item.IsActive);

    if (createdByUser is null)
    {
        return Results.BadRequest(new { message = "Creator user was not found or is inactive." });
    }

    if (!IsAdmin(createdByUser) && createdByUser.ProgramId != program.Id)
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
                CarLeaderId = carLeader!.Id,
                ChangeDescription = normalizedChangeDescription
            });
            break;
        case "DCN":
            dbContext.EngineeringChangeDcnDetails.Add(new EngineeringChangeDcnDetailEntity
            {
                EngineeringChange = engineeringChange,
                CarLeaderId = carLeader!.Id,
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
                DreId = dre!.Id
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

app.MapPatch("/api/engineering-changes/{id:int}/reopen", async (
    HttpContext httpContext,
    int id,
    ChangeStatusRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    if (string.IsNullOrWhiteSpace(request.Reason))
    {
        return Results.BadRequest(new { message = "Reason is required to reopen a document." });
    }

    var document = await dbContext.EngineeringChanges
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    if (document.Status == "OPEN")
    {
        return Results.BadRequest(new { message = "Document is already OPEN." });
    }

    document.Status = "OPEN";
    document.ClosedAt = null;

    await dbContext.SaveChangesAsync();

    var updatedDocument = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id)
        .SingleAsync();

    return Results.Ok(MapEngineeringChange(updatedDocument));
});

app.MapPatch("/api/engineering-changes/{id:int}/status", async (
    HttpContext httpContext,
    int id,
    ChangeStatusRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var normalizedStatus = request.Status?.Trim().ToUpperInvariant();
    if (normalizedStatus is not ("OPEN" or "CLOSED" or "CANCELLED"))
    {
        return Results.BadRequest(new { message = "Status must be OPEN, CLOSED or CANCELLED." });
    }

    if (string.IsNullOrWhiteSpace(request.Reason))
    {
        return Results.BadRequest(new { message = "Reason is required to change status." });
    }

    var document = await dbContext.EngineeringChanges
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    document.Status = normalizedStatus;
    document.ClosedAt = normalizedStatus == "OPEN" ? null : DateTime.UtcNow;

    await dbContext.SaveChangesAsync();

    var updatedDocument = await BuildEngineeringChangeQuery(dbContext)
        .Where(change => change.Id == id)
        .SingleAsync();

    return Results.Ok(MapEngineeringChange(updatedDocument));
});

app.MapDelete("/api/engineering-changes/{id:int}", async (
    HttpContext httpContext,
    int id,
    [FromBody] DeleteEngineeringChangeRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    if (string.IsNullOrWhiteSpace(request.Reason))
    {
        return Results.BadRequest(new { message = "Reason is required to delete a document." });
    }

    var document = await dbContext.EngineeringChanges
        .Include(change => change.BcnDetail)
        .Include(change => change.DcnDetail)
        .Include(change => change.DfmDetail)
        .SingleOrDefaultAsync(change => change.Id == id);

    if (document is null)
    {
        return Results.NotFound();
    }

    // Exception policy: keep CLOSED documents for historical traceability.
    if (document.Status == "CLOSED")
    {
        return Results.BadRequest(new { message = "CLOSED documents cannot be deleted." });
    }

    if (document.BcnDetail is not null)
    {
        dbContext.EngineeringChangeBcnDetails.Remove(document.BcnDetail);
    }

    if (document.DcnDetail is not null)
    {
        dbContext.EngineeringChangeDcnDetails.Remove(document.DcnDetail);
    }

    if (document.DfmDetail is not null)
    {
        dbContext.EngineeringChangeDfmDetails.Remove(document.DfmDetail);
    }

    dbContext.EngineeringChanges.Remove(document);
    await dbContext.SaveChangesAsync();

    return Results.NoContent();
});

app.MapGet("/api/admin/users", async (
    HttpContext httpContext,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var users = await dbContext.Users
        .AsNoTracking()
        .Include(user => user.Program)
        .OrderBy(user => user.FirstName)
        .ThenBy(user => user.LastName)
        .Select(user => new
        {
            user.Id,
            Name = (user.FirstName + " " + user.LastName).Trim(),
            user.Username,
            user.Role,
            user.IsActive,
            ProgramCode = user.Program.Code,
            ProgramName = user.Program.Name
        })
        .ToListAsync();

    return Results.Ok(users);
});

app.MapPatch("/api/admin/users/{id:int}", async (
    HttpContext httpContext,
    int id,
    AdminUpdateUserRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var user = await dbContext.Users
        .SingleOrDefaultAsync(item => item.Id == id);

    if (user is null)
    {
        return Results.NotFound();
    }

    var normalizedName = request.Name?.Trim();
    var normalizedRole = request.Role?.Trim().ToUpperInvariant();
    var normalizedProgramCode = request.ProgramCode?.Trim().ToUpperInvariant();

    if (string.IsNullOrWhiteSpace(normalizedName) || string.IsNullOrWhiteSpace(normalizedRole) || string.IsNullOrWhiteSpace(normalizedProgramCode))
    {
        return Results.BadRequest(new { message = "Name, role and program code are required." });
    }

    var program = await dbContext.Programs
        .SingleOrDefaultAsync(item => item.Code == normalizedProgramCode);

    if (program is null)
    {
        return Results.BadRequest(new { message = "Program was not found." });
    }

    var (firstName, lastName) = SplitDisplayName(normalizedName);

    user.FirstName = firstName;
    user.LastName = lastName;
    user.Role = normalizedRole;
    user.ProgramId = program.Id;
    user.IsActive = request.IsActive;

    await dbContext.SaveChangesAsync();

    return Results.Ok(new { message = "User updated successfully." });
});

app.MapGet("/api/admin/catalogs", async (
    HttpContext httpContext,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var programs = await dbContext.Programs
        .AsNoTracking()
        .OrderBy(program => program.Code)
        .Select(program => new { program.Code, program.Name })
        .ToListAsync();

    var documentTypes = await dbContext.DocumentTypes
        .AsNoTracking()
        .OrderBy(type => type.Code)
        .Select(type => new { type.Code, type.Name })
        .ToListAsync();

    var families = await dbContext.Families
        .AsNoTracking()
        .Include(family => family.Program)
        .OrderBy(family => family.Program.Code)
        .ThenBy(family => family.Name)
        .Select(family => new
        {
            family.Id,
            family.Name,
            ProgramCode = family.Program.Code
        })
        .ToListAsync();

    return Results.Ok(new { programs, documentTypes, families });
});

app.MapPost("/api/admin/programs", async (
    HttpContext httpContext,
    ProgramOptionDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var normalizedCode = request.Code?.Trim().ToUpperInvariant();
    var normalizedName = request.Name?.Trim();

    if (string.IsNullOrWhiteSpace(normalizedCode))
    {
        return Results.BadRequest(new { message = "Program code is required." });
    }

    var exists = await dbContext.Programs.AnyAsync(program => program.Code == normalizedCode);
    if (exists)
    {
        return Results.BadRequest(new { message = "Program already exists." });
    }

    dbContext.Programs.Add(new ProgramEntity
    {
        Code = normalizedCode,
        Name = normalizedName
    });

    await dbContext.SaveChangesAsync();
    return Results.Ok(new { message = "Program created successfully." });
});

app.MapPost("/api/admin/document-types", async (
    HttpContext httpContext,
    DocumentTypeOptionDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var normalizedCode = request.Code?.Trim().ToUpperInvariant();
    var normalizedName = request.Name?.Trim();

    if (string.IsNullOrWhiteSpace(normalizedCode))
    {
        return Results.BadRequest(new { message = "Document type code is required." });
    }

    var exists = await dbContext.DocumentTypes.AnyAsync(type => type.Code == normalizedCode);
    if (exists)
    {
        return Results.BadRequest(new { message = "Document type already exists." });
    }

    dbContext.DocumentTypes.Add(new DocumentTypeEntity
    {
        Code = normalizedCode,
        Name = normalizedName
    });

    await dbContext.SaveChangesAsync();
    return Results.Ok(new { message = "Document type created successfully." });
});

app.MapPost("/api/admin/families", async (
    HttpContext httpContext,
    CreateFamilyRequestDto request,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var normalizedProgramCode = request.ProgramCode?.Trim().ToUpperInvariant();
    var normalizedName = request.Name?.Trim();

    if (string.IsNullOrWhiteSpace(normalizedProgramCode) || string.IsNullOrWhiteSpace(normalizedName))
    {
        return Results.BadRequest(new { message = "Program code and family name are required." });
    }

    var program = await dbContext.Programs
        .SingleOrDefaultAsync(item => item.Code == normalizedProgramCode);

    if (program is null)
    {
        return Results.BadRequest(new { message = "Program was not found." });
    }

    var exists = await dbContext.Families.AnyAsync(family =>
        family.ProgramId == program.Id && family.Name.ToUpper() == normalizedName.ToUpper());

    if (exists)
    {
        return Results.BadRequest(new { message = "Family already exists for this program." });
    }

    dbContext.Families.Add(new FamilyEntity
    {
        ProgramId = program.Id,
        Name = normalizedName
    });

    await dbContext.SaveChangesAsync();
    return Results.Ok(new { message = "Family created successfully." });
});

app.MapGet("/api/admin/reports/summary", async (
    HttpContext httpContext,
    EngineeringRegistryDbContext dbContext) =>
{
    var authenticatedUser = await TryGetAuthenticatedActiveUserAsync(httpContext, dbContext);
    if (authenticatedUser is null)
    {
        return Results.Unauthorized();
    }

    if (!IsAdmin(authenticatedUser))
    {
        return Results.StatusCode(403);
    }

    var byStatus = await dbContext.EngineeringChanges
        .AsNoTracking()
        .GroupBy(change => change.Status)
        .Select(group => new { Status = group.Key, Count = group.Count() })
        .ToListAsync();

    var byType = await dbContext.EngineeringChanges
        .AsNoTracking()
        .Include(change => change.DocumentType)
        .GroupBy(change => change.DocumentType.Code)
        .Select(group => new { Type = group.Key, Count = group.Count() })
        .ToListAsync();

    var byProgram = await dbContext.EngineeringChanges
        .AsNoTracking()
        .Include(change => change.Program)
        .GroupBy(change => change.Program.Code)
        .Select(group => new { Program = group.Key, Count = group.Count() })
        .ToListAsync();

    var latest = await BuildEngineeringChangeQuery(dbContext)
        .OrderByDescending(change => change.CreatedAt)
        .Take(20)
        .ToListAsync();

    return Results.Ok(new
    {
        byStatus,
        byType,
        byProgram,
        latest = latest.Select(MapEngineeringChange)
    });
});

app.Run();
