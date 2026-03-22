namespace backend.Models;

public class EngineeringChangeDcnDetailEntity
{
    public int EngineeringChangeId { get; set; }
    public string? CarLeader { get; set; }
    public string? AssociatedDocument { get; set; }
    public string? ChangeDescription { get; set; }

    public EngineeringChangeEntity EngineeringChange { get; set; } = null!;
}
