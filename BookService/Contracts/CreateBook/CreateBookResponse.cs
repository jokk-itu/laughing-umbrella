using MongoDB.Bson;

namespace Contracts.CreateBook
{
    public record CreateBookResponse
    {
        public string Id { get; init; }    
        
        public string AuthorId { get; init; }

        public string Title { get; init; }

        public float Rating { get; init; }
        
        public CreateBookResponse()
        {
            
        }
    }
}