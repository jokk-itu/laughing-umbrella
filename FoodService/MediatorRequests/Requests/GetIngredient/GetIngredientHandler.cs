using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database.Entities.Nodes;
using MediatR;
using Neo4j.Driver;

namespace MediatorRequests.Requests.GetIngredient
{
    public class GetIngredientHandler : IRequestHandler<GetIngredientQuery, Ingredient>
    {
        private readonly IDriver _driver;
        private readonly IMapper _mapper;

        public GetIngredientHandler(IDriver driver, IMapper mapper)
        {
            _driver = driver;
            _mapper = mapper;
        }
        
        public async Task<Ingredient> Handle(GetIngredientQuery request, CancellationToken cancellationToken)
        {
            await using var session = _driver.AsyncSession();
            var ingredient = await session.ReadTransactionAsync(async transaction =>
            {
                const string cypher =
                    @"MATCH (i:Ingredient) WHERE id(i) = $id RETURN id(i) AS id, i.name AS name, i.supplier AS supplier";
                var result = await transaction.RunAsync(cypher, new {id = request.Id});

                if (!await result.FetchAsync())
                    return null;

                var record = result.Current;
                return _mapper.Map<Ingredient>(record);
            });
            return ingredient;
        }
    }
}
