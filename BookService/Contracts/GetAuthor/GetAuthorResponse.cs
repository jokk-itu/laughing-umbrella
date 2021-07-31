using MongoDB.Bson;

namespace Contracts
{
    public record GetAuthorResponse
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public GetAuthorResponse()
        {
            
        }
    }
}