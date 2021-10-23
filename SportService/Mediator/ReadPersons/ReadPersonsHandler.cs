using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Database;
using Database.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Mediator.ReadPersons
{
    public class ReadPersonsHandler : IRequestHandler<ReadPersonsQuery, (DatabaseStatusCode, ICollection<Person>)>
    {
        private readonly SportsContext _context;

        public ReadPersonsHandler(SportsContext context)
        {
            _context = context;
        }

        public async Task<(DatabaseStatusCode, ICollection<Person>)> Handle(ReadPersonsQuery request,
            CancellationToken cancellationToken)
        {
            var persons = await _context.People
                .ToListAsync(cancellationToken: cancellationToken);
            return (DatabaseStatusCode.Ok, persons);
        }
    }
}