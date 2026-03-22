namespace backend.Models;

public class EngineeringChangeEntity
{
    public int Id { get; set; }
    public string Folio { get; set; } = string.Empty;
    public int ProgramId { get; set; }
    public int DocumentTypeId { get; set; }
    public int FamilyId { get; set; }
    public int ResponsibleEngineerId { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "OPEN";
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public ProgramEntity Program { get; set; } = null!;
    public DocumentTypeEntity DocumentType { get; set; } = null!;
    public FamilyEntity Family { get; set; } = null!;
    public UserEntity ResponsibleEngineer { get; set; } = null!;
}
