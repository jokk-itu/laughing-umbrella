using System.ComponentModel.DataAnnotations;

namespace FoodService.Contracts.Ingredient.Requests
{
    public record PostIngredientRequest
    {
        [Required]
        public string Name {get; init; }
        
        [Required]
        public int Weight { get; init; }
    }
}