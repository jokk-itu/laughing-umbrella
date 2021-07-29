using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Contracts.Responses;
using Database;
using Database.Entities;
using MediatR;

namespace Mediator.CreatePerson
{
    public class CreatePersonHandler : IRequestHandler<CreatePersonCommand, (DatabaseStatusCode, Person)>
    {
        private readonly SportsContext _context;
        private readonly IMapper _mapper;

        public CreatePersonHandler(SportsContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<(DatabaseStatusCode, Person)> Handle(CreatePersonCommand request,
            CancellationToken cancellationToken)
        {
            var exists = _context.People.Any(p => p.Name.Equals(request.Name));
            if (exists)
                return (DatabaseStatusCode.Conflict, null);

            var person = _mapper.Map<Person>(request);
            var createdPerson = await _context.People.AddAsync(person, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return (DatabaseStatusCode.Created, createdPerson.Entity);
        }
    }
}