using System.Collections.Generic;
using Database.Entities.Nodes;
using MediatR;

namespace MediatorRequests.GetIngredients
{
    public record GetIngredientsQuery : IRequest<ICollection<Ingredient>>;
}