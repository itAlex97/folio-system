namespace backend.Models;

public class ProgramEntity
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }

    public ICollection<FamilyEntity> Families { get; set; } = [];
    public ICollection<CarLeaderEntity> CarLeaders { get; set; } = [];
    public ICollection<DreEntity> Dres { get; set; } = [];
    public ICollection<UserEntity> Users { get; set; } = [];
    public ICollection<EngineeringChangeEntity> EngineeringChanges { get; set; } = [];
}
