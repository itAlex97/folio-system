using backend.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Services;

public interface IJwtTokenGenerator
{
    string GenerateToken(UserEntity user);
}

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly IConfiguration _configuration;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(UserEntity user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var issuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured");
        var audience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience not configured");

        if (!int.TryParse(jwtSettings["ExpirationMinutes"], out var expirationMinutes))
        {
            expirationMinutes = 480; // 8 hours default
        }

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.GivenName, user.Username),
            new Claim("Role", user.Role),
            new Claim("ProgramId", user.ProgramId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
