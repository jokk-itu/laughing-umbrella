using MongoDB.Bson;

namespace Contracts
{
    public record CreateAuthorResponse
    {
        public string Id { get; init; }

        public string Name { get; init; }
        
        public CreateAuthorResponse()
        {
            
        }
    }
}