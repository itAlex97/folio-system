namespace backend.Contracts;

public class LoginResponseDto
{
    public AuthenticatedUserDto User { get; set; } = null!;
}
