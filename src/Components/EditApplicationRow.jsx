let newTransition = null;

if (formData.round !== application.round) {
      const generatedId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `trans-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      newTransition = {
        id: generatedId,
        from: currentRound,
        to: formData.round,
        changedAt: new Date().toISOString(),
      };

      updatedHistory.push(newTransition);
    }
// The comparison uses legacy 'application.round' instead of the currently derived round
