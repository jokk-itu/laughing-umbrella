#! /bin/sh

bash cp_sql_to_nodes.sh
bash create_certs_primary.sh
bash cp_certs_replicas.sh
bash create_certs_replicas.sh
bash enable_always_on_nodes.sh
bash create_cluster_primary.sh
bash join_cluster_replicas.sh
bash create_databases.sh
