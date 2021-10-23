using Database;
using Database.Entities;
using MediatR;

namespace Mediator.ReadPerson
{
    public record ReadPersonQuery(long PersonId) : IRequest<(DatabaseStatusCode, Person)>;
}