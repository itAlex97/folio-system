namespace backend.Contracts;

public sealed class CreateEngineeringChangeRequestDto
{
    public string Type { get; init; } = string.Empty;
    public string ProgramCode { get; init; } = string.Empty;
    public int FamilyId { get; init; }
    public int ResponsibleEngineerId { get; init; }
    public string? ModelYear { get; init; }
    public string? Phase { get; init; }
    public string? CarLeader { get; init; }
    public string? ChangeDescription { get; init; }
    public string? AssociatedDocument { get; init; }
    public string? Composite { get; init; }
    public string? Issue { get; init; }
    public string? Target { get; init; }
}
