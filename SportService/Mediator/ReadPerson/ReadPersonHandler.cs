using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.Responses;
using Database;
using Database.Entities;
using MediatR;

namespace Mediator.ReadPerson
{
    public class ReadPersonHandler : IRequestHandler<ReadPersonQuery, (DatabaseStatusCode, Person)>
    {
        private readonly SportsContext _context;
        private readonly IMapper _mapper;

        public ReadPersonHandler(SportsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        
        public async Task<(DatabaseStatusCode, Person)> Handle(ReadPersonQuery request, CancellationToken cancellationToken)
        {
            var person = await _context.People.FindAsync(new object[] {request.PersonId}, cancellationToken: cancellationToken);
            return person is null ? 
                (DatabaseStatusCode.NotFound, null) : 
                (DatabaseStatusCode.Found, person);
        }
    }
}