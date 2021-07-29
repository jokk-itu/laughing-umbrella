using AutoMapper;
using Contracts.Ingredient.Request;
using Contracts.Ingredient.Responses;
using Database.Entities.Nodes;
using MediatorRequests.Requests.CreateIngredient;
using Neo4j.Driver;

namespace ObjectMapper
{
    public class IngredientProfile : Profile
    {
        public IngredientProfile()
        {
            Get();
            Create();
            DataMap();
        }

        private void Get()
        {
            CreateMap<Ingredient, GetIngredientResponse>()
                .ForMember(
                    dest => dest.Name, 
                    opt => opt.MapFrom(src => src.Name))
                .ForMember(
                    dest => dest.Supplier, 
                    opt => opt.MapFrom(src => src.Supplier));
        }

        private void Create()
        {
            CreateMap<CreateIngredientRequest, CreateIngredientCommand>()
                .ForMember(dest => dest.Name,
                    opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Supplier,
                    opt => opt.MapFrom(src => src.Supplier));
            CreateMap<Ingredient, CreateIngredientResponse>()
                .ForMember(dest => dest.Name,
                    opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Supplier,
                    opt => opt.MapFrom(src => src.Supplier));
        }

        private void DataMap()
        {
            CreateMap<IRecord, Ingredient>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src["id"]))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src["name"]))
                .ForMember(dest => dest.Supplier, opt => opt.MapFrom(src => src["supplier"]));
        }
    }
}