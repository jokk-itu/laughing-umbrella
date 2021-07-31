using MongoDB.Bson;

namespace Contracts.GetBook
{
    public record GetBookResponse
    {
        public string Id { get; init; }
        
        public string AuthorId { get; init; }
        
        public string Title { get; init; }
        
        public float Rating { get; init; }
    }
}