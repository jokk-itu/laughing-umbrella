using AutoMapper;
using Database.Entities.Nodes;
using FoodService.Contracts.Ingredient.Requests;
using FoodService.Contracts.Ingredient.Responses;
using MediatorRequests.CreateIngredient;
using MediatorRequests.UpdateIngredient;
using Neo4j.Driver;

namespace ObjectMapper
{
    public class IngredientProfile : Profile
    {
        public IngredientProfile()
        {
            Get();
            Create();
            Update();
            DataMap();
        }

        private void Get()
        {
            CreateMap<Ingredient, GetIngredientResponse>()
                .ForMember(dest => dest.Name, 
                    opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Weight, 
                    opt => opt.MapFrom(src => src.Weight));
        }

        private void Create()
        {
            CreateMap<PostIngredientRequest, CreateIngredientCommand>()
                .ForMember(dest => dest.Name,
                    opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Weight,
                    opt => opt.MapFrom(src => src.Weight));
            CreateMap<Ingredient, PostIngredientResponse>()
                .ForMember(dest => dest.Name,
                    opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Weight,
                    opt => opt.MapFrom(src => src.Weight));
        }
        
        private void Update()
        {
            CreateMap<PutIngredientRequest, UpdateIngredientCommand>()
                .ForMember(dest => dest.Id, opt => 
                    opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => 
                    opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Weight, opt => 
                    opt.MapFrom(src => src.Weight));
        }

        private void DataMap()
        {
            CreateMap<IRecord, Ingredient>()
                .ForMember(dest => dest.Id, 
                    opt => opt.MapFrom(src => src["id"]))
                .ForMember(dest => dest.Name, 
                    opt => opt.MapFrom(src => src["name"]))
                .ForMember(dest => dest.Weight, 
                    opt => opt.MapFrom(src => src["weight"]));
        }
    }
}