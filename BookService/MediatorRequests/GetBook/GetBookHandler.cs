using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database;
using Database.Entities;
using MediatR;
using MongoDB.Driver;

namespace MediatorRequests.GetBook
{
    public class GetBookHandler : IRequestHandler<GetBookQuery, Book>
    {
        private readonly IMapper _mapper;
        private readonly MongoContext _context;

        public GetBookHandler(IMapper mapper, MongoContext context)
        {
            _mapper = mapper;
            _context = context;
        }
        
        public async Task<Book> Handle(GetBookQuery request, CancellationToken cancellationToken)
        {
            var book = await _context.Books.FindAsync(b => b.Id.Equals(request.Id), cancellationToken: cancellationToken);
            
            return await book.FirstOrDefaultAsync(cancellationToken);
        }
    }
}