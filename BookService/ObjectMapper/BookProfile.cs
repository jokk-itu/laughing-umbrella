using AutoMapper;
using Contracts.CreateBook;
using Contracts.GetBook;
using Database.Entities;
using MediatorRequests.CreateBook;
using MediatorRequests.GetBook;

namespace ObjectMapper
{
    public class BookProfile : Profile
    {
        public BookProfile()
        {
            CreateBook();
            GetBook();
            GetBooks();
        }

        private void CreateBook()
        {
            CreateMap<CreateBookRequest, CreateBookCommand>();
            CreateMap<Book, CreateBookResponse>();
            CreateMap<CreateBookCommand, Book>();
        }

        private void GetBook()
        {
            CreateMap<GetBookQuery, Book>();
            CreateMap<Book, GetBookResponse>();
        }

        private void GetBooks()
        {
            
        }
        
    }
}