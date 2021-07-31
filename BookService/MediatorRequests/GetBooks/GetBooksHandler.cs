using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database;
using Database.Entities;
using MediatR;
using MongoDB.Driver;

namespace MediatorRequests.GetBooks
{
    public class GetBooksHandler : IRequestHandler<GetBooksQuery, ICollection<Book>>
    {
        private readonly IMapper _mapper;
        private readonly MongoContext _context;

        public GetBooksHandler(IMapper mapper, MongoContext context)
        {
            _mapper = mapper;
            _context = context;
        }
        
        public async Task<ICollection<Book>> Handle(GetBooksQuery request, CancellationToken cancellationToken)
        {
            var books = await _context.Books.FindAsync(_ => true, cancellationToken: cancellationToken);
            return await books.ToListAsync(cancellationToken);
        }
    }
}