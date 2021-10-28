using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database.Entities.Nodes;
using MediatR;
using Microsoft.Extensions.Logging;
using Neo4j.Driver;

namespace MediatorRequests.GetIngredient
{
    public class GetIngredientHandler : IRequestHandler<GetIngredientQuery, Ingredient>
    {
        private readonly IDriver _driver;
        private readonly IMapper _mapper;
        private readonly ILogger<GetIngredientHandler> _logger;

        public GetIngredientHandler(IDriver driver, IMapper mapper, ILogger<GetIngredientHandler> logger)
        {
            _driver = driver;
            _mapper = mapper;
            _logger = logger;
        }
        
        public async Task<Ingredient> Handle(GetIngredientQuery request, CancellationToken cancellationToken)
        {
            await using var session = _driver.AsyncSession();
            return await session.ReadTransactionAsync(async transaction =>
            {
                const string cypher = @"
MATCH (i:Ingredient)
WHERE id(i) = $id 
RETURN id(i) AS id, i.name AS name, i.weight AS weight";
                var result = await transaction.RunAsync(cypher, new {id = request.Id});
                var ingredient = await result.PeekAsync();
                if (ingredient is null)
                    return null;
                return _mapper.Map<Ingredient>(ingredient);
            });
        }
    }
}
