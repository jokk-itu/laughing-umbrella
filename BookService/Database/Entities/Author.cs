using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;

namespace Database.Entities
{
    public record Author
    {
        [BsonId(IdGenerator = typeof(StringObjectIdGenerator))]
        public string Id { get; init; }
        
        [BsonRequired]
        public string Name { get; init; }
    }
}