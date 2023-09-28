import { fetcher_post } from "utils/fetcher";


export async function apply_page_op_changes<In, Out>(
  pages: In
): Promise<Out> {
  return fetcher_post<In, Out>('/api/pages/', pages);
}
