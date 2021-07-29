using System.Collections.Generic;
using Database;
using Database.Entities;
using MediatR;

namespace Mediator.ReadGenders
{
    public record ReadGendersQuery : IRequest<(DatabaseStatusCode, ICollection<Gender>)>;
}