/* =========================================================
   01 - CREATE DATABASE
========================================================= */

CREATE DATABASE FolioDB;
GO

USE FolioDB;
GO


/* =========================================================
   02 - TABLES
========================================================= */


/* =========================
   Programs
========================= */

CREATE TABLE Programs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(20) NOT NULL UNIQUE,
    Name NVARCHAR(100)
);
GO


/* =========================
   Document Types
========================= */

CREATE TABLE DocumentTypes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(10) NOT NULL UNIQUE,
    Name NVARCHAR(100)
);
GO


/* =========================
   Families
========================= */

CREATE TABLE Families (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProgramId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,

    FOREIGN KEY (ProgramId)
    REFERENCES Programs(Id)
);
GO


/* =========================
   DREs
========================= */

CREATE TABLE DREs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProgramId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,

    FOREIGN KEY (ProgramId)
    REFERENCES Programs(Id)
);
GO


/* =========================
   Car Leaders
========================= */

CREATE TABLE CarLeaders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProgramId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,

    FOREIGN KEY (ProgramId)
    REFERENCES Programs(Id)
);
GO


/* =========================
   Users
========================= */

CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    ProgramId INT NOT NULL,

    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Username NVARCHAR(50) NOT NULL UNIQUE,

    PasswordHash NVARCHAR(255) NOT NULL,

    Role NVARCHAR(20) NOT NULL,
    JobTitle NVARCHAR(100),
    Location NVARCHAR(100),

    IsActive BIT NOT NULL DEFAULT 1,

    FOREIGN KEY (ProgramId)
    REFERENCES Programs(Id)
);
GO


/* =========================
   Engineering Changes
========================= */

CREATE TABLE EngineeringChanges (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    Folio NVARCHAR(50) NOT NULL UNIQUE,

    ProgramId INT NOT NULL,
    DocumentTypeId INT NOT NULL,
    FamilyId INT NOT NULL,

    ResponsibleEngineerId INT NOT NULL,
    CreatedByUserId INT NOT NULL,

    ModelYear NVARCHAR(20),
    Phase NVARCHAR(30),

    Status NVARCHAR(20) NOT NULL,

    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    ClosedAt DATETIME2,

    FOREIGN KEY (ProgramId)
    REFERENCES Programs(Id),

    FOREIGN KEY (DocumentTypeId)
    REFERENCES DocumentTypes(Id),

    FOREIGN KEY (FamilyId)
    REFERENCES Families(Id),

    FOREIGN KEY (ResponsibleEngineerId)
    REFERENCES Users(Id),

    FOREIGN KEY (CreatedByUserId)
    REFERENCES Users(Id)
);
GO


/* =========================
   BCN Details
========================= */

CREATE TABLE EngineeringChangeBcnDetails (
    EngineeringChangeId INT PRIMARY KEY,

    CarLeaderId INT NULL,
    ChangeDescription NVARCHAR(MAX),

    FOREIGN KEY (EngineeringChangeId)
    REFERENCES EngineeringChanges(Id)
    ON DELETE CASCADE,

    FOREIGN KEY (CarLeaderId)
    REFERENCES CarLeaders(Id)
    ON DELETE SET NULL
);
GO


/* =========================
   DCN Details
========================= */

CREATE TABLE EngineeringChangeDcnDetails (
    EngineeringChangeId INT PRIMARY KEY,

    CarLeaderId INT NULL,
    AssociatedDocument NVARCHAR(MAX),
    ChangeDescription NVARCHAR(MAX),

    FOREIGN KEY (EngineeringChangeId)
    REFERENCES EngineeringChanges(Id)
    ON DELETE CASCADE,

    FOREIGN KEY (CarLeaderId)
    REFERENCES CarLeaders(Id)
    ON DELETE SET NULL
);
GO


/* =========================
   DFM Details
========================= */

