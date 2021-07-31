using MongoDB.Driver;
using Database.Entities;

namespace Database
{
    public class MongoContext
    {
        public IMongoCollection<Book> Books { get; }
        public IMongoCollection<Author> Authors { get; }

        public MongoContext(IMongoDatabase database)
        {
            Books = database.GetCollection<Book>("books");
            Authors = database.GetCollection<Author>("authors");
        }
    }
}