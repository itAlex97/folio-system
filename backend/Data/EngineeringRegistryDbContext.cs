using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class EngineeringRegistryDbContext(DbContextOptions<EngineeringRegistryDbContext> options)
    : DbContext(options)
{
    public DbSet<ProgramEntity> Programs => Set<ProgramEntity>();
    public DbSet<FamilyEntity> Families => Set<FamilyEntity>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<DocumentTypeEntity> DocumentTypes => Set<DocumentTypeEntity>();
    public DbSet<EngineeringChangeEntity> EngineeringChanges => Set<EngineeringChangeEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProgramEntity>(entity =>
        {
            entity.ToTable("Programs");
            entity.HasKey(program => program.Id);
            entity.Property(program => program.Code).HasMaxLength(20).IsRequired();
            entity.Property(program => program.Name).HasMaxLength(100);
            entity.HasIndex(program => program.Code).IsUnique();
        });

        modelBuilder.Entity<FamilyEntity>(entity =>
        {
            entity.ToTable("Families");
            entity.HasKey(family => family.Id);
            entity.Property(family => family.Name).HasMaxLength(50).IsRequired();

            entity.HasOne(family => family.Program)
                .WithMany(program => program.Families)
                .HasForeignKey(family => family.ProgramId);
        });

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Name).HasMaxLength(100).IsRequired();
            entity.Property(user => user.Email).HasMaxLength(100);
            entity.Property(user => user.Role).HasMaxLength(20).IsRequired();
            entity.Property(user => user.IsActive).HasDefaultValue(true);
            entity.HasIndex(user => user.Email).IsUnique();

            entity.HasOne(user => user.Program)
                .WithMany(program => program.Users)
                .HasForeignKey(user => user.ProgramId);
        });

        modelBuilder.Entity<DocumentTypeEntity>(entity =>
        {
            entity.ToTable("DocumentTypes");
            entity.HasKey(documentType => documentType.Id);
            entity.Property(documentType => documentType.Code).HasMaxLength(10).IsRequired();
            entity.Property(documentType => documentType.Name).HasMaxLength(100);
            entity.HasIndex(documentType => documentType.Code).IsUnique();
        });

        modelBuilder.Entity<EngineeringChangeEntity>(entity =>
        {
            entity.ToTable("EngineeringChanges");
            entity.HasKey(change => change.Id);
            entity.Property(change => change.Folio).HasMaxLength(50).IsRequired();
            entity.Property(change => change.Title).HasMaxLength(200);
            entity.Property(change => change.Status).HasMaxLength(20).IsRequired();
            entity.Property(change => change.CreatedAt).HasColumnType("datetime2");
            entity.Property(change => change.ClosedAt).HasColumnType("datetime2");
            entity.HasIndex(change => change.Folio).IsUnique();

            entity.HasOne(change => change.Program)
                .WithMany(program => program.EngineeringChanges)
                .HasForeignKey(change => change.ProgramId);

            entity.HasOne(change => change.DocumentType)
                .WithMany(documentType => documentType.EngineeringChanges)
                .HasForeignKey(change => change.DocumentTypeId);

            entity.HasOne(change => change.Family)
                .WithMany(family => family.EngineeringChanges)
                .HasForeignKey(change => change.FamilyId);

            entity.HasOne(change => change.ResponsibleEngineer)
                .WithMany(user => user.ResponsibleEngineeringChanges)
                .HasForeignKey(change => change.ResponsibleEngineerId);
        });
    }
}
