using Database.Entities.Nodes;
using MediatR;

namespace MediatorRequests.CreateDish
{
    public record CreateDishCommand : IRequest<Dish>
    {
        public string Name { get; init; }

        public int Price { get; init; }
    }
}