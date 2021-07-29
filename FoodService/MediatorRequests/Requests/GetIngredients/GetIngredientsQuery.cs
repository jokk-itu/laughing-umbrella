using System.Collections.Generic;
using Database.Entities.Nodes;
using MediatR;

namespace MediatorRequests.Requests.GetIngredients
{
    public record GetIngredientsQuery : IRequest<ICollection<Ingredient>>;
}