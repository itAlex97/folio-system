using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class EngineeringRegistryDbContext(DbContextOptions<EngineeringRegistryDbContext> options)
    : DbContext(options)
{
    public DbSet<ProgramEntity> Programs => Set<ProgramEntity>();
    public DbSet<FamilyEntity> Families => Set<FamilyEntity>();
    public DbSet<CarLeaderEntity> CarLeaders => Set<CarLeaderEntity>();
    public DbSet<DreEntity> Dres => Set<DreEntity>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<DocumentTypeEntity> DocumentTypes => Set<DocumentTypeEntity>();
    public DbSet<SequenceControlEntity> SequenceControls => Set<SequenceControlEntity>();
    public DbSet<EngineeringChangeEntity> EngineeringChanges => Set<EngineeringChangeEntity>();
    public DbSet<EngineeringChangeBcnDetailEntity> EngineeringChangeBcnDetails => Set<EngineeringChangeBcnDetailEntity>();
    public DbSet<EngineeringChangeDcnDetailEntity> EngineeringChangeDcnDetails => Set<EngineeringChangeDcnDetailEntity>();
    public DbSet<EngineeringChangeDfmDetailEntity> EngineeringChangeDfmDetails => Set<EngineeringChangeDfmDetailEntity>();

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
            entity.Property(family => family.Name).HasMaxLength(100).IsRequired();

            entity.HasOne(family => family.Program)
                .WithMany(program => program.Families)
                .HasForeignKey(family => family.ProgramId);
        });

        modelBuilder.Entity<CarLeaderEntity>(entity =>
        {
            entity.ToTable("CarLeaders");
            entity.HasKey(carLeader => carLeader.Id);
            entity.Property(carLeader => carLeader.Name).HasMaxLength(100).IsRequired();

            entity.HasOne(carLeader => carLeader.Program)
                .WithMany(program => program.CarLeaders)
                .HasForeignKey(carLeader => carLeader.ProgramId);
        });

        modelBuilder.Entity<DreEntity>(entity =>
        {
            entity.ToTable("DREs");
            entity.HasKey(dre => dre.Id);
            entity.Property(dre => dre.Name).HasMaxLength(100).IsRequired();

            entity.HasOne(dre => dre.Program)
                .WithMany(program => program.Dres)
                .HasForeignKey(dre => dre.ProgramId);
        });

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(user => user.Id);
            entity.Ignore(user => user.DisplayName);
            entity.Property(user => user.FirstName).HasMaxLength(50).IsRequired();
            entity.Property(user => user.LastName).HasMaxLength(50).IsRequired();
            entity.Property(user => user.Username).HasMaxLength(50).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(user => user.Role).HasMaxLength(20).IsRequired();
            entity.Property(user => user.IsAdmin).HasDefaultValue(false);
            entity.Property(user => user.JobTitle).HasMaxLength(100);
            entity.Property(user => user.Location).HasMaxLength(100);
            entity.Property(user => user.IsActive).HasDefaultValue(true);
            entity.HasIndex(user => user.Username).IsUnique();

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

        modelBuilder.Entity<SequenceControlEntity>(entity =>
        {
            entity.ToTable("SequenceControl");
            entity.HasKey(sequence => sequence.Id);
            entity.Property(sequence => sequence.CurrentSequence).HasDefaultValue(0);
            entity.HasIndex(sequence => new
            {
                sequence.ProgramId,
                sequence.DocumentTypeId,
                sequence.Year
            }).IsUnique();

            entity.HasOne(sequence => sequence.Program)
                .WithMany()
                .HasForeignKey(sequence => sequence.ProgramId);

            entity.HasOne(sequence => sequence.DocumentType)
                .WithMany()
                .HasForeignKey(sequence => sequence.DocumentTypeId);
        });

        modelBuilder.Entity<EngineeringChangeEntity>(entity =>
        {
            entity.ToTable("EngineeringChanges");
            entity.HasKey(change => change.Id);
            entity.Property(change => change.Folio).HasMaxLength(50).IsRequired();
            entity.Property(change => change.ModelYear).HasMaxLength(20);
            entity.Property(change => change.Phase).HasMaxLength(30);
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

            entity.HasOne(change => change.CreatedByUser)
                .WithMany(user => user.CreatedEngineeringChanges)
                .HasForeignKey(change => change.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EngineeringChangeBcnDetailEntity>(entity =>
        {
            entity.ToTable("EngineeringChangeBcnDetails");
            entity.HasKey(detail => detail.EngineeringChangeId);

            entity.HasOne(detail => detail.EngineeringChange)
                .WithOne(change => change.BcnDetail)
                .HasForeignKey<EngineeringChangeBcnDetailEntity>(detail => detail.EngineeringChangeId);

            entity.HasOne(detail => detail.CarLeader)
                .WithMany(carLeader => carLeader.EngineeringChangeBcnDetails)
                .HasForeignKey(detail => detail.CarLeaderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<EngineeringChangeDcnDetailEntity>(entity =>
        {
            entity.ToTable("EngineeringChangeDcnDetails");
            entity.HasKey(detail => detail.EngineeringChangeId);

            entity.HasOne(detail => detail.EngineeringChange)
                .WithOne(change => change.DcnDetail)
                .HasForeignKey<EngineeringChangeDcnDetailEntity>(detail => detail.EngineeringChangeId);

            entity.HasOne(detail => detail.CarLeader)
                .WithMany(carLeader => carLeader.EngineeringChangeDcnDetails)
                .HasForeignKey(detail => detail.CarLeaderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<EngineeringChangeDfmDetailEntity>(entity =>
        {
            entity.ToTable("EngineeringChangeDfmDetails");
            entity.HasKey(detail => detail.EngineeringChangeId);

            entity.HasOne(detail => detail.EngineeringChange)
                .WithOne(change => change.DfmDetail)
                .HasForeignKey<EngineeringChangeDfmDetailEntity>(detail => detail.EngineeringChangeId);

            entity.HasOne(detail => detail.Dre)
                .WithMany(dre => dre.EngineeringChangeDfmDetails)
                .HasForeignKey(detail => detail.DreId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
