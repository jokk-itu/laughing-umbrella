using Database;
using Database.Entities;
using MediatR;

namespace Mediator.CreatePerson
{
    public record CreatePersonCommand(
        string Name,
        long GenderId,
        float Height
    ) : IRequest<(DatabaseStatusCode, Person)>;
}