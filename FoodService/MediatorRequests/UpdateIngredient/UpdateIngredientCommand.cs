using Database;
using MediatR;

namespace MediatorRequests.UpdateIngredient
{
    public class UpdateIngredientCommand :  IRequest<StatusResult>
    {
        public int Id { get; init; }
        
        public string Name {get; init; }
        
        public int Weight { get; init; }
    }
}