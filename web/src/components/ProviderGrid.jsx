// Rows drawn on the 3D floor. A taller floor recedes so far in perspective that it leaves a large
// empty band above it, so long runs show their first rows; stats still count every conversation.
const MAX_ROWS = 40

/**
 * One row per conversation, one cell per message, coloured by who answered.
 * Cells with no value yet (null) stay empty, so the grid can fill in column by column.
 * @param {{rows: (string|null)[][], label: string}} props
 */
export default function ProviderGrid({ rows, label }) {
  const turns = rows[0]?.length ?? 0
  const shown = rows.slice(0, MAX_ROWS)
  return (
    <div className="grid-stage">
      <div className="grid" role="img" aria-label={label}>
        {shown.map((row, r) => (
          <div className="grid-row" key={r} style={{ gridTemplateColumns: `repeat(${turns}, 1fr)` }}>
            {row.map((cls, t) => <div key={t} className={`cell ${cls ?? ''}`} />)}
          </div>
        ))}
      </div>
      {rows.length > shown.length ? (
        <p className="grid-note">Showing the first {shown.length} of {rows.length} conversations · the numbers below count all {rows.length}</p>
      ) : null}
    </div>
  )
}
