namespace backend.Contracts;

public class LoginResponseDto
{
    public AuthenticatedUserDto User { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
}
