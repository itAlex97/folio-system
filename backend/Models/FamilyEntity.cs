namespace backend.Models;

public class FamilyEntity
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public string Name { get; set; } = string.Empty;

    public ProgramEntity Program { get; set; } = null!;
    public ICollection<EngineeringChangeEntity> EngineeringChanges { get; set; } = [];
}
