using AutoMapper;
using Contracts.Responses;
using Database.Entities;

namespace Profiles
{
    public class GenderProfile : Profile
    {
        public GenderProfile()
        {
            ReadGenders();
        }

        private void ReadGenders()
        {
            CreateMap<Gender, ReadGenderResponse>();
        }
    }
}