#! /bin/sh

#enable alwayson on all nodes
sudo docker exec -it mssql_primary /opt/mssql-tools/bin/sqlcmd -S . -U SA -P "Password12!" -i "/enable_alwayson.sql"
sudo docker exec -it mssql_replica_1 /opt/mssql-tools/bin/sqlcmd -S . -U SA -P "Password12!" -i "/enable_alwayson.sql"
sudo docker exec -it mssql_replica_2 /opt/mssql-tools/bin/sqlcmd -S . -U SA -P "Password12!" -i "/enable_alwayson.sql"

