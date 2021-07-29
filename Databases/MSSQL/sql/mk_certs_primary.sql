DROP LOGIN dbm_login
DROP USER dbm_user
DROP CERTIFICATE dbm_certificate
GO

USE master
GO
 
CREATE LOGIN dbm_login WITH PASSWORD = 'MyStr0ngPa$w0rd';
CREATE USER dbm_user FOR LOGIN dbm_login;
GO
 
ALTER SERVICE MASTER KEY FORCE REGENERATE

CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'MyStr0ngPa$w0rd';
GO
CREATE CERTIFICATE dbm_certificate WITH SUBJECT = 'dbm';
BACKUP CERTIFICATE dbm_certificate
TO FILE = '/tmp/dbm_certificate.cer'
WITH PRIVATE KEY (
        FILE = '/tmp/dbm_certificate.pvk',
        ENCRYPTION BY PASSWORD = 'MyStr0ngPa$w0rd'
    );
GO
