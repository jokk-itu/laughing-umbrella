using Database.Entities;
using MediatR;

namespace MediatorRequests.GetAuthor
{
    public record GetAuthorQuery : IRequest<Author>
    {
        public string Id { get; init; }

        public GetAuthorQuery()
        {
            
        }

        public GetAuthorQuery(string id)
        {
            Id = id;
        }
    }
}