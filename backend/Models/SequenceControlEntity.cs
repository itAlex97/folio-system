namespace backend.Models;

public class SequenceControlEntity
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public int DocumentTypeId { get; set; }
    public int Year { get; set; }
    public int CurrentSequence { get; set; }

    public ProgramEntity Program { get; set; } = null!;
    public DocumentTypeEntity DocumentType { get; set; } = null!;
}
