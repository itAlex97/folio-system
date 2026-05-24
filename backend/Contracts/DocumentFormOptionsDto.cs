namespace backend.Contracts;

public sealed class DocumentFormOptionsDto
{
    public IReadOnlyList<DocumentTypeOptionDto> DocumentTypes { get; init; } = [];
    public IReadOnlyList<ProgramOptionDto> Programs { get; init; } = [];
    public IReadOnlyList<FamilyOptionDto> Families { get; init; } = [];
    public IReadOnlyList<CarLeaderOptionDto> CarLeaders { get; init; } = [];
    public IReadOnlyList<DreOptionDto> Dres { get; init; } = [];
    public IReadOnlyList<ResponsibleEngineerOptionDto> ResponsibleEngineers { get; init; } = [];
}

public sealed class DocumentTypeOptionDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public sealed class ProgramOptionDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public sealed class FamilyOptionDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ProgramCode { get; init; } = string.Empty;
}

public sealed class CarLeaderOptionDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ProgramCode { get; init; } = string.Empty;
}

public sealed class DreOptionDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ProgramCode { get; init; } = string.Empty;
}

public sealed class ResponsibleEngineerOptionDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string ProgramCode { get; init; } = string.Empty;
}
