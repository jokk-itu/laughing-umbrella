using System.Threading.Tasks;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace Api.Controllers
{
    [ApiController]
    [Route("weatherforecast")]
    public class BookController : ControllerBase
    {
        private readonly ILogger<BookController> _logger;
        private readonly MongoClient _client;

        public BookController(ILogger<BookController> logger)
        {
            _client = new MongoClient("mongodb://admin:admin@localhost:27017");
            _logger = logger;
        }

        [HttpGet]
        [Route("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var database = _client.GetDatabase("test");
            var collection = database.GetCollection<Book>("books");
            var book = await collection.FindAsync(b => b.Id == id);
            return Ok(await book.SingleAsync());
        }
        
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var database = _client.GetDatabase("test");
            var collection = database.GetCollection<Book>("books");
            var books = await collection.FindAsync(_ => true);
            return Ok(await books.ToListAsync());
        }
        
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Book book)
        {
            var database = _client.GetDatabase("test");
            var collection = database.GetCollection<Book>("books");
            await collection.InsertOneAsync(book);
            return Ok();
        }
    }
}
