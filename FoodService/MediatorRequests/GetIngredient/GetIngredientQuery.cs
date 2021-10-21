using Database.Entities.Nodes;
using MediatR;

namespace MediatorRequests.Requests.GetIngredient
{
    public record GetIngredientQuery(int Id) : IRequest<Ingredient>;
}