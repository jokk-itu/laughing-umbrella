#! /bin/sh

#make certs on primary node
sudo docker exec -it mssql_primary /opt/mssql-tools/bin/sqlcmd -S . -U SA -P "Password12!" -i "/mk_certs_primary.sql"
