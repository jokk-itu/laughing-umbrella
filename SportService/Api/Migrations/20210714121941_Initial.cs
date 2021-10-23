using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Api.Migrations
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Competitions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    place = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    held = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Competitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Genders",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    description = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Sports",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    record = table.Column<float>(type: "real", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Persons",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    genderId = table.Column<long>(type: "bigint", nullable: false),
                    height = table.Column<float>(type: "real", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Persons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Persons_Genders_genderId",
                        column: x => x.genderId,
                        principalTable: "Genders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompetitionResults",
                columns: table => new
                {
                    PersonId = table.Column<long>(type: "bigint", nullable: false),
                    CompetitionId = table.Column<long>(type: "bigint", nullable: false),
                    SportId = table.Column<long>(type: "bigint", nullable: false),
                    Result = table.Column<float>(type: "real", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionResults", x => new { x.SportId, x.PersonId, x.CompetitionId });
                    table.ForeignKey(
                        name: "FK_CompetitionResults_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionResults_Persons_PersonId",
                        column: x => x.PersonId,
                        principalTable: "Persons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionResults_Sports_SportId",
                        column: x => x.SportId,
                        principalTable: "Sports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Genders",
                columns: new[] { "Id", "description" },
                values: new object[,]
                {
                    { 1L, "Male" },
                    { 2L, "Female" }
                });

            migrationBuilder.InsertData(
                table: "Sports",
                columns: new[] { "Id", "name", "record" },
                values: new object[,]
                {
                    { 1L, "Football", null },
                    { 2L, "Basketball", null },
                    { 3L, "Wrestling", null },
                    { 4L, "Tennis", null },
                    { 5L, "Table tennis", null },
                    { 6L, "Hockey", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionResults_CompetitionId",
                table: "CompetitionResults",
                column: "CompetitionId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionResults_PersonId",
                table: "CompetitionResults",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Persons_genderId",
                table: "Persons",
                column: "genderId");

            migrationBuilder.CreateIndex(
                name: "IX_Persons_name",
                table: "Persons",
                column: "name",
                unique: true,
                filter: "[name] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Sports_name",
                table: "Sports",
                column: "name",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompetitionResults");

            migrationBuilder.DropTable(
                name: "Competitions");

            migrationBuilder.DropTable(
                name: "Persons");

            migrationBuilder.DropTable(
                name: "Sports");

            migrationBuilder.DropTable(
                name: "Genders");
        }
    }
}
