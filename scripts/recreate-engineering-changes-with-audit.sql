-- Recreate EngineeringChanges and detail tables from scratch.
-- WARNING: This script deletes all data from EngineeringChanges and detail tables.
-- Use only if you accept data loss for those tables.

SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.Programs', 'U') IS NULL
       OR OBJECT_ID('dbo.DocumentTypes', 'U') IS NULL
       OR OBJECT_ID('dbo.Families', 'U') IS NULL
       OR OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
        THROW 50020, 'One or more required parent tables do not exist (Programs, DocumentTypes, Families, Users).', 1;
    END;

    -- Drop detail tables first because they depend on EngineeringChanges.
    IF OBJECT_ID('dbo.EngineeringChangeBcnDetails', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.EngineeringChangeBcnDetails;
    END;

    IF OBJECT_ID('dbo.EngineeringChangeDcnDetails', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.EngineeringChangeDcnDetails;
    END;

    IF OBJECT_ID('dbo.EngineeringChangeDfmDetails', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.EngineeringChangeDfmDetails;
    END;

    IF OBJECT_ID('dbo.EngineeringChanges', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.EngineeringChanges;
    END;

    CREATE TABLE dbo.EngineeringChanges
    (
        Id INT IDENTITY(1,1) NOT NULL,
        Folio NVARCHAR(50) NOT NULL,
        ProgramId INT NOT NULL,
        DocumentTypeId INT NOT NULL,
        FamilyId INT NOT NULL,
        ResponsibleEngineerId INT NOT NULL,
        CreatedByUserId INT NOT NULL,
        ModelYear NVARCHAR(20) NULL,
        Phase NVARCHAR(30) NULL,
        Status NVARCHAR(20) NOT NULL,
        CreatedAt DATETIME2 NOT NULL,
        ClosedAt DATETIME2 NULL,
        CONSTRAINT PK_EngineeringChanges PRIMARY KEY (Id),
        CONSTRAINT UQ_EngineeringChanges_Folio UNIQUE (Folio),
        CONSTRAINT FK_EngineeringChanges_Programs_ProgramId
            FOREIGN KEY (ProgramId) REFERENCES dbo.Programs(Id),
        CONSTRAINT FK_EngineeringChanges_DocumentTypes_DocumentTypeId
            FOREIGN KEY (DocumentTypeId) REFERENCES dbo.DocumentTypes(Id),
        CONSTRAINT FK_EngineeringChanges_Families_FamilyId
            FOREIGN KEY (FamilyId) REFERENCES dbo.Families(Id),
        CONSTRAINT FK_EngineeringChanges_Users_ResponsibleEngineerId
            FOREIGN KEY (ResponsibleEngineerId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_EngineeringChanges_Users_CreatedByUserId
            FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id)
    );

    CREATE INDEX IX_EngineeringChanges_ProgramId
        ON dbo.EngineeringChanges (ProgramId);

    CREATE INDEX IX_EngineeringChanges_DocumentTypeId
        ON dbo.EngineeringChanges (DocumentTypeId);

    CREATE INDEX IX_EngineeringChanges_FamilyId
        ON dbo.EngineeringChanges (FamilyId);

    CREATE INDEX IX_EngineeringChanges_ResponsibleEngineerId
        ON dbo.EngineeringChanges (ResponsibleEngineerId);

    CREATE INDEX IX_EngineeringChanges_CreatedByUserId
        ON dbo.EngineeringChanges (CreatedByUserId);

    CREATE TABLE dbo.EngineeringChangeBcnDetails
    (
        EngineeringChangeId INT NOT NULL,
        CarLeader NVARCHAR(MAX) NULL,
        ChangeDescription NVARCHAR(MAX) NULL,
        CONSTRAINT PK_EngineeringChangeBcnDetails PRIMARY KEY (EngineeringChangeId),
        CONSTRAINT FK_EngineeringChangeBcnDetails_EngineeringChanges_EngineeringChangeId
            FOREIGN KEY (EngineeringChangeId) REFERENCES dbo.EngineeringChanges(Id)
            ON DELETE CASCADE
    );

    CREATE TABLE dbo.EngineeringChangeDcnDetails
    (
        EngineeringChangeId INT NOT NULL,
        CarLeader NVARCHAR(MAX) NULL,
        AssociatedDocument NVARCHAR(MAX) NULL,
        ChangeDescription NVARCHAR(MAX) NULL,
        CONSTRAINT PK_EngineeringChangeDcnDetails PRIMARY KEY (EngineeringChangeId),
        CONSTRAINT FK_EngineeringChangeDcnDetails_EngineeringChanges_EngineeringChangeId
            FOREIGN KEY (EngineeringChangeId) REFERENCES dbo.EngineeringChanges(Id)
            ON DELETE CASCADE
    );

    CREATE TABLE dbo.EngineeringChangeDfmDetails
    (
        EngineeringChangeId INT NOT NULL,
        Composite NVARCHAR(MAX) NULL,
        Issue NVARCHAR(MAX) NULL,
        Target NVARCHAR(MAX) NULL,
        CONSTRAINT PK_EngineeringChangeDfmDetails PRIMARY KEY (EngineeringChangeId),
        CONSTRAINT FK_EngineeringChangeDfmDetails_EngineeringChanges_EngineeringChangeId
            FOREIGN KEY (EngineeringChangeId) REFERENCES dbo.EngineeringChanges(Id)
            ON DELETE CASCADE
    );

    COMMIT TRAN;
    PRINT 'EngineeringChanges and detail tables recreated successfully.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRAN;
    END;

    THROW;
END CATCH;
