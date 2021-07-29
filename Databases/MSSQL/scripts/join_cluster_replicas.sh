#! /bin/sh

#join cluster on replica nodes
sudo docker exec -it mssql_replica_1 /opt/mssql-tools/bin/sqlcmd -S . -U SA -P "Password12!" -i "/join_cluster_replicas.sql"
sudo docker exec -it mssql_replica_2 /opt/mssql-tools/bin/sqlcmd -S . -U SA -P "Password12!" -i "/join_cluster_replicas.sql"

