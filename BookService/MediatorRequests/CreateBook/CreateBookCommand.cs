using Database.Entities;
using MediatR;
using MongoDB.Bson;

namespace MediatorRequests.CreateBook
{
    public record CreateBookCommand : IRequest<Book>
    {
        public string Title { get; init; }
        
        public string AuthorId { get; init; }
        
        public float Rating { get; init; }
    }
}