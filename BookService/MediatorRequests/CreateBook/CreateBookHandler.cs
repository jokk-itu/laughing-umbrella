using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database;
using Database.Entities;
using MediatR;

namespace MediatorRequests.CreateBook
{
    public class CreateBookHandler : IRequestHandler<CreateBookCommand, Book>
    {
        private readonly IMapper _mapper;
        private readonly MongoContext _context;


        public CreateBookHandler(IMapper mapper, MongoContext context)
        {
            _mapper = mapper;
            _context = context;
        }
        
        public async Task<Book> Handle(CreateBookCommand request, CancellationToken cancellationToken)
        {
            var book = _mapper.Map<Book>(request);
            await _context.Books.InsertOneAsync(book, cancellationToken: cancellationToken);
            return book;
        }
    }
}