CREATE TABLE EngineeringChangeDfmDetails (
    EngineeringChangeId INT PRIMARY KEY,

    Composite NVARCHAR(MAX),
    Issue NVARCHAR(MAX),

    DreId INT NULL,

    FOREIGN KEY (EngineeringChangeId)
    REFERENCES EngineeringChanges(Id)
    ON DELETE CASCADE,

    FOREIGN KEY (DreId)
    REFERENCES DREs(Id)
    ON DELETE SET NULL
);
GO


/* =========================
   Sequence Control
========================= */

CREATE TABLE SequenceControl (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    ProgramId INT NOT NULL,
    DocumentTypeId INT NOT NULL,

    Year INT NOT NULL,

    CurrentSequence INT NOT NULL DEFAULT 0,

    UNIQUE (ProgramId, DocumentTypeId, Year),

    FOREIGN KEY (ProgramId)
    REFERENCES Programs(Id),

    FOREIGN KEY (DocumentTypeId)
    REFERENCES DocumentTypes(Id)
);
GO


/* =========================================================
   03 - INDEXES
========================================================= */

CREATE INDEX IX_Users_ProgramId
ON Users(ProgramId);
GO

CREATE INDEX IX_EngineeringChanges_ProgramId
ON EngineeringChanges(ProgramId);
GO

CREATE INDEX IX_EngineeringChanges_DocumentTypeId
ON EngineeringChanges(DocumentTypeId);
GO

CREATE INDEX IX_EngineeringChanges_FamilyId
ON EngineeringChanges(FamilyId);
GO

CREATE INDEX IX_EngineeringChanges_ResponsibleEngineerId
ON EngineeringChanges(ResponsibleEngineerId);
GO

CREATE INDEX IX_EngineeringChanges_CreatedByUserId
ON EngineeringChanges(CreatedByUserId);
GO

CREATE INDEX IX_DREs_ProgramId
ON DREs(ProgramId);
GO

CREATE INDEX IX_CarLeaders_ProgramId
ON CarLeaders(ProgramId);
GO


/* =========================================================
   04 - STORED PROCEDURE
========================================================= */

CREATE PROCEDURE GenerateEngineeringFolio
    @ProgramId INT,
    @DocumentTypeId INT,
    @Year INT,
    @GeneratedFolio NVARCHAR(50) OUTPUT
AS
BEGIN

    SET NOCOUNT ON;

    DECLARE @CurrentSequence INT;
    DECLARE @NextSequence INT;

    DECLARE @ProgramCode NVARCHAR(20);
    DECLARE @TypeCode NVARCHAR(10);

    SELECT @CurrentSequence = CurrentSequence
    FROM SequenceControl
    WHERE ProgramId = @ProgramId
    AND DocumentTypeId = @DocumentTypeId
    AND Year = @Year;

    IF @CurrentSequence IS NULL
    BEGIN
        INSERT INTO SequenceControl (
            ProgramId,
            DocumentTypeId,
            Year,
            CurrentSequence
        )
        VALUES (
            @ProgramId,
            @DocumentTypeId,
            @Year,
            0
        );

        SET @CurrentSequence = 0;
    END

    SET @NextSequence = @CurrentSequence + 1;

    UPDATE SequenceControl
    SET CurrentSequence = @NextSequence
    WHERE ProgramId = @ProgramId
    AND DocumentTypeId = @DocumentTypeId
    AND Year = @Year;

    SELECT @ProgramCode = Code
    FROM Programs
    WHERE Id = @ProgramId;

    SELECT @TypeCode = Code
    FROM DocumentTypes
    WHERE Id = @DocumentTypeId;

    SET @GeneratedFolio =
        @ProgramCode + '-' +
        RIGHT(CAST(@Year AS NVARCHAR(4)), 2) + '-' +
        @TypeCode + '-' +
        RIGHT('0000' + CAST(@NextSequence AS NVARCHAR(10)), 4);

END;
GO
