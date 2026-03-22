namespace backend.Models;

public class UserEntity
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public ProgramEntity Program { get; set; } = null!;
    public ICollection<EngineeringChangeEntity> ResponsibleEngineeringChanges { get; set; } = [];
    public ICollection<EngineeringChangeEntity> CreatedEngineeringChanges { get; set; } = [];
}
