/* =========================================================
   05 - SEED DATA
========================================================= */


/* =========================
   Programs
========================= */

INSERT INTO Programs (Code, Name)
VALUES
('Y2XX', 'Y2XX Corvette'),
('31XX', '31XX-2'),
('OPAL', 'Opal'),
('CX727', 'CX727 FORD');
GO


/* =========================
   Document Types
========================= */

INSERT INTO DocumentTypes (Code, Name)
VALUES
('BCN', 'BOM Change Notice'),
('DCN', 'Design Change Notice'),
('DFM', 'Design for Manufacturing');
GO


/* =========================
   DREs
========================= */

INSERT INTO DREs (ProgramId, Name)
VALUES

-- Y2XX Corvette
(1, 'Edvard Tobias'),
(1, 'Nicholas Kafkafkis'),
(1, 'Amal Baiz'),

-- 31XX-2
(2, 'Jose Ignacio Rivera'),
(2, 'Christian Alejandro Cruz'),

-- Opal
(3, 'Raghuram Ganti'),

-- CX727 FORD
(4, 'Moises Damian Herrero'),
(4, 'Michael Borowski');

GO


/* =========================
   Car Leaders
========================= */

INSERT INTO CarLeaders (ProgramId, Name)
VALUES

-- Y2XX Corvette
(1, 'Willy Diaz'),

-- 31XX-2
(2, 'Uriel Gonzalez'),

-- Opal
(3, 'Fernando Medina'),

-- CX727 FORD
(4, 'Pedro Flores');

GO


/* =========================
   Families
========================= */

INSERT INTO Families (ProgramId, Name)
VALUES

-- Y2XX Corvette
(1, 'Battery Cable'),
(1, 'Body Convertible LHD YG'),
(1, 'Body Coupe LHD  YG'),
(1, 'Body Extension'),
(1, 'Body Convertible LHD YC'),
(1, 'Body Coupe LHD YC'),
(1, 'Body LHD YC/YH NHP1'),
(1, 'Body LHD YG/YR/YS HP1'),
(1, 'Body RHD HP1'),
(1, 'Body RHD NHP1'),
(1, 'Chassis Convertible'),
(1, 'Chassis Coupe'),
(1, 'Crossbody YCYH LHD'),
(1, 'Crossbody YCYH RHD'),
(1, 'Crossbody YGYS LHD'),
(1, 'Crossbody YGYS RHD'),
(1, 'Crossbody YR'),
(1, 'Door Metal LHD'),
(1, 'Door Metal RHD'),
(1, 'Door Trim LHD'),
(1, 'Door Trim RHD'),
(1, 'Engine Convert LT7'),
(1, 'Engine Conv-HP1 LT2'),
(1, 'Engine Coupe LT7'),
(1, 'Engine Coupe-HP1 LT2'),
(1, 'Engine LS6'),
(1, 'Engine LT2'),
(1, 'Engine LT6'),
(1, 'Floor Console LHD'),
(1, 'Floor Console RHD'),
(1, 'Front Compartment'),
(1, 'Front Compartment YR'),
(1, 'Front Fascia NB'),
(1, 'Front Fascia WB'),
(1, 'Hatch Lid'),
(1, 'IP/ WRG LHD'),
(1, 'IP/ WRG RHD'),
(1, 'Jumper Harness'),
(1, 'Rear Fascia NB'),
(1, 'Rear Fascia WB'),
(1, 'Roof Console'),

-- 31XX-2
(2, 'Engine'),
(2, 'Foglamp GMC'),
(2, 'Foglamp Chevy'),
(2, 'IP'),
(2, 'Headliner Base'),
(2, 'Headliner Sunroof'),
(2, 'Chassis'),
(2, 'Base LH'),
(2, 'Base RH'),
(2, 'Premium LH'),
(2, 'Premium RH'),
(2, 'Rear LH'),
(2, 'Rear RH'),
(2, 'Trim LH'),
(2, 'Trim RH'),

-- Opal
(3, 'Front Left Door'),
(3, 'Front Right Door'),
(3, 'RR Fascia'),
(3, 'FR Fascia'),
(3, 'FEM'),
(3, '2R Cushion'),
(3, 'RR Subframe'),

-- CX727 FORD
(4, 'Body 14A005 LHD'),
(4, '14C210 Misceláneo'),
(4, '19F561 Misceláneo');

GO


/* =========================
   Users
   Password = Username
   HASH SHA2_256
========================= */

INSERT INTO Users (
    ProgramId,
    FirstName,
    LastName,
    Username,
    PasswordHash,
    Role,
    JobTitle,
    Location
)
VALUES

/* ===== Y2XX ===== */

