/**
 * One row per conversation, one cell per message, coloured by who answered.
 * Cells with no value yet (null) stay empty, so the grid can fill in column by column.
 * @param {{rows: (string|null)[][], label: string}} props
 */
export default function ProviderGrid({ rows, label }) {
  const turns = rows[0]?.length ?? 0
  return (
    <div className="grid" role="img" aria-label={label}>
      {rows.map((row, r) => (
        <div className="grid-row" key={r} style={{ gridTemplateColumns: `repeat(${turns}, 1fr)` }}>
          {row.map((cls, t) => <div key={t} className={`cell ${cls ?? ''}`} />)}
        </div>
      ))}
    </div>
  )
}
