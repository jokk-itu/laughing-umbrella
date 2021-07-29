#! /bin/sh

#create the cluster on the primary node
sudo docker exec -it mssql_primary /opt/mssql-tools/bin/sqlcmd -S . -U SA -P "Password12!" -i "/create_cluster.sql"

