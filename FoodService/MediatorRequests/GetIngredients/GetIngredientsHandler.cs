using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database.Entities.Nodes;
using MediatR;
using Neo4j.Driver;

namespace MediatorRequests.GetIngredients
{
    public class GetIngredientsHandler : IRequestHandler<GetIngredientsQuery, ICollection<Ingredient>>
    {
        private readonly IDriver _driver;
        private readonly IMapper _mapper;

        public GetIngredientsHandler(IDriver driver, IMapper mapper)
        {
            _driver = driver;
            _mapper = mapper;
        }
        
        public async Task<ICollection<Ingredient>> Handle(GetIngredientsQuery request, CancellationToken cancellationToken)
        {
            await using var session = _driver.AsyncSession();
            var ingredients = await session.ReadTransactionAsync(async transaction =>
            {
                const string cypher = @"MATCH (i:Ingredient) RETURN id(i) AS id, i.name AS name, i.weight AS weight";
                var result = await transaction.RunAsync(cypher);
                if (await result.PeekAsync() is null)
                    return null;
                
                return await result.ToListAsync(record => _mapper.Map<Ingredient>(record));
            });
            return ingredients;
        }
    }
}