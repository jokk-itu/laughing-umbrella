#! /bin/sh

#copy certs to replica nodes
sudo docker cp mssql_primary:/tmp/dbm_certificate.cer /tmp
sudo docker cp mssql_primary:/tmp/dbm_certificate.pvk /tmp
sudo docker cp /tmp/dbm_certificate.cer mssql_replica_1:/tmp/
sudo docker cp /tmp/dbm_certificate.pvk mssql_replica_1:/tmp/
sudo docker cp /tmp/dbm_certificate.cer mssql_replica_2:/tmp/
sudo docker cp /tmp/dbm_certificate.pvk mssql_replica_2:/tmp/

