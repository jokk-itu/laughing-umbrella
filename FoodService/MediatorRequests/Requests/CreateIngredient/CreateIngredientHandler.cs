using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database.Entities.Nodes;
using MediatR;
using Neo4j.Driver;

namespace MediatorRequests.Requests.CreateIngredient
{
    public class CreateIngredientHandler : IRequestHandler<CreateIngredientCommand, Ingredient>
    {
        private readonly IDriver _driver;
        private readonly IMapper _mapper;

        public CreateIngredientHandler(IDriver driver, IMapper mapper)
        {
            _driver = driver;
            _mapper = mapper;
        }
        
        public async Task<Ingredient> Handle(CreateIngredientCommand request, CancellationToken cancellationToken)
        {
            var session = _driver.AsyncSession();
            var ingredient = await session.WriteTransactionAsync(async transaction =>
            {
                const string cypher = @"
CREATE (i:Ingredient {name: $name, supplier: $supplier}) 
RETURN id(i) AS id, i.name AS name, i.supplier as supplier";
                var result = await transaction.RunAsync(cypher, 
                    new { name = request.Name, supplier = request.Supplier });
                
                return _mapper.Map<Ingredient>(await result.PeekAsync());
            });
            return ingredient;
        }
    }
}