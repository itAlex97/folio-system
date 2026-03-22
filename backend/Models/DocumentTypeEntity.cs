namespace backend.Models;

public class DocumentTypeEntity
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }

    public ICollection<EngineeringChangeEntity> EngineeringChanges { get; set; } = [];
}
