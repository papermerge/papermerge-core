import type { PageAndRotOp, PageType } from "types";
import { fetcher_post } from "utils/fetcher";


export async function apply_page_op_changes(
  pages: PageAndRotOp[]
): Promise<PageType[]> {
  return fetcher_post<PageAndRotOp[], PageType[]>('/pages/reorder', pages);
}
