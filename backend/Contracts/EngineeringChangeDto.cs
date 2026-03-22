namespace backend.Contracts;

public sealed class EngineeringChangeDto
{
    public int Id { get; init; }
    public string Folio { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Program { get; init; } = string.Empty;
    public string Family { get; init; } = string.Empty;
    public string Responsible { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Created { get; init; } = string.Empty;
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? ClosedAt { get; init; }
}
