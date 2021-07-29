#! /bin/sh

#copy mk_cert scripts to the nodes
sudo docker cp ../sql/mk_certs_primary.sql mssql_primary:/
sudo docker cp ../sql/mk_certs_replica.sql mssql_replica_1:/ 
sudo docker cp ../sql/mk_certs_replica.sql mssql_replica_2:/

#copy alwayson scripts to the nodes
sudo docker cp ../sql/enable_alwayson.sql mssql_primary:/
sudo docker cp ../sql/enable_alwayson.sql mssql_replica_1:/
sudo docker cp ../sql/enable_alwayson.sql mssql_replica_2:/

#copy cluster creation script to primary node
sudo docker cp ../sql/create_cluster.sql mssql_primary:/

#copy join cluster script to replica nodes
sudo docker cp ../sql/join_cluster_replicas.sql mssql_replica_1:/
sudo docker cp ../sql/join_cluster_replicas.sql mssql_replica_2:/

#copy create database sql to primary node
sudo docker cp ../sql/create_databases.sql mssql_primary:/
