using Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace Database
{
    public static class EntitySetupExtensions
    {
        public static void SportSetup(this ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Sport>()
                .HasKey(s => s.Id);

            modelBuilder.Entity<Sport>()
                .Property(s => s.Name)
                .HasColumnName("name")
                .HasMaxLength(50)
                .IsRequired();

            modelBuilder.Entity<Sport>()
                .HasIndex(s => s.Name)
                .IsUnique();

            modelBuilder.Entity<Sport>()
                .Property(s => s.Record)
                .HasColumnName("record")
                .IsRequired(false);

            modelBuilder.Entity<Sport>()
                .HasData(new Sport {Id = 1, Name = "Football"}, new Sport {Id = 2, Name = "Basketball"}, new Sport {Id = 3, Name = "Wrestling"},
                    new Sport {Id = 4, Name = "Tennis"}, new Sport {Id = 5, Name = "Table tennis"}, new Sport {Id = 6, Name = "Hockey"});

            modelBuilder.Entity<Sport>()
                .ToTable("Sports");
        }

        public static void GenderSetup(this ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Gender>()
                .HasKey(g => g.Id);

            modelBuilder.Entity<Gender>()
                .Property(g => g.Description)
                .HasMaxLength(10)
                .HasColumnName("description");

            modelBuilder.Entity<Gender>().HasData(
                new Gender
            {
                Id = 1,
                Description = "Male"
            }, new Gender
            {
                Id = 2,
                Description = "Female"
            });

            modelBuilder.Entity<Gender>()
                .ToTable("Genders");
        }

        public static void ResultSetup(this ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CompetitionResult>()
                .HasKey(r => new {r.SportId, r.PersonId, r.CompetitionId});

            modelBuilder.Entity<CompetitionResult>()
                .HasOne(r => r.Competition);

            modelBuilder.Entity<CompetitionResult>()
                .HasOne(r => r.Person);

            modelBuilder.Entity<CompetitionResult>()
                .HasOne(r => r.Sport);

            modelBuilder.Entity<CompetitionResult>()
                .ToTable("CompetitionResults");
        }

        public static void PersonSetup(this ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Person>()
                .HasKey(p => p.Id);

            modelBuilder.Entity<Person>()
                .Property(p => p.Name)
                .HasMaxLength(50)
                .HasColumnName("name");

            modelBuilder.Entity<Person>()
                .HasIndex(p => p.Name)
                .IsUnique();

            modelBuilder.Entity<Person>()
                .Property(p => p.GenderId)
                .HasColumnName("genderId");

            modelBuilder.Entity<Person>()
                .Property(p => p.Height)
                .HasColumnName("height");

            modelBuilder.Entity<Person>()
                .HasOne(p => p.Gender);

            modelBuilder.Entity<Person>()
                .ToTable("Persons");
        }

        public static void CompetitionSetup(this ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Competition>()
                .HasKey(c => c.Id);

            modelBuilder.Entity<Competition>()
                .Property(c => c.Place)
                .HasMaxLength(50)
                .HasColumnName("place");

            modelBuilder.Entity<Competition>()
                .Property(c => c.Held)
                .HasColumnName("held");

            modelBuilder.Entity<Competition>()
                .ToTable("Competitions");
        }
    }
}