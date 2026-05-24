namespace backend.Models;

public class EngineeringChangeBcnDetailEntity
{
    public int EngineeringChangeId { get; set; }
    public int? CarLeaderId { get; set; }
    public string? ChangeDescription { get; set; }

    public EngineeringChangeEntity EngineeringChange { get; set; } = null!;
    public CarLeaderEntity? CarLeader { get; set; }
}
