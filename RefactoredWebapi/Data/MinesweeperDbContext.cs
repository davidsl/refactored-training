using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using RefactoredWebapi.Models;

namespace RefactoredWebapi.Data;

public partial class MinesweeperDbContext : DbContext
{
    public MinesweeperDbContext()
    {
    }

    public MinesweeperDbContext(DbContextOptions<MinesweeperDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<GameResult> GameResults { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameResult>(entity =>
        {
            entity.HasIndex(e => e.PlayedAtUtc, "IX_GameResults_PlayedAtUtc").IsDescending();

            entity.HasIndex(e => new { e.PlayerName, e.PlayedAtUtc }, "IX_GameResults_Player_PlayedAtUtc").IsDescending(false, true);

            entity.Property(e => e.Difficulty).HasMaxLength(20);
            entity.Property(e => e.PlayedAtUtc)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_GameResults_PlayedAtUtc");
            entity.Property(e => e.PlayerName).HasMaxLength(100);
            entity.Property(e => e.Result).HasMaxLength(10);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
