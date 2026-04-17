/*
    Folio System - Script consolidado de base de datos
    --------------------------------------------------
    Este archivo NO esta pensado para borrar y recrear todo.

    Objetivo:
    - Tener en un solo lugar cada objeto que necesita la aplicacion.
    - Poder leer facilmente que tablas, columnas, indices, constraints,
      procedimientos, vistas y datos iniciales existen.
    - Poder ejecutarlo por secciones o completo en ambientes de desarrollo.

    Comportamiento:
    - Crea tablas si no existen.
    - Agrega columnas nuevas si faltan.
    - Crea indices/constraints si faltan.
    - Crea o actualiza el stored procedure de folios.
    - Crea o actualiza la vista de perfil de usuario.
    - Inserta seed basico sin borrar informacion existente.

    Importante:
    - No elimina datos.
    - No reemplaza usuarios existentes.
    - Para cambiar datos reales, usa la seccion "SEED EDITABLE".
    - El backend actual todavia usa:
      Users.Id, ProgramId, Name, Username, PasswordHash, Role, IsActive.
      Name se conserva como nombre visible/compatibilidad y se puede derivar
      de FirstName + LastNamePaternal + LastNameMaternal.
*/

SET NOCOUNT ON;

------------------------------------------------------------------------------
-- 1) PROGRAMS
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Programs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Programs
    (
        Id INT IDENTITY(1,1) NOT NULL,
        Code NVARCHAR(20) NOT NULL,
        Name NVARCHAR(100) NULL,
        CONSTRAINT PK_Programs PRIMARY KEY (Id),
        CONSTRAINT UQ_Programs_Code UNIQUE (Code)
    );
END;
GO

------------------------------------------------------------------------------
-- 2) DOCUMENT TYPES
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.DocumentTypes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DocumentTypes
    (
        Id INT IDENTITY(1,1) NOT NULL,
        Code NVARCHAR(10) NOT NULL,
        Name NVARCHAR(100) NULL,
        CONSTRAINT PK_DocumentTypes PRIMARY KEY (Id),
        CONSTRAINT UQ_DocumentTypes_Code UNIQUE (Code)
    );
END;
GO

------------------------------------------------------------------------------
-- 3) FAMILIES
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Families', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Families
    (
        Id INT IDENTITY(1,1) NOT NULL,
        ProgramId INT NOT NULL,
        Name NVARCHAR(50) NOT NULL,
        CONSTRAINT PK_Families PRIMARY KEY (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Families_Programs_ProgramId'
)
BEGIN
    ALTER TABLE dbo.Families
    ADD CONSTRAINT FK_Families_Programs_ProgramId
        FOREIGN KEY (ProgramId) REFERENCES dbo.Programs(Id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Families_ProgramId'
      AND object_id = OBJECT_ID('dbo.Families')
)
BEGIN
    CREATE INDEX IX_Families_ProgramId
        ON dbo.Families (ProgramId);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_Families_ProgramId_Name'
      AND object_id = OBJECT_ID('dbo.Families')
)
BEGIN
    CREATE UNIQUE INDEX UQ_Families_ProgramId_Name
        ON dbo.Families (ProgramId, Name);
END;
GO

------------------------------------------------------------------------------
-- 4) USERS
-- Perfil de empleado + soporte para contrasena temporal.
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
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
END;
GO

IF COL_LENGTH('dbo.Users', 'FirstName') IS NULL
    ALTER TABLE dbo.Users ADD FirstName NVARCHAR(80) NULL;
GO

IF COL_LENGTH('dbo.Users', 'LastNamePaternal') IS NULL
    ALTER TABLE dbo.Users ADD LastNamePaternal NVARCHAR(80) NULL;
GO

IF COL_LENGTH('dbo.Users', 'LastNameMaternal') IS NULL
    ALTER TABLE dbo.Users ADD LastNameMaternal NVARCHAR(80) NULL;
GO

IF COL_LENGTH('dbo.Users', 'Department') IS NULL
    ALTER TABLE dbo.Users ADD Department NVARCHAR(100) NULL;
GO

-- JobTitle es dato laboral visible; Role es permiso del sistema.
IF COL_LENGTH('dbo.Users', 'JobTitle') IS NULL
    ALTER TABLE dbo.Users ADD JobTitle NVARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.Users', 'Location') IS NULL
    ALTER TABLE dbo.Users ADD Location NVARCHAR(100) NULL;
GO

