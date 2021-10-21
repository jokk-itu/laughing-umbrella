using System.Threading;
using System.Threading.Tasks;
using Database;
using MediatR;
using Neo4j.Driver;

namespace MediatorRequests.UpdateIngredient
{
    public class UpdateIngredientHandler : IRequestHandler<UpdateIngredientCommand, StatusResult>
    {
        private readonly IDriver _driver;

        public UpdateIngredientHandler(IDriver driver)
        {
            _driver = driver;
        }
        
        public async Task<StatusResult> Handle(UpdateIngredientCommand request, CancellationToken cancellationToken)
        {
            var session = _driver.AsyncSession();
            return await session.WriteTransactionAsync(async transaction =>
            {
                const string cypher = @"
MATCH (i:Ingredient)
WHERE id(i) = $id
SET i.name = $name
SET i.weight = $weight
RETURN i";
                var result = await transaction.RunAsync(cypher,
                    new {id = request.Id, name = request.Name, weight = request.Weight});
                
                if (!await result.FetchAsync())
                {
                    await transaction.RollbackAsync();
                    return StatusResult.NotFound;
                }

                await transaction.CommitAsync();
                return StatusResult.Success;
            });
        }
    }
}