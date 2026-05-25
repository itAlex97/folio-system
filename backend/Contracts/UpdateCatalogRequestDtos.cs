namespace backend.Contracts;

public sealed class UpdateProgramRequestDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public sealed class UpdateDocumentTypeRequestDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public sealed class UpdateFamilyRequestDto
{
    public string ProgramCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}