(1,'Aaron', 'Amaro','aamaro01',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','aamaro01'),2),'drafter','Drafter','Torres'),
(1,'Alondra Jaqueline', 'Granados','agranados01',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','agranados01'),2),'engineer','Product Engineer','Torres'),
(1,'Ana Elisa', 'Saldaña','asaldana02',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','asaldana02'),2),'drafter','Drafter','Torres'),
(1,'Angel Alexis', 'Gutierrez','agutierrez11',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','agutierrez11'),2),'drafter','Drafter','Torres'),
(1,'Armando Arturo', 'Escobar','aescobargarcia',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','aescobargarcia'),2),'engineer','Product Engineer','Torres'),
(1,'Brenda Lizeth', 'Lucero','blucero',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','blucero'),2),'drafter','Drafter','Torres'),
(1,'Carla Ivonne', 'Ramos','cramos11',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','cramos11'),2),'drafter','Drafter','Torres'),
(1,'Cristal Estefania', 'Perez','cperez14',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','cperez14'),2),'drafter','Drafter','Torres'),
(1,'Diego Eduardo', 'Pedroza','dpedroza',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','dpedroza'),2),'drafter','Drafter','Torres'),
(1,'Eibrahim Armando', 'Juarez','ejuarez02',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','ejuarez02'),2),'engineer','Product Engineer','Torres'),
(1,'Enrique', 'Suarez','esuarezlopez',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','esuarezlopez'),2),'engineer','Product Engineer','Torres'),
(1,'Esmeralda', 'Delgado','edelgadogarcia',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','edelgadogarcia'),2),'engineer','Product Engineer','Torres'),
(1,'Estefanny', 'Mendoza','emendoza10',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','emendoza10'),2),'drafter','Drafter','Torres'),
(1,'Filiberto', 'Dominguez','fdominguezamparan',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','fdominguezamparan'),2),'drafter','Drafter','Torres'),
(1,'Francisco Giovanni', 'Andrade','fandraderuiz',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','fandraderuiz'),2),'drafter','Drafter','Torres'),
(1,'Hector Abraham', 'Peralta','hperalta',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','hperalta'),2),'engineer','Product Engineer','Torres'),
(1,'Jael Yajaira', 'Camacho','jcamachocoss',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','jcamachocoss'),2),'drafter','Drafter','Torres'),
(1,'Jose Fernando', 'Cerde','jcerdesepulveda',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','jcerdesepulveda'),2),'engineer','Product Engineer','Torres'),
(1,'Julissa Elizabeth', 'Samaniego','jsamaniego02',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','jsamaniego02'),2),'engineer','Product Engineer','Torres'),
(1,'Litzy', 'Barrera','lbarrera04',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','lbarrera04'),2),'drafter','Drafter','Torres'),
(1,'Luis Alberto', 'Montoya','lmontoyamendez',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','lmontoyamendez'),2),'drafter','Drafter','Torres'),
(1,'Marcos Alfredo', 'Galván','mgalvan',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','mgalvan'),2),'engineer','Product Engineer','Torres'),
(1,'Marisol', 'Yañes','myanescarbajal',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','myanescarbajal'),2),'engineer','Product Engineer','Torres'),
(1,'Naidelin Cristal', 'Hernandez','nhernandez10',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','nhernandez10'),2),'drafter','Drafter','Torres'),
(1,'Oscar Eduardo', 'Navarro','onavarro',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','onavarro'),2),'engineer','Product Engineer','Torres'),
(1,'Selena', 'Minjares','sminjares',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','sminjares'),2),'drafter','Drafter','Torres'),
(1,'Verónica', 'Garcia','vgarciarios',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','vgarciarios'),2),'engineer','Product Engineer','Torres'),
(1,'Laura Cristina', 'Andrade','landradecardosa',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','landradecardosa'),2),'lead','Lead Product','Torres'),

/* ===== 31XX ===== */

(2,'Jorge Azahel', 'Valles','jvalles',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','jvalles'),2),'lead','Lead Product','Torres'),
(2,'Diana Cristina', 'Quiroz','dquirozresendez',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','dquirozresendez'),2),'drafter','Drafter','Torres'),
(2,'Dixie Alejandra', 'Arenivas','darenivasaguirre',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','darenivasaguirre'),2),'drafter','Drafter','Torres'),
(2,'Fidel Ernesto', 'Arellano','farellanohinojosa',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','farellanohinojosa'),2),'drafter','Drafter','Torres'),
(2,'Julia Lizeth', 'Sanchez','jsanchezaleman',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','jsanchezaleman'),2),'engineer','Product Engineer','Torres'),
(2,'Karla Pamela', 'Velez','kvelez',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','kvelez'),2),'engineer','Product Engineer','Torres'),
(2,'Marcos Antonio', 'Miramontes','mmiramontes',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','mmiramontes'),2),'drafter','Drafter','Torres'),
(2,'Mayte Dayana', 'Molinar','mmolinar01',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','mmolinar01'),2),'engineer','Product Engineer','Torres'),
(2,'Omar Andres', 'Trejo','otrejogaytan',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','otrejogaytan'),2),'engineer','Product Engineer','Torres'),
(2,'Isai', 'Valles','ivalles01',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','ivalles01'),2),'drafter','Drafter','Torres'),

/* ===== OPAL ===== */

(3,'Nayely', 'Hernandez','nhernandezaranda',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','nhernandezaranda'),2),'drafter','Drafter','Monarca'),
(3,'Claudia Elena', 'Preciado','cpreciadovargas',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','cpreciadovargas'),2),'drafter','Drafter','Monarca'),
(3,'Jose Ivan', 'Hernandez','jhernandez66',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','jhernandez66'),2),'engineer','Product Engineer','Monarca'),
(3,'Silvia Nayeli', 'Meza','smeza01',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','smeza01'),2),'engineer','Product Engineer','Monarca'),
(3,'Lino', 'Loera','lloera01',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','lloera01'),2),'lead','Lead Product','Monarca'),

/* ===== CX727 ===== */

(4,'Jesus Alfredo', 'Damian','jdamian',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','jdamian'),2),'drafter','Drafter','Monarca'),
(4,'Adriana Ivette', 'Licon','alicon',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','alicon'),2),'engineer','Product Engineer','Monarca'),
(4,'Eduardo Manuel', 'Reyes','ereyes03',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','ereyes03'),2),'engineer','Product Engineer','Monarca'),
(4,'Nohemi', 'De la Cruz','ndelacruzgarcia',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','ndelacruzgarcia'),2),'drafter','Drafter','Monarca'),
(4,'Myrna Lizeth', 'Rodriguez','mrodriguezcamargo',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','mrodriguezcamargo'),2),'lead','Lead Product','Monarca');

GO
