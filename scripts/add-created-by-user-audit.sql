-- Adds creator-audit support to EngineeringChanges.
-- This script is incremental and keeps existing rows.

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.EngineeringChanges', 'U') IS NULL
    BEGIN
        THROW 50010, 'Table dbo.EngineeringChanges does not exist.', 1;
    END;

    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
        THROW 50011, 'Table dbo.Users does not exist.', 1;
    END;

    -- 1) Add column as nullable first to support existing rows.
    IF COL_LENGTH('dbo.EngineeringChanges', 'CreatedByUserId') IS NULL
    BEGIN
        ALTER TABLE dbo.EngineeringChanges
        ADD CreatedByUserId INT NULL;
    END;

    -- 2) Backfill existing documents. Use responsible as creator when unknown.
    UPDATE ec
    SET ec.CreatedByUserId = ec.ResponsibleEngineerId
    FROM dbo.EngineeringChanges AS ec
    WHERE ec.CreatedByUserId IS NULL;

    -- 3) Enforce NOT NULL after backfill.
    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('dbo.EngineeringChanges')
          AND name = 'CreatedByUserId'
          AND is_nullable = 1
    )
    BEGIN
        ALTER TABLE dbo.EngineeringChanges
        ALTER COLUMN CreatedByUserId INT NOT NULL;
    END;

    -- 4) Add index for audit queries.
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_EngineeringChanges_CreatedByUserId'
          AND object_id = OBJECT_ID('dbo.EngineeringChanges')
    )
    BEGIN
        CREATE INDEX IX_EngineeringChanges_CreatedByUserId
            ON dbo.EngineeringChanges (CreatedByUserId);
    END;

    -- 5) Add foreign key.
    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_EngineeringChanges_Users_CreatedByUserId'
    )
    BEGIN
        ALTER TABLE dbo.EngineeringChanges
        ADD CONSTRAINT FK_EngineeringChanges_Users_CreatedByUserId
            FOREIGN KEY (CreatedByUserId)
            REFERENCES dbo.Users (Id)
            ON DELETE NO ACTION;
    END;

    COMMIT TRAN;
    PRINT 'CreatedByUserId audit column added successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRAN;
    END;

    THROW;
END CATCH;
