namespace backend.Models;

public class EngineeringChangeBcnDetailEntity
{
    public int EngineeringChangeId { get; set; }
    public string? CarLeader { get; set; }
    public string? ChangeDescription { get; set; }

    public EngineeringChangeEntity EngineeringChange { get; set; } = null!;
}
