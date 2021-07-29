using Database.Entities.Nodes;
using MediatR;

namespace MediatorRequests.Requests.CreateIngredient
{
    public record CreateIngredientCommand : IRequest<Ingredient>
    {
        public string Name { get; init; }
        
        public string Supplier { get; init; }

        public CreateIngredientCommand() {}
    }
}