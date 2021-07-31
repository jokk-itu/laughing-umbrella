namespace Contracts.CreateBook
{
    public record CreateBookRequest
    {
        public string AuthorId { get; set; }

        public string Title { get; set; }

        public float Rating { get; set; }
        
        public CreateBookRequest()
        {
            
        }
    }
}