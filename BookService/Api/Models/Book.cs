using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Api.Models
{
    public class Book
    {
        [BsonId]
        public long Id { get; set; }
        
        public string Author { get; set; }
    }
}