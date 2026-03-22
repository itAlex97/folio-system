-- Initial seed data for Engineering Registry.
-- Safe to run multiple times (upsert style).
-- Edit the values in the table variables below to match your real data.

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.Programs', 'U') IS NULL
       OR OBJECT_ID('dbo.DocumentTypes', 'U') IS NULL
       OR OBJECT_ID('dbo.Families', 'U') IS NULL
       OR OBJECT_ID('dbo.Users', 'U') IS NULL
       OR OBJECT_ID('dbo.SequenceControl', 'U') IS NULL
    BEGIN
        THROW 50001, 'One or more required tables do not exist.', 1;
    END;

    DECLARE @SeedYear INT = YEAR(GETUTCDATE());

    -------------------------------------------------------------------------
    -- 1) Programs
    -------------------------------------------------------------------------
    DECLARE @Programs TABLE
    (
        Code NVARCHAR(20) NOT NULL,
        Name NVARCHAR(100) NULL
    );

    INSERT INTO @Programs (Code, Name)
    VALUES
        ('Y2XX', 'Y2XX Program'),
        ('K1XX', 'K1XX Program');

    MERGE dbo.Programs AS target
    USING @Programs AS source
        ON target.Code = source.Code
    WHEN MATCHED THEN
        UPDATE SET target.Name = source.Name
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (Code, Name)
        VALUES (source.Code, source.Name);

    -------------------------------------------------------------------------
    -- 2) Document Types
    -------------------------------------------------------------------------
    DECLARE @DocumentTypes TABLE
    (
        Code NVARCHAR(10) NOT NULL,
        Name NVARCHAR(100) NULL
    );

    INSERT INTO @DocumentTypes (Code, Name)
    VALUES
        ('BCN', 'Bill of Change Notice'),
        ('DCN', 'Design Change Notice'),
        ('DFM', 'Design For Manufacturability');

    MERGE dbo.DocumentTypes AS target
    USING @DocumentTypes AS source
        ON target.Code = source.Code
    WHEN MATCHED THEN
        UPDATE SET target.Name = source.Name
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (Code, Name)
        VALUES (source.Code, source.Name);

    -------------------------------------------------------------------------
    -- 3) Families (by ProgramCode)
    -------------------------------------------------------------------------
    DECLARE @Families TABLE
    (
        ProgramCode NVARCHAR(20) NOT NULL,
        FamilyName NVARCHAR(50) NOT NULL
    );

    INSERT INTO @Families (ProgramCode, FamilyName)
    VALUES
        ('Y2XX', 'INTERIOR'),
        ('Y2XX', 'EXTERIOR'),
        ('K1XX', 'SEAT');

    ;WITH FamilySource AS
    (
        SELECT p.Id AS ProgramId, f.FamilyName
        FROM @Families AS f
        INNER JOIN dbo.Programs AS p
            ON p.Code = f.ProgramCode
    )
    MERGE dbo.Families AS target
    USING FamilySource AS source
        ON target.ProgramId = source.ProgramId
       AND target.Name = source.FamilyName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (ProgramId, Name)
        VALUES (source.ProgramId, source.FamilyName);

    -------------------------------------------------------------------------
    -- 4) Users (by ProgramCode)
    -- PasswordHash currently accepts plain text because backend includes fallback.
    -- Replace PasswordHash with a PBKDF2 value later for production hardening.
    -------------------------------------------------------------------------
    DECLARE @Users TABLE
    (
        ProgramCode NVARCHAR(20) NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Username NVARCHAR(50) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) NOT NULL,
        IsActive BIT NOT NULL
    );

    INSERT INTO @Users (ProgramCode, Name, Username, PasswordHash, Role, IsActive)
    VALUES
        ('Y2XX', 'Alex Gutierrez', 'agutierrez11', 'ChangeMe123!', 'ADMIN', 1),
        ('Y2XX', 'Test Engineer', 'engineer1', 'ChangeMe123!', 'ENGINEER', 1),
        ('K1XX', 'Program Lead', 'leadk1', 'ChangeMe123!', 'LEADER', 1);

    ;WITH UserSource AS
    (
        SELECT
            p.Id AS ProgramId,
            u.Name,
            u.Username,
            u.PasswordHash,
            u.Role,
            u.IsActive
        FROM @Users AS u
        INNER JOIN dbo.Programs AS p
            ON p.Code = u.ProgramCode
    )
    MERGE dbo.Users AS target
    USING UserSource AS source
        ON target.Username = source.Username
    WHEN MATCHED THEN
        UPDATE SET
            target.ProgramId = source.ProgramId,
            target.Name = source.Name,
            target.PasswordHash = source.PasswordHash,
            target.Role = source.Role,
            target.IsActive = source.IsActive
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (ProgramId, Name, Username, PasswordHash, Role, IsActive)
        VALUES (source.ProgramId, source.Name, source.Username, source.PasswordHash, source.Role, source.IsActive);

    -------------------------------------------------------------------------
    -- 5) SequenceControl
    -- Create one row per Program x DocumentType x Year.
    -------------------------------------------------------------------------
    ;WITH SequenceSource AS
    (
        SELECT p.Id AS ProgramId, d.Id AS DocumentTypeId, @SeedYear AS [Year]
        FROM dbo.Programs AS p
        CROSS JOIN dbo.DocumentTypes AS d
    )
    MERGE dbo.SequenceControl AS target
    USING SequenceSource AS source
        ON target.ProgramId = source.ProgramId
       AND target.DocumentTypeId = source.DocumentTypeId
       AND target.[Year] = source.[Year]
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (ProgramId, DocumentTypeId, [Year], CurrentSequence)
        VALUES (source.ProgramId, source.DocumentTypeId, source.[Year], 0);

    COMMIT TRAN;

    PRINT 'Seed completed successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRAN;
    END;

    THROW;
END CATCH;
