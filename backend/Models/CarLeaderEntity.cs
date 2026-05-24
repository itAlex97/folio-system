namespace backend.Models;

public class CarLeaderEntity
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public string Name { get; set; } = string.Empty;

    public ProgramEntity Program { get; set; } = null!;
    public ICollection<EngineeringChangeBcnDetailEntity> EngineeringChangeBcnDetails { get; set; } = [];
    public ICollection<EngineeringChangeDcnDetailEntity> EngineeringChangeDcnDetails { get; set; } = [];
}
