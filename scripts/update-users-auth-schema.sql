-- Recreate Users table from scratch with Username + PasswordHash authentication.
-- WARNING: This script drops dbo.Users and all existing rows in that table.
-- Intended for empty/new environments.

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRAN;

    -- Drop foreign keys from EngineeringChanges that reference Users (if they exist).
    DECLARE @DropFkSql NVARCHAR(MAX) = N'';

    SELECT @DropFkSql = @DropFkSql +
        N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N'.' + QUOTENAME(OBJECT_NAME(parent_object_id)) +
        N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(10)
    FROM sys.foreign_keys
    WHERE referenced_object_id = OBJECT_ID('dbo.Users');

    IF @DropFkSql <> N''
    BEGIN
        EXEC sp_executesql @DropFkSql;
    END;

    IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.Users;
    END;

    CREATE TABLE dbo.Users
    (
        Id INT IDENTITY(1,1) NOT NULL,
        ProgramId INT NOT NULL,
        Name NVARCHAR(100) NOT NULL,
        Username NVARCHAR(50) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) NOT NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
        CONSTRAINT PK_Users PRIMARY KEY (Id)
    );

    -- Same behavior as EF model: username must be unique.
    CREATE UNIQUE INDEX IX_Users_Username ON dbo.Users(Username);

    -- Optional index for FK lookups by ProgramId.
    CREATE INDEX IX_Users_ProgramId ON dbo.Users(ProgramId);

    -- Recreate FK Users -> Programs.
    IF OBJECT_ID('dbo.Programs', 'U') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.Users
        ADD CONSTRAINT FK_Users_Programs_ProgramId
            FOREIGN KEY (ProgramId) REFERENCES dbo.Programs(Id);
    END;

    -- Recreate FK EngineeringChanges -> Users if table/column exist.
    IF OBJECT_ID('dbo.EngineeringChanges', 'U') IS NOT NULL
       AND COL_LENGTH('dbo.EngineeringChanges', 'ResponsibleEngineerId') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.EngineeringChanges
        ADD CONSTRAINT FK_EngineeringChanges_Users_ResponsibleEngineerId
            FOREIGN KEY (ResponsibleEngineerId) REFERENCES dbo.Users(Id);
    END;

    COMMIT TRAN;

    PRINT 'dbo.Users recreated successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRAN;
    END;

    THROW;
END CATCH;
