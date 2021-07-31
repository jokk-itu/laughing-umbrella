using System.Collections.Generic;
using Database.Entities;

namespace Contracts.GetBooks
{
    public record GetBooksResponse
    {
        public ICollection<Book> Books { get; init; }
        
        public GetBooksResponse(ICollection<Book> books)
        {
            Books = books;
        }

        public GetBooksResponse()
        {
            
        }
    }
}