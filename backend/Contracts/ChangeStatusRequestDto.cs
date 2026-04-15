namespace backend.Contracts;

public class ChangeStatusRequestDto
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
