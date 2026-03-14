/**
 * Legacy extension options as stored in the old persisted format.
 *
 * Most values are wrapped in `{ value: ... }` and may contain strings where
 * newer code would expect booleans or numbers.
 */
export type LegacyOptions = {
  /** UI theme, typically `"dark"` or `"light"`. */
  theme?: { value?: string };

  /**
   * Days on which blocking is active.
   * Only applies when `scheduleBlocking` is enabled.
   */
  activeDays?: {
    value?: Array<{
      /** Day label, for example `"Monday"`. */
      label?: string;
      /** Whether the day is enabled; may be stored as a boolean or string. */
      value?: boolean | string;
    }>;
  };

  /**
   * Start/end time range during which blocking is active.
   * Only applies when `scheduleBlocking` is enabled.
   */
  activeTimes?: {
    value?: {
      /** Whether blocking should apply for the whole day. */
      allDay?: { value?: boolean | string };
      /** End time, usually in string form. */
      end?: { value?: string };
      /** Start time, usually in string form. */
      start?: { value?: string };
    };
  };

  /** Whether the user has reviewed or rated the extension. */
  isRated?: { value?: boolean | string };

  /**
   * Whether a site can remain temporarily unblocked after the user unblocks it.
   */
  allowRevisits?: { value?: boolean | string };

  /**
   * Duration for which a page remains unblocked after a user unblock.
   * Only applies when `allowRevisits` is enabled.
   */
  revisitLimit?: { value?: number | string };

  /** How long the user must hold the unblock button. */
  unblockTimeout?: { value?: number | string };

  /** Whether blocking should only apply during configured days/times. */
  scheduleBlocking?: { value?: boolean | string };
};

/**
 * Legacy blocked-provider entry from the old persisted format.
 */
export type LegacyProvider = {
  /** Unique identifier for the provider entry. */
  id?: string;

  /** Hostname or domain this provider applies to. */
  hostname?: string;

  /** Whether matching is path-based rather than hostname-only. */
  isByPath?: boolean | string;

  /** Date the provider was added. */
  dateAdded?: string;

  /** Whether the provider is currently marked as unblocked. */
  unblocked?: boolean | string;

  /** Timestamp of the last unblock action. */
  lastUnblock?: string;
};
