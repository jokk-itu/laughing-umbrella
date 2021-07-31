using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Database;
using Database.Entities;
using MediatR;
using MongoDB.Driver;

namespace MediatorRequests.GetAuthor
{
    public class GetAuthorHandle : IRequestHandler<GetAuthorQuery, Author>
    {
        private readonly IMapper _mapper;
        private readonly MongoContext _context;

        public GetAuthorHandle(IMapper mapper, MongoContext context)
        {
            _mapper = mapper;
            _context = context;
        }

        public async Task<Author> Handle(GetAuthorQuery request, CancellationToken cancellationToken)
        {
            var author =
                await _context.Authors.FindAsync(a => a.Id.Equals(request.Id), cancellationToken: cancellationToken);

            return await author.FirstOrDefaultAsync(cancellationToken);
        }
    }
}