-- Columnas para cambio de contrasena.
IF COL_LENGTH('dbo.Users', 'MustChangePassword') IS NULL
BEGIN
    ALTER TABLE dbo.Users
    ADD MustChangePassword BIT NOT NULL
        CONSTRAINT DF_Users_MustChangePassword DEFAULT (1)
        WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.Users', 'PasswordChangedAt') IS NULL
    ALTER TABLE dbo.Users ADD PasswordChangedAt DATETIME2 NULL;
GO

IF COL_LENGTH('dbo.Users', 'LastLoginAt') IS NULL
    ALTER TABLE dbo.Users ADD LastLoginAt DATETIME2 NULL;
GO

IF COL_LENGTH('dbo.Users', 'CreatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Users
    ADD CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSUTCDATETIME())
        WITH VALUES;
END;
GO

IF COL_LENGTH('dbo.Users', 'UpdatedAt') IS NULL
    ALTER TABLE dbo.Users ADD UpdatedAt DATETIME2 NULL;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_Users_Username'
      AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    CREATE UNIQUE INDEX UQ_Users_Username
        ON dbo.Users (Username);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Users_ProgramId'
      AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    CREATE INDEX IX_Users_ProgramId
        ON dbo.Users (ProgramId);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Users_Programs_ProgramId'
)
BEGIN
    ALTER TABLE dbo.Users
    ADD CONSTRAINT FK_Users_Programs_ProgramId
        FOREIGN KEY (ProgramId) REFERENCES dbo.Programs(Id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Users_Role'
)
BEGIN
    ALTER TABLE dbo.Users
    ADD CONSTRAINT CK_Users_Role
        CHECK (Role IN ('ADMIN', 'LEADER', 'ENGINEER', 'DRAFTER'));
END;
GO

------------------------------------------------------------------------------
-- 5) USER PASSWORD CHANGE LOG
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.UserPasswordChangeLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserPasswordChangeLog
    (
        Id INT IDENTITY(1,1) NOT NULL,
        UserId INT NOT NULL,
        ChangedAt DATETIME2 NOT NULL CONSTRAINT DF_UserPasswordChangeLog_ChangedAt DEFAULT (SYSUTCDATETIME()),
        ChangedByUserId INT NULL,
        Reason NVARCHAR(200) NULL,
        CONSTRAINT PK_UserPasswordChangeLog PRIMARY KEY (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_UserPasswordChangeLog_Users_UserId'
)
BEGIN
    ALTER TABLE dbo.UserPasswordChangeLog
    ADD CONSTRAINT FK_UserPasswordChangeLog_Users_UserId
        FOREIGN KEY (UserId) REFERENCES dbo.Users(Id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_UserPasswordChangeLog_Users_ChangedByUserId'
)
BEGIN
    ALTER TABLE dbo.UserPasswordChangeLog
    ADD CONSTRAINT FK_UserPasswordChangeLog_Users_ChangedByUserId
        FOREIGN KEY (ChangedByUserId) REFERENCES dbo.Users(Id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_UserPasswordChangeLog_UserId'
      AND object_id = OBJECT_ID('dbo.UserPasswordChangeLog')
)
BEGIN
    CREATE INDEX IX_UserPasswordChangeLog_UserId
        ON dbo.UserPasswordChangeLog (UserId, ChangedAt DESC);
END;
GO

------------------------------------------------------------------------------
-- 6) SEQUENCE CONTROL
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.SequenceControl', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SequenceControl
    (
        Id INT IDENTITY(1,1) NOT NULL,
        ProgramId INT NOT NULL,
        DocumentTypeId INT NOT NULL,
        [Year] INT NOT NULL,
        CurrentSequence INT NOT NULL CONSTRAINT DF_SequenceControl_CurrentSequence DEFAULT (0),
        CONSTRAINT PK_SequenceControl PRIMARY KEY (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_SequenceControl_Programs_ProgramId'
)
BEGIN
    ALTER TABLE dbo.SequenceControl
    ADD CONSTRAINT FK_SequenceControl_Programs_ProgramId
        FOREIGN KEY (ProgramId) REFERENCES dbo.Programs(Id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_SequenceControl_DocumentTypes_DocumentTypeId'
)
BEGIN
    ALTER TABLE dbo.SequenceControl
    ADD CONSTRAINT FK_SequenceControl_DocumentTypes_DocumentTypeId
        FOREIGN KEY (DocumentTypeId) REFERENCES dbo.DocumentTypes(Id);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_SequenceControl_Program_Type_Year'
      AND object_id = OBJECT_ID('dbo.SequenceControl')
)
BEGIN
    CREATE UNIQUE INDEX UQ_SequenceControl_Program_Type_Year
        ON dbo.SequenceControl (ProgramId, DocumentTypeId, [Year]);
