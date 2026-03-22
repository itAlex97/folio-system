namespace backend.Models;

public class UserEntity
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public ProgramEntity Program { get; set; } = null!;
    public ICollection<EngineeringChangeEntity> ResponsibleEngineeringChanges { get; set; } = [];
}
