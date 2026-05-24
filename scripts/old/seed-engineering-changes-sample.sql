/*
    Seed de registros de ejemplo para EngineeringChanges.

    Objetivo:
    - Garantizar al menos 4 registros por tipo (BCN, DCN, DFM)
      para cada programa existente.
    - Insertar tambien el detalle correspondiente por tipo.
    - Ser idempotente: si ya hay 4 o mas por combinacion, no agrega mas.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @TargetPerType INT = 4;
DECLARE @SeedYear INT = YEAR(GETUTCDATE());

IF OBJECT_ID('dbo.Programs', 'U') IS NULL
    OR OBJECT_ID('dbo.DocumentTypes', 'U') IS NULL
    OR OBJECT_ID('dbo.Users', 'U') IS NULL
    OR OBJECT_ID('dbo.Families', 'U') IS NULL
    OR OBJECT_ID('dbo.EngineeringChanges', 'U') IS NULL
    OR OBJECT_ID('dbo.EngineeringChangeBcnDetails', 'U') IS NULL
    OR OBJECT_ID('dbo.EngineeringChangeDcnDetails', 'U') IS NULL
    OR OBJECT_ID('dbo.EngineeringChangeDfmDetails', 'U') IS NULL
BEGIN
    THROW 51001, 'No se encontraron todas las tablas requeridas. Ejecuta primero scripts/folio-system-database.sql.', 1;
END;

IF OBJECT_ID('dbo.GenerateEngineeringFolio', 'P') IS NULL
BEGIN
    THROW 51002, 'No existe dbo.GenerateEngineeringFolio. Ejecuta primero scripts/folio-system-database.sql.', 1;
END;

DECLARE @Pairs TABLE
(
    ProgramId INT NOT NULL,
    ProgramCode NVARCHAR(20) NOT NULL,
    DocumentTypeId INT NOT NULL,
    DocumentTypeCode NVARCHAR(10) NOT NULL
);

INSERT INTO @Pairs (ProgramId, ProgramCode, DocumentTypeId, DocumentTypeCode)
SELECT p.Id, p.Code, d.Id, d.Code
FROM dbo.Programs AS p
INNER JOIN dbo.DocumentTypes AS d
    ON d.Code IN (N'BCN', N'DCN', N'DFM');

DECLARE
    @ProgramId INT,
    @ProgramCode NVARCHAR(20),
    @DocumentTypeId INT,
    @DocumentTypeCode NVARCHAR(10),
    @FamilyId INT,
    @ResponsibleEngineerId INT,
    @CreatedByUserId INT,
    @CurrentCount INT,
    @GeneratedFolio NVARCHAR(50),
    @EngineeringChangeId INT,
    @ModelYear NVARCHAR(20),
    @Phase NVARCHAR(30),
    @CreatedAt DATETIME2,
    @Iteration INT;

DECLARE pair_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT ProgramId, ProgramCode, DocumentTypeId, DocumentTypeCode
FROM @Pairs
ORDER BY ProgramCode, DocumentTypeCode;

OPEN pair_cursor;

FETCH NEXT FROM pair_cursor
INTO @ProgramId, @ProgramCode, @DocumentTypeId, @DocumentTypeCode;

WHILE @@FETCH_STATUS = 0
BEGIN
    SELECT TOP (1)
        @FamilyId = f.Id
    FROM dbo.Families AS f
    WHERE f.ProgramId = @ProgramId
    ORDER BY f.Id;

    IF @FamilyId IS NULL
    BEGIN
        INSERT INTO dbo.Families (ProgramId, Name)
        VALUES (@ProgramId, N'GENERAL');

        SET @FamilyId = SCOPE_IDENTITY();
    END;

    SELECT TOP (1)
        @ResponsibleEngineerId = u.Id
    FROM dbo.Users AS u
    WHERE u.ProgramId = @ProgramId
      AND u.IsActive = 1
      AND u.Role = N'ENGINEER'
    ORDER BY u.Id;

    IF @ResponsibleEngineerId IS NULL
    BEGIN
        SELECT TOP (1)
            @ResponsibleEngineerId = u.Id
        FROM dbo.Users AS u
        WHERE u.ProgramId = @ProgramId
          AND u.IsActive = 1
        ORDER BY u.Id;
    END;

    IF @ResponsibleEngineerId IS NULL
    BEGIN
        PRINT CONCAT('SKIP ', @ProgramCode, '-', @DocumentTypeCode, ': no hay usuarios activos en el programa.');
        FETCH NEXT FROM pair_cursor
        INTO @ProgramId, @ProgramCode, @DocumentTypeId, @DocumentTypeCode;
        CONTINUE;
    END;

    SELECT TOP (1)
        @CreatedByUserId = u.Id
    FROM dbo.Users AS u
    WHERE u.IsActive = 1
      AND u.Role = N'ADMIN'
    ORDER BY u.Id;

    IF @CreatedByUserId IS NULL
    BEGIN
        SET @CreatedByUserId = @ResponsibleEngineerId;
    END;

    SELECT
        @CurrentCount = COUNT(1)
    FROM dbo.EngineeringChanges AS ec
    WHERE ec.ProgramId = @ProgramId
      AND ec.DocumentTypeId = @DocumentTypeId;

    SET @Iteration = 1;

    WHILE @CurrentCount < @TargetPerType
    BEGIN
        EXEC dbo.GenerateEngineeringFolio
            @ProgramId = @ProgramId,
            @DocumentTypeId = @DocumentTypeId,
            @Year = @SeedYear,
            @GeneratedFolio = @GeneratedFolio OUTPUT;

        SET @ModelYear = CAST(@SeedYear + ((@CurrentCount + @Iteration) % 2) AS NVARCHAR(20));
        SET @Phase = CASE ((@CurrentCount + @Iteration) % 4)
                        WHEN 0 THEN N'CONCEPT'
                        WHEN 1 THEN N'DESIGN'
                        WHEN 2 THEN N'VALIDATION'
                        ELSE N'RELEASE'
                     END;
        SET @CreatedAt = DATEADD(DAY, -((@CurrentCount + @Iteration) * 2), SYSUTCDATETIME());

        INSERT INTO dbo.EngineeringChanges
        (
            Folio,
            ProgramId,
            DocumentTypeId,
            FamilyId,
            ResponsibleEngineerId,
            CreatedByUserId,
            ModelYear,
            Phase,
            Status,
            CreatedAt,
            ClosedAt
        )
        VALUES
        (
            @GeneratedFolio,
            @ProgramId,
            @DocumentTypeId,
            @FamilyId,
            @ResponsibleEngineerId,
            @CreatedByUserId,
            @ModelYear,
            @Phase,
            N'OPEN',
            @CreatedAt,
            NULL
        );

        SET @EngineeringChangeId = SCOPE_IDENTITY();

        IF @DocumentTypeCode = N'BCN'
        BEGIN
            INSERT INTO dbo.EngineeringChangeBcnDetails
            (
                EngineeringChangeId,
                CarLeader,
                ChangeDescription
            )
            VALUES
            (
                @EngineeringChangeId,
                CONCAT(N'Lead ', @ProgramCode, N' BCN ', FORMAT(@CurrentCount + 1, '00')),
                CONCAT(N'BCN sample change for program ', @ProgramCode, N' record ', FORMAT(@CurrentCount + 1, '00'))
            );
        END;

        IF @DocumentTypeCode = N'DCN'
        BEGIN
            INSERT INTO dbo.EngineeringChangeDcnDetails
            (
                EngineeringChangeId,
                CarLeader,
                AssociatedDocument,
                ChangeDescription
            )
            VALUES
            (
                @EngineeringChangeId,
                CONCAT(N'Lead ', @ProgramCode, N' DCN ', FORMAT(@CurrentCount + 1, '00')),
                CONCAT(N'SPEC-', @ProgramCode, N'-', FORMAT(@CurrentCount + 1, '00')),
                CONCAT(N'DCN sample change for program ', @ProgramCode, N' record ', FORMAT(@CurrentCount + 1, '00'))
            );
        END;

        IF @DocumentTypeCode = N'DFM'
        BEGIN
            INSERT INTO dbo.EngineeringChangeDfmDetails
            (
                EngineeringChangeId,
                Composite,
                Issue,
                Target
            )
            VALUES
            (
                @EngineeringChangeId,
                CONCAT(N'Composite ', @ProgramCode, N' ', FORMAT(@CurrentCount + 1, '00')),
                CONCAT(N'DFM issue sample for ', @ProgramCode, N' record ', FORMAT(@CurrentCount + 1, '00')),
                CONCAT(N'DFM target sample for ', @ProgramCode, N' record ', FORMAT(@CurrentCount + 1, '00'))
            );
        END;

        SET @CurrentCount = @CurrentCount + 1;
        SET @Iteration = @Iteration + 1;
    END;

    PRINT CONCAT('OK ', @ProgramCode, '-', @DocumentTypeCode, ': total=', @CurrentCount);

    FETCH NEXT FROM pair_cursor
    INTO @ProgramId, @ProgramCode, @DocumentTypeId, @DocumentTypeCode;
END;

CLOSE pair_cursor;
DEALLOCATE pair_cursor;

PRINT 'Sample seed for EngineeringChanges completed.';