END;
GO

------------------------------------------------------------------------------
-- 7) ENGINEERING CHANGES
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.EngineeringChanges', 'U') IS NULL
BEGIN
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
        CONSTRAINT PK_EngineeringChanges PRIMARY KEY (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_EngineeringChanges_Folio'
      AND object_id = OBJECT_ID('dbo.EngineeringChanges')
)
BEGIN
    CREATE UNIQUE INDEX UQ_EngineeringChanges_Folio
        ON dbo.EngineeringChanges (Folio);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_EngineeringChanges_Status'
)
BEGIN
    ALTER TABLE dbo.EngineeringChanges
    ADD CONSTRAINT CK_EngineeringChanges_Status
        CHECK (Status IN ('OPEN', 'CLOSED', 'CANCELLED'));
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_EngineeringChanges_Programs_ProgramId')
BEGIN
    ALTER TABLE dbo.EngineeringChanges
    ADD CONSTRAINT FK_EngineeringChanges_Programs_ProgramId
        FOREIGN KEY (ProgramId) REFERENCES dbo.Programs(Id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_EngineeringChanges_DocumentTypes_DocumentTypeId')
BEGIN
    ALTER TABLE dbo.EngineeringChanges
    ADD CONSTRAINT FK_EngineeringChanges_DocumentTypes_DocumentTypeId
        FOREIGN KEY (DocumentTypeId) REFERENCES dbo.DocumentTypes(Id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_EngineeringChanges_Families_FamilyId')
BEGIN
    ALTER TABLE dbo.EngineeringChanges
    ADD CONSTRAINT FK_EngineeringChanges_Families_FamilyId
        FOREIGN KEY (FamilyId) REFERENCES dbo.Families(Id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_EngineeringChanges_Users_ResponsibleEngineerId')
BEGIN
    ALTER TABLE dbo.EngineeringChanges
    ADD CONSTRAINT FK_EngineeringChanges_Users_ResponsibleEngineerId
        FOREIGN KEY (ResponsibleEngineerId) REFERENCES dbo.Users(Id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_EngineeringChanges_Users_CreatedByUserId')
BEGIN
    ALTER TABLE dbo.EngineeringChanges
    ADD CONSTRAINT FK_EngineeringChanges_Users_CreatedByUserId
        FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(Id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EngineeringChanges_ProgramId' AND object_id = OBJECT_ID('dbo.EngineeringChanges'))
    CREATE INDEX IX_EngineeringChanges_ProgramId ON dbo.EngineeringChanges (ProgramId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EngineeringChanges_DocumentTypeId' AND object_id = OBJECT_ID('dbo.EngineeringChanges'))
    CREATE INDEX IX_EngineeringChanges_DocumentTypeId ON dbo.EngineeringChanges (DocumentTypeId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EngineeringChanges_FamilyId' AND object_id = OBJECT_ID('dbo.EngineeringChanges'))
    CREATE INDEX IX_EngineeringChanges_FamilyId ON dbo.EngineeringChanges (FamilyId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EngineeringChanges_ResponsibleEngineerId' AND object_id = OBJECT_ID('dbo.EngineeringChanges'))
    CREATE INDEX IX_EngineeringChanges_ResponsibleEngineerId ON dbo.EngineeringChanges (ResponsibleEngineerId);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EngineeringChanges_CreatedByUserId' AND object_id = OBJECT_ID('dbo.EngineeringChanges'))
    CREATE INDEX IX_EngineeringChanges_CreatedByUserId ON dbo.EngineeringChanges (CreatedByUserId);
GO

------------------------------------------------------------------------------
-- 8) ENGINEERING CHANGE DETAILS
------------------------------------------------------------------------------
IF OBJECT_ID('dbo.EngineeringChangeBcnDetails', 'U') IS NULL
BEGIN
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
END;
GO

IF OBJECT_ID('dbo.EngineeringChangeDcnDetails', 'U') IS NULL
BEGIN
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
END;
GO

IF OBJECT_ID('dbo.EngineeringChangeDfmDetails', 'U') IS NULL
BEGIN
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
END;
GO

------------------------------------------------------------------------------
-- 9) STORED PROCEDURE: GENERATE ENGINEERING FOLIO
------------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.GenerateEngineeringFolio
    @ProgramId INT,
    @DocumentTypeId INT,
    @Year INT,
    @GeneratedFolio NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @NextSequence INT;
    DECLARE @ProgramCode NVARCHAR(20);
    DECLARE @DocumentTypeCode NVARCHAR(10);

    SELECT @ProgramCode = Code
    FROM dbo.Programs
    WHERE Id = @ProgramId;

    SELECT @DocumentTypeCode = Code
    FROM dbo.DocumentTypes
    WHERE Id = @DocumentTypeId;

    IF @ProgramCode IS NULL OR @DocumentTypeCode IS NULL
    BEGIN
        THROW 51000, 'Program or document type was not found.', 1;
    END;

    UPDATE dbo.SequenceControl WITH (UPDLOCK, HOLDLOCK)
    SET
        CurrentSequence = CurrentSequence + 1,
        @NextSequence = CurrentSequence + 1
    WHERE ProgramId = @ProgramId
      AND DocumentTypeId = @DocumentTypeId
      AND [Year] = @Year;

    IF @NextSequence IS NULL
    BEGIN
        INSERT INTO dbo.SequenceControl (ProgramId, DocumentTypeId, [Year], CurrentSequence)
        VALUES (@ProgramId, @DocumentTypeId, @Year, 1);

        SET @NextSequence = 1;
    END;

    SET @GeneratedFolio =
        CONCAT(@ProgramCode, N'-', @DocumentTypeCode, N'-', @Year, N'-', FORMAT(@NextSequence, '0000'));
END;
GO

------------------------------------------------------------------------------
-- 10) VIEW: USER PROFILES
-- Para futura pagina de perfil "solo lectura".
------------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.v_UserProfiles
AS
SELECT
    u.Id,
    u.Username,
    u.Name,
    u.FirstName,
    u.LastNamePaternal,
    u.LastNameMaternal,
    u.Role,
    u.IsActive,
    u.Department,
    u.JobTitle,
    u.Location,
    u.MustChangePassword,
    u.PasswordChangedAt,
    u.LastLoginAt,
    u.CreatedAt,
    u.UpdatedAt,
    p.Code AS ProgramCode,
    p.Name AS ProgramName
FROM dbo.Users AS u
INNER JOIN dbo.Programs AS p
    ON p.Id = u.ProgramId;
GO

------------------------------------------------------------------------------
-- 11) SEED EDITABLE
-- Datos minimos para desarrollo. No borra ni pisa usuarios existentes.
------------------------------------------------------------------------------
DECLARE @SeedYear INT = YEAR(GETUTCDATE());
DECLARE @DefaultPassword NVARCHAR(255) = N'ChangeMe123!';

DECLARE @ProgramsSeed TABLE
(
    Code NVARCHAR(20) NOT NULL,
    Name NVARCHAR(100) NULL
);

INSERT INTO @ProgramsSeed (Code, Name)
VALUES
    (N'Y2XX', N'Y2XX Program'),
    (N'K1XX', N'K1XX Program');

MERGE dbo.Programs AS target
USING @ProgramsSeed AS source
    ON target.Code = source.Code
WHEN MATCHED THEN
    UPDATE SET target.Name = source.Name
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Code, Name)
    VALUES (source.Code, source.Name);

DECLARE @DocumentTypesSeed TABLE
(
    Code NVARCHAR(10) NOT NULL,
    Name NVARCHAR(100) NULL
);

INSERT INTO @DocumentTypesSeed (Code, Name)
VALUES
    (N'BCN', N'Bill of Change Notice'),
    (N'DCN', N'Design Change Notice'),
    (N'DFM', N'Design For Manufacturability');

MERGE dbo.DocumentTypes AS target
USING @DocumentTypesSeed AS source
    ON target.Code = source.Code
WHEN MATCHED THEN
    UPDATE SET target.Name = source.Name
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Code, Name)
    VALUES (source.Code, source.Name);

DECLARE @FamiliesSeed TABLE
(
    ProgramCode NVARCHAR(20) NOT NULL,
    FamilyName NVARCHAR(50) NOT NULL
);

INSERT INTO @FamiliesSeed (ProgramCode, FamilyName)
VALUES
    (N'Y2XX', N'INTERIOR'),
    (N'Y2XX', N'EXTERIOR'),
    (N'K1XX', N'SEAT');

MERGE dbo.Families AS target
USING
(
    SELECT p.Id AS ProgramId, f.FamilyName
    FROM @FamiliesSeed AS f
    INNER JOIN dbo.Programs AS p
        ON p.Code = f.ProgramCode
) AS source
    ON target.ProgramId = source.ProgramId
   AND target.Name = source.FamilyName
WHEN NOT MATCHED BY TARGET THEN
    INSERT (ProgramId, Name)
    VALUES (source.ProgramId, source.FamilyName);

/*
    Usuarios iniciales.

    Edita aqui cuando tengas la informacion completa:
    - FirstName
    - LastNamePaternal
    - LastNameMaternal
    - Department
    - JobTitle
    - Location

    PasswordHash queda con @DefaultPassword solo para usuarios nuevos.
    MustChangePassword queda en 1 para obligar cambio cuando se implemente
    el flujo en backend/frontend.
*/
DECLARE @UsersSeed TABLE
(
    ProgramCode NVARCHAR(20) NOT NULL,
    Username NVARCHAR(50) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL,
    FirstName NVARCHAR(80) NULL,
    LastNamePaternal NVARCHAR(80) NULL,
    LastNameMaternal NVARCHAR(80) NULL,
    Department NVARCHAR(100) NULL,
    JobTitle NVARCHAR(100) NULL,
    Location NVARCHAR(100) NULL
);

INSERT INTO @UsersSeed
(
    ProgramCode,
    Username,
    PasswordHash,
    Role,
    IsActive,
    FirstName,
    LastNamePaternal,
    LastNameMaternal,
    Department,
    JobTitle,
    Location
)
VALUES
    (N'Y2XX', N'agutierrez11', @DefaultPassword, N'ADMIN', 1,
        N'Alex', N'Gutierrez', NULL, NULL, NULL, NULL),
    (N'Y2XX', N'engineer1', @DefaultPassword, N'ENGINEER', 1,
        N'Test', N'Engineer', NULL, NULL, NULL, NULL),
    (N'K1XX', N'leadk1', @DefaultPassword, N'LEADER', 1,
        N'Program', N'Lead', NULL, NULL, NULL, NULL);

MERGE dbo.Users AS target
USING
(
    SELECT
        p.Id AS ProgramId,
        LEFT(
            COALESCE(
                NULLIF(
                    LTRIM(RTRIM(CONCAT(
                        COALESCE(u.FirstName, N''),
                        N' ',
                        COALESCE(u.LastNamePaternal, N''),
                        N' ',
                        COALESCE(u.LastNameMaternal, N'')
                    ))),
                    N''
                ),
                u.Username
            ),
            100
        ) AS Name,
        u.Username,
        u.PasswordHash,
        u.Role,
        u.IsActive,
        u.FirstName,
        u.LastNamePaternal,
        u.LastNameMaternal,
        u.Department,
        u.JobTitle,
        u.Location
    FROM @UsersSeed AS u
    INNER JOIN dbo.Programs AS p
        ON p.Code = u.ProgramCode
) AS source
    ON target.Username = source.Username
WHEN MATCHED THEN
    UPDATE SET
        target.ProgramId = source.ProgramId,
        target.Name = source.Name,
        target.Role = source.Role,
        target.IsActive = source.IsActive,
        target.FirstName = source.FirstName,
        target.LastNamePaternal = source.LastNamePaternal,
        target.LastNameMaternal = source.LastNameMaternal,
        target.Department = source.Department,
        target.JobTitle = source.JobTitle,
        target.Location = source.Location,
        target.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED BY TARGET THEN
    INSERT
    (
        ProgramId,
        Name,
        Username,
        PasswordHash,
        Role,
        IsActive,
        FirstName,
        LastNamePaternal,
        LastNameMaternal,
        Department,
        JobTitle,
        Location,
        MustChangePassword
    )
    VALUES
    (
        source.ProgramId,
        source.Name,
        source.Username,
        source.PasswordHash,
        source.Role,
        source.IsActive,
        source.FirstName,
        source.LastNamePaternal,
        source.LastNameMaternal,
        source.Department,
        source.JobTitle,
        source.Location,
        1
    );

MERGE dbo.SequenceControl AS target
USING
(
    SELECT p.Id AS ProgramId, d.Id AS DocumentTypeId, @SeedYear AS [Year]
    FROM dbo.Programs AS p
    CROSS JOIN dbo.DocumentTypes AS d
) AS source
    ON target.ProgramId = source.ProgramId
   AND target.DocumentTypeId = source.DocumentTypeId
   AND target.[Year] = source.[Year]
WHEN NOT MATCHED BY TARGET THEN
    INSERT (ProgramId, DocumentTypeId, [Year], CurrentSequence)
    VALUES (source.ProgramId, source.DocumentTypeId, source.[Year], 0);
GO

PRINT 'Folio System consolidated database script completed.';
