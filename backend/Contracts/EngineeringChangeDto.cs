namespace backend.Contracts;

public sealed class EngineeringChangeDto
{
    public int Id { get; init; }
    public int FamilyId { get; init; }
    public int ResponsibleEngineerId { get; init; }
    public string Folio { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Program { get; init; } = string.Empty;
    public string Family { get; init; } = string.Empty;
    public string Responsible { get; init; } = string.Empty;
    public string CreatedBy { get; init; } = string.Empty;
    public string? ModelYear { get; init; }
    public string? Phase { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Created { get; init; } = string.Empty;
    public string? ClosedAt { get; init; }
    public int? CarLeaderId { get; init; }
    public string? CarLeader { get; init; }
    public string? ChangeDescription { get; init; }
    public string? AssociatedDocument { get; init; }
    public string? Composite { get; init; }
    public string? Issue { get; init; }
    public int? DreId { get; init; }
    public string? DreName { get; init; }
}
