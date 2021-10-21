namespace FoodService.Contracts.Ingredient.Responses
{
    public record GetIngredientResponse
    {
        public int Id { get; init; }
        
        public string Name { get; init; }
        
        public int Weight { get; init; }
    }
}