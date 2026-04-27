export type TextSearchFilter = {
  query: string;
  status?: string;
  category?: string;
};

export type TextSearchQuery = {
  filter: Record<string, unknown>;
};

export function buildTextSearchQuery(filter: TextSearchFilter): TextSearchQuery {
  const match: Record<string, unknown> = {
    $text: { $search: filter.query },
  };
  if (filter.status) match.status = filter.status;
  if (filter.category) match.category = filter.category;
  return { filter: match };
}

export const REPORT_TEXT_INDEX = {
  fields: { title: "text", description: "text" },
  options: { name: "report_text_search", default_language: "english" },
};