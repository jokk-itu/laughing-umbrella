using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;

namespace Database.Entities
{
    public record Book
    {
        [BsonId(IdGenerator = typeof(StringObjectIdGenerator))]
        public string Id { get; init; }
        
        [BsonRequired]
        public string Title { get; init; }
        
        [BsonRequired]
        [BsonElement("author_id")]
        public string AuthorId { get; init; }

        private readonly float _rating;
        
        [BsonIgnoreIfNull]
        public float Rating
        {
            get => _rating;
            init
            {
                if (value is > 5 or < 1)
                    throw new ArgumentException("Rating must be within 5 and 1 inclusive");
                
                _rating = value;
            }
        }
    }
}