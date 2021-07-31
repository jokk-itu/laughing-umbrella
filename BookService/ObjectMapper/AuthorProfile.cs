using AutoMapper;
using Contracts;
using Database.Entities;
using MediatorRequests.CreateAuthor;

namespace ObjectMapper
{
    public class AuthorProfile : Profile
    {
        public AuthorProfile()
        {
            CreateAuthor();
            GetAuthor();
        }

        private void CreateAuthor()
        {
            CreateMap<CreateAuthorRequest, CreateAuthorCommand>();
            CreateMap<CreateAuthorCommand, Author>();
            CreateMap<Author, CreateAuthorResponse>();
        }

        private void GetAuthor()
        {
            CreateMap<Author, GetAuthorResponse>();
        }
    }
}