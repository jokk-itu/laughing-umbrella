DROP LOGIN dbm_login
DROP USER dbm_user
DROP CERTIFICATE dbm_certificate
GO

CREATE LOGIN dbm_login WITH PASSWORD = 'MyStr0ngPa$w0rd';
CREATE USER dbm_user FOR LOGIN dbm_login;
GO

ALTER SERVICE MASTER KEY FORCE REGENERATE
GO
 
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'MyStr0ngPa$w0rd';
GO
CREATE CERTIFICATE dbm_certificate   
    AUTHORIZATION dbm_user
    FROM FILE = '/tmp/dbm_certificate.cer'
    WITH PRIVATE KEY (
    FILE = '/tmp/dbm_certificate.pvk',
    DECRYPTION BY PASSWORD = 'MyStr0ngPa$w0rd'
);
GO
