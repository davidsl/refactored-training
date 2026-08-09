using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RefactoredWebapi.Data;
using RefactoredWebapi.Models;

namespace RefactoredWebapi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class GameResultsController : ControllerBase
    {
        private readonly MinesweeperDbContext _context;

        public GameResultsController(MinesweeperDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GameResult>>> GetGameResults()
        {
            return await _context.GameResults
                .OrderByDescending(x => x.PlayedAtUtc)
                .ToListAsync();
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<GameResult>> GetGameResult(long id)
        {
            var gameResult = await _context.GameResults.FindAsync(id);

            if (gameResult is null)
            {
                return NotFound();
            }

            return gameResult;
        }

        [HttpPost]
        public async Task<ActionResult<GameResult>> PostGameResult(GameResult gameResult)
        {
            _context.GameResults.Add(gameResult);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGameResult), new { id = gameResult.GameResultId }, gameResult);
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> PutGameResult(long id, GameResult gameResult)
        {
            if (id != gameResult.GameResultId)
            {
                return BadRequest();
            }

            _context.Entry(gameResult).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await GameResultExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteGameResult(long id)
        {
            var gameResult = await _context.GameResults.FindAsync(id);
            if (gameResult is null)
            {
                return NotFound();
            }

            _context.GameResults.Remove(gameResult);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> GameResultExists(long id)
        {
            return await _context.GameResults.AnyAsync(e => e.GameResultId == id);
        }
    }
}
