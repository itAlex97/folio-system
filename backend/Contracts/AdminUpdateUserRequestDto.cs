namespace backend.Contracts;

public class AdminUpdateUserRequestDto
{
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
