using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database
{
    public class SportsContext : DbContext
    {
        public DbSet<Gender> Genders { get; set; }
        public DbSet<Person> People { get; set; }
        public DbSet<Competition> Competitions { get; set; }
        public DbSet<Sport> Sports { get; set; }
        public DbSet<CompetitionResult> Results { get; set; }

        protected SportsContext()
        {
        }

        public SportsContext(DbContextOptions<SportsContext> contextOptions) : base(contextOptions)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.GenderSetup();
            modelBuilder.SportSetup();
            modelBuilder.CompetitionSetup();
            modelBuilder.PersonSetup();
            modelBuilder.ResultSetup();
        }
    }
}