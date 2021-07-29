DROP AVAILABILITY GROUP [AG1]
GO

CREATE AVAILABILITY GROUP [AG1]
        WITH (CLUSTER_TYPE = NONE)
        FOR REPLICA ON
        N'mssql_primary'
            WITH (
            ENDPOINT_URL = N'tcp://mssql_primary:5022',
            AVAILABILITY_MODE = ASYNCHRONOUS_COMMIT,
                SEEDING_MODE = AUTOMATIC,
                FAILOVER_MODE = MANUAL,
            SECONDARY_ROLE (ALLOW_CONNECTIONS = ALL)
                ),
        N'mssql_replica_1'
            WITH (
            ENDPOINT_URL = N'tcp://mssql_replica_1:5022',
            AVAILABILITY_MODE = ASYNCHRONOUS_COMMIT,
                SEEDING_MODE = AUTOMATIC,
                FAILOVER_MODE = MANUAL,
            SECONDARY_ROLE (ALLOW_CONNECTIONS = ALL)
                ),
        N'mssql_replica_2'
            WITH (
            ENDPOINT_URL = N'tcp://mssql_replica_2:5022',
            AVAILABILITY_MODE = ASYNCHRONOUS_COMMIT,
                SEEDING_MODE = AUTOMATIC,
                FAILOVER_MODE = MANUAL,
            SECONDARY_ROLE (ALLOW_CONNECTIONS = ALL)
                );
GO
