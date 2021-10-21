using System;
using System.Threading;
using System.Threading.Tasks;
using Database;
using MediatR;

namespace MediatorRequests.UpdateIngredient
{
    public class UpdateIngredientCommandHandler : IRequestHandler<UpdateIngredientCommand, StatusResult>
    {
        public UpdateIngredientCommandHandler()
        {
            
        }
        
        public async Task<StatusResult> Handle(UpdateIngredientCommand request, CancellationToken cancellationToken)
        {
            
            throw new NotImplementedException();
        }
    }
}