db.auth('admin_user', 'admin_pass');
rs.initiate(
	{_id: "rs1", version: 1,
		members: [
			{_id: 0, host: "mongo_replica_1:27017"},
			{_id: 1, host: "mongo_replica_2:27017"},
			{_id: 2, host: "mongo_replica_3:27017"}
		]
	}
);
