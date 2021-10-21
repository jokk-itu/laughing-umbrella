using AutoMapper;
using Database.Entities.Nodes;
using FoodService.Contracts.Dish.Requests;
using FoodService.Contracts.Dish.Responses;
using MediatorRequests.CreateDish;
using Neo4j.Driver;

namespace ObjectMapper
{
    public class DishProfile : Profile
    {
        public DishProfile()
        {
            Create();
            DataMap();
        }
        
        private void Create()
        {
            CreateMap<PostDishRequest, CreateDishCommand>();
            CreateMap<Dish, PostDishResponse>();
        }

        private void DataMap()
        {
            CreateMap<IRecord, Dish>()
                .ForMember(dest => dest.Id, 
                    opt => opt.MapFrom(src => src["id"]))
                .ForMember(dest => dest.Name, 
                    opt => opt.MapFrom(src => src["name"]))
                .ForMember(dest => dest.Price, 
                    opt => opt.MapFrom(src => src["price"]));
        }

    }
    
}