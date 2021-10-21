using Database.Entities.Nodes;
using MediatR;

namespace MediatorRequests.GetIngredient
{
    public record GetIngredientQuery(int Id) : IRequest<Ingredient>;
}