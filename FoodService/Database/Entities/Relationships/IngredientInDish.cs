namespace Database.Entities.Relationships
{
    public record IngredientInDish(string IngredientName = "", string DishName = "", int Quantity = 0, string Unit = "");
}