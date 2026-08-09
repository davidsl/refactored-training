using System;
using System.Collections.Generic;

namespace RefactoredWebapi.Models;

public partial class GameResult
{
    public long GameResultId { get; set; }

    public string PlayerName { get; set; } = null!;

    public string Difficulty { get; set; } = null!;

    public string Result { get; set; } = null!;

    public int DurationSeconds { get; set; }

    public int BoardWidth { get; set; }

    public int BoardHeight { get; set; }

    public int MinesCount { get; set; }

    public int MovesCount { get; set; }

    public int Score { get; set; }

    public DateTime PlayedAtUtc { get; set; }
}
