namespace backend.Models;

public class UserEntity
{
    public int Id { get; set; }
    public int ProgramId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Location { get; set; }
    public bool IsActive { get; set; }

    public string DisplayName
    {
        get
        {
            var fullName = string.Join(' ', new[] { FirstName, LastName }
                .Where(part => !string.IsNullOrWhiteSpace(part)));

            return string.IsNullOrWhiteSpace(fullName) ? Username : fullName;
        }
    }

    public ProgramEntity Program { get; set; } = null!;
    public ICollection<EngineeringChangeEntity> ResponsibleEngineeringChanges { get; set; } = [];
    public ICollection<EngineeringChangeEntity> CreatedEngineeringChanges { get; set; } = [];
}
