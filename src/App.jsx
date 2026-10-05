const filteredAndSortedApplications = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return applications
      .filter((app) => {
        const currentRound =
          getDerivedRound(app);

        const matchesRound =
          selectedRound === 'All' ||
          currentRound === selectedRound;

        const company =
          app.company?.toLowerCase() || '';

        const role =
          app.role?.toLowerCase() || '';

        const matchesSearch =
          !query ||
          company.includes(query) ||
          role.includes(query);

        return (
          matchesRound &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        const dateA =
          a.appliedDate || '';

        const dateB =
          b.appliedDate || '';

        const dateDiff =
          dateB.localeCompare(dateA);

        if (dateDiff !== 0) {
          return dateDiff;
        }

        const timeA =
          new Date(
            a.createdAt || 0
          ).getTime();

        const timeB =
          new Date(
            b.createdAt || 0
          ).getTime();

        if (timeA !== timeB) {
          return timeB - timeA;
        }

        return String(
          b.id || ''
        ).localeCompare(
          String(a.id || '')
        );
      });
  }, [
    applications,
    searchQuery,
  ]); // Missing 'selectedRound' dependency
