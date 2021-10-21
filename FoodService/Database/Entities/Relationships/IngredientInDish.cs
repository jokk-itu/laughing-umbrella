namespace Database.Entities.Relationships
{
    public record IngredientInDish
    {
        public int IngredientId { get; set; }
        
        public int DishId { get; set; }

        public int Quantity { get; set; }

        public string Unit { get; set; }
    }
}