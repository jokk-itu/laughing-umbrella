using Database.Entities;
using MediatR;
using MongoDB.Bson;

namespace MediatorRequests.GetBook
{
    public record GetBookQuery : IRequest<Book>
    {
        public GetBookQuery(string id)
        {
            Id = id;
        }

        public GetBookQuery() {}

        public string Id { get; }
    }
}