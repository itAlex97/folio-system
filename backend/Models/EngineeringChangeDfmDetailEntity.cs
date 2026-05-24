namespace backend.Models;

public class EngineeringChangeDfmDetailEntity
{
    public int EngineeringChangeId { get; set; }
    public string? Composite { get; set; }
    public string? Issue { get; set; }
    public int? DreId { get; set; }

    public EngineeringChangeEntity EngineeringChange { get; set; } = null!;
    public DreEntity? Dre { get; set; }
}
