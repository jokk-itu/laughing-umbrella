using System.Collections.Generic;
using Database;
using Database.Entities;
using MediatR;

namespace Mediator.ReadPersons
{
    public record ReadPersonsQuery : IRequest<(DatabaseStatusCode, ICollection<Person>)>;
}