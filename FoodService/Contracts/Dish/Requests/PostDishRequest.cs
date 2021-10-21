namespace FoodService.Contracts.Dish.Requests
{
    public record PostDishRequest
    {
        public string Name { get; init; }

        public int Price { get; init; }
    }
}