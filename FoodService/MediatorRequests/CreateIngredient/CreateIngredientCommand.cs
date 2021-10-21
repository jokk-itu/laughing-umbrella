using Database.Entities.Nodes;
using MediatR;

namespace MediatorRequests.CreateIngredient
{
    public record CreateIngredientCommand : IRequest<Ingredient>
    {
        public string Name { get; init; }
        
        public int Weight { get; init; }
    }
}