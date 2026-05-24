namespace backend.Contracts;

public sealed class UpdateEngineeringChangeRequestDto
{
    public int FamilyId { get; init; }
    public int ResponsibleEngineerId { get; init; }
    public string? ReassignmentReason { get; init; }
    public string? ModelYear { get; init; }
    public string? Phase { get; init; }
    public int? CarLeaderId { get; init; }
    public string? ChangeDescription { get; init; }
    public string? AssociatedDocument { get; init; }
    public string? Composite { get; init; }
    public string? Issue { get; init; }
    public int? DreId { get; init; }
}
