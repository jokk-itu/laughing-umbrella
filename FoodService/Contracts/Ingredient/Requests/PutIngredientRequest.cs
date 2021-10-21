using System.ComponentModel.DataAnnotations;

namespace FoodService.Contracts.Ingredient.Requests
{
    public record PutIngredientRequest
    {
        [Required]
        public int Id { get; init; }
        
        [Required]
        public string Name {get; init; }
        
        [Required]
        public int Weight { get; init; }
    }
}