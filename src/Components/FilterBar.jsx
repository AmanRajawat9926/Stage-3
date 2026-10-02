import { ROUNDS } from '../Utils/helpers';

function FilterBar({
  searchQuery = '',
  onSearchChange,
  selectedRound = 'All',
  onRoundChange,
  onKeyDown,
}) {
  const hasActiveFilter = searchQuery.trim() !== '' || selectedRound !== 'All';

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <section
      className={`filter-bar ${hasActiveFilter ? 'is-active' : ''}`}
      aria-label="Filter applications"
      onKeyDown={onKeyDown}
    >
      <div className="search-field">
        <label htmlFor="search-input" className="sr-only">
          Search by company or role
        </label>

        <div className="search-input-wrapper">
          <input
            id="search-input"
            type="search"
            placeholder="Search by company or role... (Esc to clear)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="filter-search-input"
          />

          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
              aria-label="Clear search input"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="filter-field">
        <label htmlFor="round-filter" className="sr-only">
          Filter by round
        </label>

        <select
          id="round-filter"
          value={selectedRound}
          onChange={(e) => onRoundChange(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Rounds</option>

          {ROUNDS.map((round) => (
            <option key={round} value={round}>
              {round}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default FilterBar;