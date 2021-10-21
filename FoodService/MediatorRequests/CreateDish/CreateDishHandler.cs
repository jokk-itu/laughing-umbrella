using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database.Entities.Nodes;
using MediatR;
using Neo4j.Driver;

namespace MediatorRequests.CreateDish
{
    public class CreateDishHandler : IRequestHandler<CreateDishCommand ,Dish>
    {
        private readonly IDriver _driver;
        private readonly IMapper _mapper;

        public CreateDishHandler(IDriver driver, IMapper mapper)
        {
            _driver = driver;
            _mapper = mapper;
        }
        
        public async Task<Dish> Handle(CreateDishCommand request, CancellationToken cancellationToken)
        {
            var session = _driver.AsyncSession();
            var dish = await session.WriteTransactionAsync(async transaction =>
            {
                const string cypher = @"
CREATE (d:Dish {name: $name, price: $price}) 
RETURN id(d) AS id, d.name AS name, d.price as price";
                var result = await transaction.RunAsync(cypher, 
                    new { name = request.Name, price = request.Price });
                var record = await result.PeekAsync();
                await transaction.CommitAsync();
                return _mapper.Map<Dish>(record);
            });
            return dish;
        }
    }
}