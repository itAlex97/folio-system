namespace backend.Contracts;

public class AuthenticatedUserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public string ProgramName { get; set; } = string.Empty;
}
