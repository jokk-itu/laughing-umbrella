using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database;
using Database.Entities;
using MediatR;
using MongoDB.Bson;

namespace MediatorRequests.CreateAuthor
{
    public class CreateAuthorHandler : IRequestHandler<CreateAuthorCommand, Author>
    {
        private readonly IMapper _mapper;
        private readonly MongoContext _context;

        public CreateAuthorHandler(IMapper mapper, MongoContext context)
        {
            _mapper = mapper;
            _context = context;
        }
        
        public async Task<Author> Handle(CreateAuthorCommand request, CancellationToken cancellationToken)
        {
            var author = _mapper.Map<Author>(request);
            await _context.Authors.InsertOneAsync(author, cancellationToken: cancellationToken);
            return author;
        }
    }
}