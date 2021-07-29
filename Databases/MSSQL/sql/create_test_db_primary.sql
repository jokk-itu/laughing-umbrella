CREATE DATABASE agtest;
GO
ALTER DATABASE agtest SET RECOVERY FULL;
GO
BACKUP DATABASE agtest TO DISK = '/var/opt/mssql/data/agtestdb.bak';
GO
ALTER AVAILABILITY GROUP [ag1] ADD DATABASE [agtest];
GO

CREATE TABLE persons (
    id bigint IDENTITY(1,1) not null,
    age int not null,
    name varchar(20) not null,
    PRIMARY KEY (id)
)
GO

INSERT INTO persons (age, name) VALUES (20, 'Ole')
GO
