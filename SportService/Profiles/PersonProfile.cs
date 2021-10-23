using AutoMapper;
using Contracts.Requests;
using Contracts.Responses;
using Database.Entities;
using Mediator.CreatePerson;

namespace Profiles
{
    public class PersonProfile : Profile
    {
        public PersonProfile()
        {
            SetupReadPerson();
            SetupCreatePerson();
        }

        private void SetupReadPerson()
        {
            CreateMap<Person, ReadPersonResponse>();
        }

        private void SetupCreatePerson()
        {
            CreateMap<CreatePersonRequest, CreatePersonCommand>();
            CreateMap<CreatePersonCommand, Person>();
            CreateMap<Person, CreatePersonResponse>();
        }
        
        //SetupDeletePerson
        //SetupUpdatePerson
        //SetupReadPersons
    }
}