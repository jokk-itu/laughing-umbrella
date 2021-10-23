using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.Responses;
using Dapper;
using Database;
using Database.Entities;
using MediatR;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Mediator.ReadGenders
{
    public class
        ReadGendersHandler : IRequestHandler<ReadGendersQuery, (DatabaseStatusCode, ICollection<Gender>)>
    {
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public ReadGendersHandler(IMapper mapper, IConfiguration configuration)
        {
            _mapper = mapper;
            _configuration = configuration;
        }

        public async Task<(DatabaseStatusCode, ICollection<Gender>)> Handle(ReadGendersQuery request,
            CancellationToken cancellationToken)
        {
            const string sql = @"SELECT * FROM genders";
            await using var connection = new SqlConnection(_configuration.GetConnectionString("default"));
            var genders = await connection.QueryAsync<Gender>(sql) as ICollection<Gender>;
            return (DatabaseStatusCode.Ok, genders);
        }
    }
}