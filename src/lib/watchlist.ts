import { formatDate, normalizedSearch, type EtfProfile } from "./etfs/catalog";

export type WatchlistStatus = "active" | "inactive";
export type WatchlistEventType = "follow" | "unfollow" | "resume";

export type WatchlistItem = {
  id: string;
  listing_id: string;
  status: WatchlistStatus;
  first_followed_at: string;
  status_changed_at: string;
};

export type WatchlistEvent = {
  id: string;
  listing_id: string;
  action: WatchlistEventType;
  occurred_at: string;
};

export type WatchlistViewItem = {
  profile: EtfProfile;
  saved: WatchlistItem | null;
  isFollowing: boolean;
};

export const UUID_PATTERN = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;

export function parseFollowCommand(
  listingId: FormDataEntryValue | null,
  mode: FormDataEntryValue | null,
): { listingId: string; follow: boolean } | null {
  if (typeof listingId !== "string" || !UUID_PATTERN.test(listingId) ||
      typeof mode !== "string" || !["follow", "unfollow"].includes(mode)) {
    return null;
  }
  return { listingId, follow: mode === "follow" };
}

export function buildWatchlistView(
  profiles: readonly EtfProfile[],
  items: readonly WatchlistItem[],
): WatchlistViewItem[] {
  const byListing = new Map(items.map((item) => [item.listing_id, item]));
  return profiles.map((profile) => {
    const saved = byListing.get(profile.listingId) ?? null;
    return {
      profile, saved,
      isFollowing: saved?.status === "active",
    };
  });
}

export function searchWatchlistView(
  rows: readonly WatchlistViewItem[],
  query: string,
): WatchlistViewItem[] {
  const q = normalizedSearch(query).slice(0, 120);
  if (!q) return [...rows];
  return rows.filter(({ profile }) =>
    [profile.ticker, profile.name, profile.isin, profile.exchange, profile.issuer]
      .some((value) => normalizedSearch(value ?? "").includes(q)),
  );
}

export function watchlistDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
  }).format(date);
}

export function watchlistEventText(action: WatchlistEventType): string {
  switch (action) {
    case "follow": return "Agregado al seguimiento";
    case "resume": return "Seguimiento reanudado";
    case "unfollow": return "Se dejó de seguir";
  }
}

export function watchlistNotice(value: string | undefined): string | null {
  switch (value) {
    case "followed": return "Activo agregado a tu lista de seguimiento.";
    case "resumed": return "Volviste a seguir este activo; se conserva su historial anterior.";
    case "unfollowed": return "Dejaste de seguir el activo. Sus eventos anteriores siguen disponibles.";
    case "already_following": return "Ese activo ya estaba en tu lista.";
    case "already_inactive": return "Ese activo ya estaba retirado del seguimiento.";
    case "not_following": return "Este activo no estaba en tu lista.";
    case "invalid": return "El identificador o la acción no son válidos.";
    case "save": return "No pudimos actualizar el seguimiento. Comprueba la sesión y la migración.";
    default: return null;
  }
}

/** Followed is an interest flag; never equate it with a financial position. */
export function watchlistAsOfText(profile: EtfProfile): string {
  const ter = profile.metrics.ter_percent;
  return ter?.availability === "disponible" && ter.asOfDate
    ? "TER documentado al " + formatDate(ter.asOfDate)
    : "TER no disponible con fuente y fecha";
}
